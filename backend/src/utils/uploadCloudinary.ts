import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadResponse {
  success: boolean;
  url: string | null;
  publicId: string | null;
  error: string | null;
}

interface CloudinaryUploadOptions {
  [key: string]: unknown;
}

/**
 * Uploads an image from a public URL to Cloudinary.
 *
 * @param imageUrl - A valid, publicly accessible image URL.
 * @param options - Optional Cloudinary upload options (folder, public_id, etc.)
 * @returns Upload result with success status, URL, public ID, and error message.
 */
async function uploadImageFromUrl(
  imageUrl: string,
  options: CloudinaryUploadOptions = {}
): Promise<UploadResponse> {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return {
      success: false,
      url: null,
      publicId: null,
      error: 'Invalid image URL provided.',
    };
  }

  try {
    new URL(imageUrl);
  } catch {
    return {
      success: false,
      url: null,
      publicId: null,
      error: 'Malformed URL: could not parse the provided image URL.',
    };
  }

  try {
    const result = await cloudinary.v2.uploader.upload(imageUrl, {
      resource_type: 'image',
      ...options,
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      error: null,
    };
  } catch (err) {
    const message =
      (err as any)?.error?.message ||
      (err as Error)?.message ||
      'Unknown Cloudinary upload error.';

    return {
      success: false,
      url: null,
      publicId: null,
      error: message,
    };
  }
}

interface DeleteResponse {
  success: boolean;
  result: string | null;
  error: string | null;
}

async function deleteImageFromCloudinary(
  publicId: string
): Promise<DeleteResponse> {
  if (!publicId || typeof publicId !== 'string') {
    return {
      success: false,
      result: null,
      error: 'Invalid public ID provided.',
    };
  }

  try {
    const result = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    // Cloudinary returns { result: 'ok' } on success, { result: 'not found' } if ID doesn't exist
    if (result.result === 'ok') {
      return { success: true, result: result.result, error: null };
    }

    return {
      success: false,
      result: result.result,
      error: `Cloudinary responded with: "${result.result}"`,
    };
  } catch (err) {
    const message =
      (err as any)?.error?.message ||
      (err as Error)?.message ||
      'Unknown Cloudinary delete error.';

    return { success: false, result: null, error: message };
  }
}

export { uploadImageFromUrl, deleteImageFromCloudinary };
