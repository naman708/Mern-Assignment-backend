import { body, param, query } from 'express-validator';

export const listUsersRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
    .toInt(),
  query('search').optional().isString().trim(),
];

export const userIdRules = [
  param('id').isUUID().withMessage('A valid user id is required'),
];

export const updateProfileRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
];
