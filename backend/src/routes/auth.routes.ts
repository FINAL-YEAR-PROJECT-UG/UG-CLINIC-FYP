import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
} from '../controllers/auth.controller';
import {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validateLogout,
} from '../validators/auth.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/logout', validateLogout, logout);
router.post('/refresh', validateRefreshToken, refreshToken);
router.get('/profile', authenticate, getProfile);

export default router;
