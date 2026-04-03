import { Router } from 'express';
import {
  attachPageToken,
  getUserPages,
  publishImageToFacebook,
  publishReelToFacebook,
  publishStoryToFacebook,
  publishToFacebookPage,
  PublishVideoToFacebook,
} from '../controllers/graphApiController';
import { authenticate, facebookUpload, validateRequest } from '../middleware';
import {
  directPublishFacebookMediaSchema,
  getFacebookPagesSchema,
  publishFacebookPageSchema,
} from '../utils/validationSchemas';

const router = Router();

router.use(authenticate);

router.post('/getPageToken', attachPageToken);

router.post('/pages', validateRequest(getFacebookPagesSchema), getUserPages);
router.post(
  '/pages/publish',
  facebookUpload.single('file'),
  attachPageToken,
  validateRequest(publishFacebookPageSchema),
  publishToFacebookPage
);
router.post(
  '/pages/publish/image',
  facebookUpload.single('file'),
  attachPageToken,
  validateRequest(directPublishFacebookMediaSchema),
  publishImageToFacebook
);
router.post(
  '/pages/publish/reel',
  facebookUpload.single('file'),
  attachPageToken,
  validateRequest(directPublishFacebookMediaSchema),
  publishReelToFacebook
);
router.post(
  '/pages/publish/video',
  facebookUpload.single('file'),
  attachPageToken,
  validateRequest(directPublishFacebookMediaSchema),
  PublishVideoToFacebook
);
router.post(
  '/pages/publish/story',
  facebookUpload.single('file'),
  attachPageToken,
  validateRequest(directPublishFacebookMediaSchema),
  publishStoryToFacebook
);

export default router;
