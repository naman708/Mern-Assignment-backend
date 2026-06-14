import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const uploadDir = path.resolve(process.cwd(), env.upload.dir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Multer instance for a single optional `profileImage` field.
 * Restricts to common image MIME types and the configured size limit.
 */
export const uploadProfileImage = multer({
  storage,
  limits: { fileSize: env.upload.maxBytes },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest('Only JPEG, PNG and WebP images are allowed'));
    }
  },
}).single('profileImage');
