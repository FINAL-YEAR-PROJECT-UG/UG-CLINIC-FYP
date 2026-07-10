import { Router } from 'express';
import {
  staffRegister,
  staffLogin,
  verify2FA,
  updateSessionActivity,
  revokeSession,
  revokeAllSessions,
  getActiveSessions,
  toggle2FA,
  // staff management
  listStudents,
  getStudent,
  updateStudent,
} from '../controllers/staff.controller';
import {
  validateStaffRegister,
  validateStaffLogin,
  validate2FA,
  validateToggle2FA,
} from '../validators/staff.validator';
import { authenticateStaff, requireAdmin } from '../middleware/rbac';

const router = Router();

router.post('/register', validateStaffRegister, staffRegister);
router.post('/login', validateStaffLogin, staffLogin);
router.post('/verify-2fa', validate2FA, verify2FA);
router.post('/session/activity', authenticateStaff, updateSessionActivity);
router.delete('/session/:sessionId', authenticateStaff, revokeSession);
router.delete('/sessions', authenticateStaff, revokeAllSessions);
router.get('/sessions', authenticateStaff, getActiveSessions);
router.post('/2fa/toggle', authenticateStaff, validateToggle2FA, toggle2FA);

// Student record management (staff-only)
router.get('/students', authenticateStaff, listStudents);
router.get('/students/:id', authenticateStaff, getStudent);
router.patch('/students/:id', authenticateStaff, updateStudent);

export default router;

export default router;
