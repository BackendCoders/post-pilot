import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').min(1, 'Email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    userName: z
      .string()
      .min(1, 'User Name is required')
      .max(50, 'User Name cannot exceed 50 characters')
      .trim(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email().min(1, 'Email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const googleAuthSchema = z.object({
  body: z
    .object({
      idToken: z.string().min(1, 'Google idToken cannot be empty').optional(),
      accessToken: z
        .string()
        .min(1, 'Google accessToken cannot be empty')
        .optional(),
    })
    .refine(
      (body) => Boolean(body.idToken || body.accessToken),
      'Either Google idToken or accessToken is required'
    ),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name cannot exceed 50 characters')
      .trim()
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name cannot exceed 50 characters')
      .trim()
      .optional(),
    email: z.string().email('Invalid email format').optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, 'Page must be greater than 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine(
        (val) => val > 0 && val <= 100,
        'Limit must be between 1 and 100'
      ),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const createSocialSchema = z.object({
  body: z.object({
    insta_auth_token: z.string().optional(),
    meta_Auth_token: z.string().optional(),
    linedin_auth_token: z.string().optional(),
    titkok_auth_token: z.string().optional(),
    user: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional(),
  }),
});

export const listSocialsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    user: z.string().optional(),
  }),
});

export const getFacebookPagesSchema = z.object({
  body: z.object({
    userAccessToken: z.string().min(1, 'User access token is required'),
  }),
});

const facebookPublishBodySchema = z.object({
  pageId: z.string().min(1, 'Page ID is required'),
  pageAccessToken: z.string().min(1, 'Page access token is required'),
  mediaType: z.enum(['image', 'video']).optional(),
  caption: z
    .string()
    .max(2200, 'Caption cannot exceed 2200 characters')
    .optional(),
  title: z.string().max(255, 'Title cannot exceed 255 characters').optional(),
  mediaUrl: z.string().url('mediaUrl must be a valid URL').optional(),
  mediaBase64: z.string().min(1, 'mediaBase64 cannot be empty').optional(),
  fileName: z.string().min(1, 'fileName cannot be empty').optional(),
  contentType: z.string().min(1, 'contentType cannot be empty').optional(),
});

const facebookPublishRequestSchema = z
  .object({
    body: facebookPublishBodySchema,
    file: z
      .object({
        originalname: z.string(),
        mimetype: z.string(),
        size: z.number().optional(),
      })
      .optional(),
  })
  .refine(
    ({ body, file }) => Boolean(body.mediaUrl || body.mediaBase64 || file),
    {
      message: 'Either mediaUrl, mediaBase64, or file is required',
      path: ['body', 'mediaUrl'],
    }
  );

export const publishFacebookPageSchema = facebookPublishRequestSchema.refine(
  ({ body }) => Boolean(body.mediaType),
  {
    message: 'mediaType is required',
    path: ['body', 'mediaType'],
  }
);

export const directPublishFacebookMediaSchema = facebookPublishRequestSchema;
