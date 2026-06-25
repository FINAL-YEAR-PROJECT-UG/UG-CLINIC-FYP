import { body, validationResult } from 'express-validator';
import {
  isUgStudentEmail,
  isValidStudentId,
  validatePhoneNumber,
} from '../utils/studentValidation';

const ugEmailValidator = body('email')
  .trim()
  .isEmail()
  .withMessage('Please provide a valid email address')
  .normalizeEmail()
  .custom((value) => {
    if (!isUgStudentEmail(value)) {
      throw new Error(
        'Use your official UG student email ending in @st.ug.edu.gh. Personal emails are not accepted.'
      );
    }
    return true;
  });

const studentIdValidator = body('studentId')
  .trim()
  .notEmpty()
  .withMessage('Student ID is required')
  .custom((value) => {
    if (!isValidStudentId(value)) {
      throw new Error('Student ID must be 7–10 digits.');
    }
    return true;
  });

const phoneValidator = body('phone')
  .optional()
  .trim()
  .custom((value) => {
    if (!value) return true;
    const result = validatePhoneNumber(value);
    if (!result.valid) {
      throw new Error(result.message);
    }
    return true;
  });

export const validateCheckAccount = [
  ugEmailValidator,
  studentIdValidator,
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
];

export const validateRegistration = [
  ugEmailValidator,
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  studentIdValidator,
  phoneValidator,
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
];

export const validateLogin = [
  ugEmailValidator,
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean'),
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
];

export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
];

export const validateLogout = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
];
