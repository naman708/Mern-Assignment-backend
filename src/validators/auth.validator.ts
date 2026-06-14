import { body, query } from 'express-validator';

const password = () =>
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number');

export const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  password(),
];

export const createAdminRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  password(),
  body('secret').isString().notEmpty().withMessage('Admin secret is required'),
];

export const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

export const verifyEmailRules = [
  query('token').isString().notEmpty().withMessage('Verification token is required'),
];

export const refreshRules = [
  body('refreshToken').isString().notEmpty().withMessage('Refresh token is required'),
];

export const forgotPasswordRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const resetPasswordRules = [
  body('token').isString().notEmpty().withMessage('Reset token is required'),
  password(),
];
