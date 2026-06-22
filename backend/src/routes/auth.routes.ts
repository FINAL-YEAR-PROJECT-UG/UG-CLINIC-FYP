import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  loginWithOTP,
} from '../controllers/auth.controller';
import {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validateLogout,
} from '../validators/auth.validator';
import { authenticate } from '../middleware/auth';
import {
  forgotPassword,
  resetPassword,
  sendOTP,
  verifyOTP,
  resetPasswordWithOTP,
  setSecurityQuestions,
  verifySecurityQuestions,
  generateBackupCodes,
  verifyBackupCode,
  changePassword,
} from '../controllers/passwordRecovery.controller';
import {
  validateForgotPassword,
  validateResetPassword,
  validateSendOTP,
  validateVerifyOTP,
  validateResetPasswordWithOTP,
  validateSetSecurityQuestions,
  validateVerifySecurityQuestions,
  validateVerifyBackupCode,
  validateChangePassword,
} from '../validators/passwordRecovery.validator';

const router = Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/logout', validateLogout, logout);
router.post('/refresh', validateRefreshToken, refreshToken);
router.get('/profile', authenticate, getProfile);
router.post('/login-otp', loginWithOTP);

router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.post('/send-otp', validateSendOTP, sendOTP);
router.post('/verify-otp', validateVerifyOTP, verifyOTP);
router.post('/reset-password-otp', validateResetPasswordWithOTP, resetPasswordWithOTP);
router.post('/security-questions', authenticate, validateSetSecurityQuestions, setSecurityQuestions);
router.post('/verify-security-questions', validateVerifySecurityQuestions, verifySecurityQuestions);
router.post('/generate-backup-codes', authenticate, generateBackupCodes);
router.post('/verify-backup-code', validateVerifyBackupCode, verifyBackupCode);
router.post('/change-password', authenticate, validateChangePassword, changePassword);

export default router;
