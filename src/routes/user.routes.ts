import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { uploadProfileImage } from '../middlewares/upload.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { listUsersRules, userIdRules, updateProfileRules } from '../validators/user.validator';

const router = Router();

// Every user route requires a valid access token.
router.use(authenticate);

router.get('/', validate(listUsersRules), asyncHandler(userController.listUsers));

router.get('/me', asyncHandler(userController.getMe));

router.put(
  '/me',
  uploadProfileImage,
  validate(updateProfileRules),
  asyncHandler(userController.updateMe)
);

router.get('/:id', validate(userIdRules), asyncHandler(userController.getUser));

// RBAC: only admins may delete users.
router.delete(
  '/:id',
  validate(userIdRules),
  requireRole('admin'),
  asyncHandler(userController.deleteUser)
);

export default router;
