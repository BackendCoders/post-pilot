import multer from 'multer';

const FACEBOOK_UPLOAD_FILE_SIZE_LIMIT = 50 * 1024 * 1024;

export const facebookUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FACEBOOK_UPLOAD_FILE_SIZE_LIMIT,
    files: 1,
  },
});
