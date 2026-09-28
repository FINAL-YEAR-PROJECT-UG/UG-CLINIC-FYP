import { Router } from 'express';
import {
  staffRegister,
  staffLogin,
  verify2FA,
  resendStaff2FA,
  listStudents,
  getStudent,
  updateStudent,
  listDoctors,
  updateDoctorStatus,
  getStudentHistory,
  autoAssignDoctors,
  autoConfirmPending,
  batchUpdateDoctorStatuses,
} from '../controllers/staff.controller';
import {
  validateStaffRegister,
  validateStaffLogin,
  validate2FA,
  validateResend2FA,
} from '../validators/staff.validator';
import { authenticateSession, authorize } from '../middleware/sessionAuth';

const router = Router();

router.post('/register', validateStaffRegister, staffRegister);
router.post('/login', validateStaffLogin, staffLogin);
router.post('/verify-2fa', validate2FA, verify2FA);
router.post('/resend-2fa', validateResend2FA, resendStaff2FA);

// Student record management (staff-only)
router.get('/students', authenticateSession, authorize('RECEPTIONIST', 'ADMIN'), listStudents);
router.get('/students/:id', authenticateSession, authorize('RECEPTIONIST', 'ADMIN'), getStudent);
router.get('/students/:id/history', authenticateSession, authorize('RECEPTIONIST', 'ADMIN'), getStudentHistory);
router.patch('/students/:id', authenticateSession, authorize('RECEPTIONIST', 'ADMIN'), updateStudent);

// Doctor management & availability status (staff-only)
router.get('/doctors', authenticateSession, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), listDoctors);
router.patch('/doctors/status', authenticateSession, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), updateDoctorStatus);
router.patch('/doctors/batch-status', authenticateSession, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), batchUpdateDoctorStatuses);

// Staff operations automation (staff-only)
router.post('/auto-assign-doctors', authenticateSession, authorize('RECEPTIONIST', 'ADMIN'), autoAssignDoctors);
router.post('/auto-confirm-pending', authenticateSession, authorize('RECEPTIONIST', 'ADMIN'), autoConfirmPending);


export default router;
