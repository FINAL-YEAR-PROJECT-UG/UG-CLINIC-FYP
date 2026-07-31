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
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/register', validateStaffRegister, staffRegister);
router.post('/login', validateStaffLogin, staffLogin);
router.post('/verify-2fa', validate2FA, verify2FA);
router.post('/resend-2fa', validateResend2FA, resendStaff2FA);

// Student record management (staff-only)
router.get('/students', authenticate, authorize('RECEPTIONIST', 'ADMIN'), listStudents);
router.get('/students/:id', authenticate, authorize('RECEPTIONIST', 'ADMIN'), getStudent);
router.get('/students/:id/history', authenticate, authorize('RECEPTIONIST', 'ADMIN'), getStudentHistory);
router.patch('/students/:id', authenticate, authorize('RECEPTIONIST', 'ADMIN'), updateStudent);

// Doctor management & availability status (staff-only)
router.get('/doctors', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), listDoctors);
router.patch('/doctors/status', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), updateDoctorStatus);
router.patch('/doctors/batch-status', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), batchUpdateDoctorStatuses);

// Staff operations automation (staff-only)
router.post('/auto-assign-doctors', authenticate, authorize('RECEPTIONIST', 'ADMIN'), autoAssignDoctors);
router.post('/auto-confirm-pending', authenticate, authorize('RECEPTIONIST', 'ADMIN'), autoConfirmPending);


export default router;
