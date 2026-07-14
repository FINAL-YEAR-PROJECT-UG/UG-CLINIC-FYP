import { body, validationResult } from 'express-validator';
import {
  isValidStudentId,
  validatePhoneNumber,
} from '../utils/studentValidation';

const emailValidator = body('email')
  .trim()
  .isEmail()
  .withMessage('Please provide a valid student email address')
  .normalizeEmail();

const usernameValidator = body('username')
  .trim()
  .notEmpty()
  .withMessage('Email or student ID is required');

const studentIdValidator = body('studentId')
  .trim()
  .notEmpty()
  .withMessage('Student ID is required')
  .custom((value) => {
    if (!isValidStudentId(value)) {
      throw new Error('Student ID must be exactly 8 digits (numbers only)');
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
  emailValidator,
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
  emailValidator,
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
  body('otherNames')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Other names must not exceed 50 characters'),
  studentIdValidator,
  phoneValidator,
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('isResident')
    .optional()
    .isIn(['resident', 'non-resident'])
    .withMessage('Residency status must be resident or non-resident'),
  body('program')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Program must not exceed 100 characters'),
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
  usernameValidator,
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
