import axios, { AxiosError } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import Social from '../models/Social';
import { ITokenPayload } from '@/types/index';

const FACEBOOK_GRAPH_BASE_URL = 'https://graph.facebook.com/v25.0';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
}

interface FacebookPageListResponse {
  data: FacebookPage[];
}

type PublishMediaType = 'image' | 'video';

interface PublishFacebookPageBody {
  pageId: string;
  pageAccessToken: string;
  mediaType: PublishMediaType;
  caption?: string;
  title?: string;
  mediaUrl?: string;
  mediaBase64?: string;
  fileName?: string;
  contentType?: string;
}

type UploadedFacebookMedia = Pick<
  Express.Multer.File,
  'buffer' | 'mimetype' | 'originalname'
>;

interface FacebookPublishConfig {
  endpoint: string;
  captionFieldName: string;
  mediaType: PublishMediaType;
  responseMediaType: string;
  successMessage: string;
}

interface FacebookReelStartResponse {
  video_id: string;
  upload_url?: string;
}

interface FacebookStoryVideoStartResponse {
  video_id: string;
  upload_url?: string;
}

const isImageMediaType = (contentType?: string) =>
  Boolean(contentType?.toLowerCase().startsWith('image/'));

const isVideoMediaType = (contentType?: string) =>
  Boolean(contentType?.toLowerCase().startsWith('video/'));

const extractBase64Payload = (rawBase64: string) => {
  const dataUriMatch = rawBase64.match(/^data:(.+?);base64,(.+)$/);

  if (dataUriMatch) {
    return {
      contentType: dataUriMatch[1],
      buffer: Buffer.from(dataUriMatch[2], 'base64'),
    };
  }

  return {
    contentType: undefined,
    buffer: Buffer.from(rawBase64, 'base64'),
  };
};

const getFileName = (mediaType: PublishMediaType, fileName?: string) => {
  if (fileName?.trim()) {
    return fileName.trim();
  }

  return mediaType === 'image'
    ? 'facebook-image-upload'
    : 'facebook-video-upload';
};

const inferContentType = (
  mediaType: PublishMediaType,
  explicitContentType?: string,
  derivedContentType?: string
) => {
  if (explicitContentType) {
    return explicitContentType;
  }

  if (derivedContentType) {
    return derivedContentType;
  }

  return mediaType === 'image' ? 'image/jpeg' : 'video/mp4';
};

const buildMultipartPayload = ({
  fields,
  fileFieldName,
  fileName,
  contentType,
  fileBuffer,
}: {
  fields: Record<string, string>;
  fileFieldName: string;
  fileName: string;
  contentType: string;
  fileBuffer: Buffer;
}) => {
  const boundary = `--------------------------${Date.now().toString(16)}`;
  const chunks: Buffer[] = [];

  Object.entries(fields).forEach(([key, value]) => {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
          `${value}\r\n`
      )
    );
  });

  chunks.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${fileFieldName}"; filename="${fileName}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`
    )
  );
  chunks.push(fileBuffer);
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  return {
    boundary,
    body: Buffer.concat(chunks),
  };
};

const fetchMediaFromUrl = async (mediaUrl: string) => {
  const response = await axios.get<ArrayBuffer>(mediaUrl, {
    responseType: 'arraybuffer',
  });

  return {
    buffer: Buffer.from(response.data),
    contentType: response.headers['content-type'] as string | undefined,
  };
};

const getReelUploadUrl = (videoId: string, uploadUrl?: string) =>
  uploadUrl ||
  `https://rupload.facebook.com/video-upload/${FACEBOOK_GRAPH_BASE_URL.split('/').pop()}/${videoId}`;

const createHttpError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & {
    statusCode?: number;
    isOperational?: boolean;
  };
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

const normalizeMediaInput = async ({
  mediaType,
  mediaUrl,
  mediaBase64,
  contentType,
  uploadedFile,
}: Pick<
  PublishFacebookPageBody,
  'mediaType' | 'mediaUrl' | 'mediaBase64' | 'contentType'
> & {
  uploadedFile?: UploadedFacebookMedia;
}) => {
  if (uploadedFile) {
    return {
      buffer: uploadedFile.buffer,
      contentType: inferContentType(
        mediaType,
        contentType,
        uploadedFile.mimetype
      ),
    };
  }

  if (mediaUrl) {
    const downloadedMedia = await fetchMediaFromUrl(mediaUrl);
    const resolvedContentType = inferContentType(
      mediaType,
      contentType,
      downloadedMedia.contentType
    );

    return {
      buffer: downloadedMedia.buffer,
      contentType: resolvedContentType,
    };
  }

  if (!mediaBase64) {
    throw createHttpError('Either mediaUrl or mediaBase64 is required', 400);
  }

  const decodedMedia = extractBase64Payload(mediaBase64);
  const resolvedContentType = inferContentType(
    mediaType,
    contentType,
    decodedMedia.contentType
  );

  return {
    buffer: decodedMedia.buffer,
    contentType: resolvedContentType,
  };
};

const resolveStoryMediaInput = async ({
  mediaUrl,
  mediaBase64,
  contentType,
  uploadedFile,
}: Pick<PublishFacebookPageBody, 'mediaUrl' | 'mediaBase64' | 'contentType'> & {
  uploadedFile?: UploadedFacebookMedia;
}) => {
  if (uploadedFile) {
    const resolvedContentType =
      contentType || uploadedFile.mimetype || 'application/octet-stream';

    if (isImageMediaType(resolvedContentType)) {
      return {
        buffer: uploadedFile.buffer,
        contentType: resolvedContentType,
        mediaType: 'image' as const,
      };
    }

    if (isVideoMediaType(resolvedContentType)) {
      return {
        buffer: uploadedFile.buffer,
        contentType: resolvedContentType,
        mediaType: 'video' as const,
      };
    }
  }

  if (mediaUrl) {
    const downloadedMedia = await fetchMediaFromUrl(mediaUrl);
    const resolvedContentType =
      contentType || downloadedMedia.contentType || 'application/octet-stream';

    if (isImageMediaType(resolvedContentType)) {
      return {
        buffer: downloadedMedia.buffer,
        contentType: resolvedContentType,
        mediaType: 'image' as const,
      };
    }

    if (isVideoMediaType(resolvedContentType)) {
      return {
        buffer: downloadedMedia.buffer,
        contentType: resolvedContentType,
        mediaType: 'video' as const,
      };
    }
  }

  if (mediaBase64) {
    const decodedMedia = extractBase64Payload(mediaBase64);
    const resolvedContentType =
      contentType || decodedMedia.contentType || 'application/octet-stream';

    if (isImageMediaType(resolvedContentType)) {
      return {
        buffer: decodedMedia.buffer,
        contentType: resolvedContentType,
        mediaType: 'image' as const,
      };
    }

    if (isVideoMediaType(resolvedContentType)) {
      return {
        buffer: decodedMedia.buffer,
        contentType: resolvedContentType,
        mediaType: 'video' as const,
      };
    }
  }

  throw createHttpError(
    'Story media must be an image or video. Provide a valid file or contentType.',
    400
  );
};

const validateMediaContentType = (
  mediaType: PublishMediaType,
  contentType: string
) => {
  if (mediaType === 'image' && !isImageMediaType(contentType)) {
    throw createHttpError('Provided media is not an image', 400);
  }

  if (mediaType === 'video' && !isVideoMediaType(contentType)) {
    throw createHttpError('Provided media is not a video', 400);
  }
};

const mapFacebookError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const facebookError = axiosError.response?.data?.error;

    if (facebookError?.message) {
      const mappedError = createHttpError(
        facebookError.message,
        axiosError.response?.status || 502
      );
      return mappedError;
    }

    return createHttpError(
      axiosError.message,
      axiosError.response?.status || 502
    );
  }

  return error;
};

const startFacebookReelUpload = async (pageAccessToken: string) => {
  const response = await axios.post<FacebookReelStartResponse>(
    `${FACEBOOK_GRAPH_BASE_URL}/me/video_reels`,
    null,
    {
      params: {
        access_token: pageAccessToken,
        upload_phase: 'start',
      },
    }
  );

  return response.data;
};

const uploadFacebookHostedReel = async ({
  uploadUrl,
  pageAccessToken,
  mediaUrl,
}: {
  uploadUrl: string;
  pageAccessToken: string;
  mediaUrl: string;
}) => {
  await axios.post(uploadUrl, null, {
    headers: {
      Authorization: `OAuth ${pageAccessToken}`,
      file_url: mediaUrl,
      'User-Agent': 'Postman/FacebookCollection',
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
};

const uploadFacebookLocalReel = async ({
  uploadUrl,
  pageAccessToken,
  fileBuffer,
}: {
  uploadUrl: string;
  pageAccessToken: string;
  fileBuffer: Buffer;
}) => {
  await axios.post(uploadUrl, fileBuffer, {
    headers: {
      Authorization: `OAuth ${pageAccessToken}`,
      offset: '0',
      file_size: fileBuffer.length.toString(),
      'Content-Type': 'application/octet-stream',
      'User-Agent': 'Postman/FacebookCollection',
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
};

const finishFacebookReelUpload = async ({
  pageAccessToken,
  videoId,
  description,
  title,
}: {
  pageAccessToken: string;
  videoId: string;
  description?: string;
  title?: string;
}) => {
  const response = await axios.post(
    `${FACEBOOK_GRAPH_BASE_URL}/me/video_reels`,
    null,
    {
      params: {
        access_token: pageAccessToken,
        video_id: videoId,
        upload_phase: 'finish',
        video_state: 'PUBLISHED',
        ...(description ? { description } : {}),
        ...(title ? { title } : {}),
      },
    }
  );

  return response.data;
};

const startFacebookStoryVideoUpload = async ({
  pageId,
  pageAccessToken,
}: {
  pageId: string;
  pageAccessToken: string;
}) => {
  const response = await axios.post<FacebookStoryVideoStartResponse>(
    `${FACEBOOK_GRAPH_BASE_URL}/${pageId}/video_stories`,
    null,
    {
      params: {
        access_token: pageAccessToken,
        upload_phase: 'start',
      },
    }
  );

  return response.data;
};

const finishFacebookStoryVideoUpload = async ({
  pageId,
  pageAccessToken,
  videoId,
}: {
  pageId: string;
  pageAccessToken: string;
  videoId: string;
}) => {
  const response = await axios.post(
    `${FACEBOOK_GRAPH_BASE_URL}/${pageId}/video_stories`,
    null,
    {
      params: {
        access_token: pageAccessToken,
        video_id: videoId,
        upload_phase: 'finish',
      },
    }
  );

  return response.data;
};

const publishMediaToFacebook = async (
  req: Request,
  res: Response,
  {
    endpoint,
    captionFieldName,
    mediaType,
    responseMediaType,
    successMessage,
  }: FacebookPublishConfig
) => {
  const {
    pageId,
    pageAccessToken,
    caption,
    mediaUrl,
    mediaBase64,
    fileName,
    contentType,
  } = req.body as PublishFacebookPageBody;
  const uploadedFile = req.file;

  const normalizedMedia = await normalizeMediaInput({
    mediaType,
    mediaUrl,
    mediaBase64,
    contentType,
    uploadedFile,
  });

  validateMediaContentType(mediaType, normalizedMedia.contentType);

  const multipartPayload = buildMultipartPayload({
    fields: {
      access_token: pageAccessToken,
      ...(caption ? { [captionFieldName]: caption } : {}),
    },
    fileFieldName: 'source',
    fileName: getFileName(mediaType, fileName || uploadedFile?.originalname),
    contentType: normalizedMedia.contentType,
    fileBuffer: normalizedMedia.buffer,
  });

  const response = await axios.post(
    `${FACEBOOK_GRAPH_BASE_URL}/${pageId}/${endpoint}`,
    multipartPayload.body,
    {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${multipartPayload.boundary}`,
        'Content-Length': multipartPayload.body.length.toString(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  );

  logger.info('Facebook Page publish completed', {
    pageId,
    mediaType: responseMediaType,
    responseId: response.data?.id,
    postId: response.data?.post_id,
    userId: req.user?.userId,
  });

  res.status(200).json({
    success: true,
    data: {
      id: response.data?.id,
      postId: response.data?.post_id,
      mediaType: responseMediaType,
    },
    message: successMessage,
  });
};

export const attachPageToken = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = req.user as ITokenPayload;
    console.log('hello');

    // find the social account by the user id
    const social = await Social.findOne<any>({ user: payload.userId });
    if (!social || !social.meta_auth_token)
      return res
        .status(400)
        .json({ success: false, message: 'user socials not found' });

    const userAccessToken = social.meta_auth_token;

    const response = await axios.get<FacebookPageListResponse>(
      `${FACEBOOK_GRAPH_BASE_URL}/me/accounts`,
      {
        params: {
          access_token: userAccessToken,
        },
      }
    );

    const data = response.data.data[0];
    req.body.pageAccessToken = data.access_token;
    req.body.pageId = data.id;

    next();
  } catch (err: any) {
    console.log(err?.response?.data);
    throw mapFacebookError(err);
  }
};

export const getUserPages = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { userAccessToken } = req.body as { userAccessToken: string };

      const response = await axios.get<FacebookPageListResponse>(
        `${FACEBOOK_GRAPH_BASE_URL}/me/accounts`,
        {
          params: {
            access_token: userAccessToken,
          },
        }
      );

      res.status(200).json({
        success: true,
        data: response.data.data,
        message: 'Facebook pages fetched successfully',
      });
    } catch (error) {
      console.log(error);
      throw mapFacebookError(error);
    }
  }
);

export const publishImageToFacebook = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await publishMediaToFacebook(req, res, {
        endpoint: 'photos',
        captionFieldName: 'caption',
        mediaType: 'image',
        responseMediaType: 'image',
        successMessage: 'Published image to Facebook Page successfully',
      });
    } catch (error) {
      throw mapFacebookError(error);
    }
  }
);

export const publishReelToFacebook = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const {
        pageAccessToken,
        caption,
        title,
        mediaUrl,
        mediaBase64,
        contentType,
      } = req.body as PublishFacebookPageBody;
      const uploadedFile = req.file;

      const reelSession = await startFacebookReelUpload(pageAccessToken);
      const uploadUrl = getReelUploadUrl(
        reelSession.video_id,
        reelSession.upload_url
      );

      if (mediaUrl) {
        await uploadFacebookHostedReel({
          uploadUrl,
          pageAccessToken,
          mediaUrl,
        });
      } else {
        const normalizedMedia = await normalizeMediaInput({
          mediaType: 'video',
          mediaBase64,
          contentType,
          uploadedFile,
        });

        validateMediaContentType('video', normalizedMedia.contentType);

        await uploadFacebookLocalReel({
          uploadUrl,
          pageAccessToken,
          fileBuffer: normalizedMedia.buffer,
        });
      }

      await finishFacebookReelUpload({
        pageAccessToken,
        videoId: reelSession.video_id,
        description: caption,
        title,
      });

      logger.info('Facebook Reel publish completed', {
        responseId: reelSession.video_id,
        userId: req.user?.userId,
      });

      res.status(200).json({
        success: true,
        data: {
          id: reelSession.video_id,
          mediaType: 'reel',
        },
        message: 'Published reel to Facebook Page successfully',
      });
    } catch (error) {
      throw mapFacebookError(error);
    }
  }
);

export const PublishVideoToFacebook = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await publishMediaToFacebook(req, res, {
        endpoint: 'videos',
        captionFieldName: 'description',
        mediaType: 'video',
        responseMediaType: 'video',
        successMessage: 'Published video to Facebook Page successfully',
      });
    } catch (error) {
      throw mapFacebookError(error);
    }
  }
);

export const publishStoryToFacebook = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const {
        pageId,
        pageAccessToken,
        mediaUrl,
        mediaBase64,
        contentType,
        fileName,
      } = req.body as PublishFacebookPageBody;
      const uploadedFile = req.file;

      const storyMedia = await resolveStoryMediaInput({
        mediaUrl,
        mediaBase64,
        contentType,
        uploadedFile,
      });

      if (storyMedia.mediaType === 'video') {
        const storySession = await startFacebookStoryVideoUpload({
          pageId,
          pageAccessToken,
        });
        const uploadUrl = getReelUploadUrl(
          storySession.video_id,
          storySession.upload_url
        );

        if (mediaUrl) {
          await uploadFacebookHostedReel({
            uploadUrl,
            pageAccessToken,
            mediaUrl,
          });
        } else {
          await uploadFacebookLocalReel({
            uploadUrl,
            pageAccessToken,
            fileBuffer: storyMedia.buffer,
          });
        }

        const response = await finishFacebookStoryVideoUpload({
          pageId,
          pageAccessToken,
          videoId: storySession.video_id,
        });

        logger.info('Facebook Story publish completed', {
          pageId,
          mediaType: storyMedia.mediaType,
          responseId: response.data?.id || storySession.video_id,
          userId: req.user?.userId,
        });

        return res.status(200).json({
          success: true,
          data: {
            id: response.data?.id || storySession.video_id,
            mediaType: 'story',
            storyMediaType: storyMedia.mediaType,
          },
          message: 'Published story to Facebook Page successfully',
        });
      }

      const multipartPayload = buildMultipartPayload({
        fields: {
          access_token: pageAccessToken,
        },
        fileFieldName: 'source',
        fileName: getFileName(
          storyMedia.mediaType,
          fileName || uploadedFile?.originalname
        ),
        contentType: storyMedia.contentType,
        fileBuffer: storyMedia.buffer,
      });

      const response = await axios.post(
        `${FACEBOOK_GRAPH_BASE_URL}/${pageId}/photo_stories`,
        multipartPayload.body,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${multipartPayload.boundary}`,
            'Content-Length': multipartPayload.body.length.toString(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      logger.info('Facebook Story publish completed', {
        pageId,
        mediaType: storyMedia.mediaType,
        responseId: response.data?.id,
        userId: req.user?.userId,
      });

      res.status(200).json({
        success: true,
        data: {
          id: response.data?.id,
          mediaType: 'story',
          storyMediaType: storyMedia.mediaType,
        },
        message: 'Published story to Facebook Page successfully',
      });
    } catch (error) {
      throw mapFacebookError(error);
    }
  }
);

export const publishToFacebookPage = asyncHandler(
  async (req: Request, res: Response) => {
    const { mediaType } = req.body as PublishFacebookPageBody;

    if (mediaType === 'image') {
      return publishImageToFacebook(req, res, () => undefined);
    }

    return PublishVideoToFacebook(req, res, () => undefined);
  }
);
