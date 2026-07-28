import { Router } from 'express';
import {
  staffRegister,
  staffLogin,
  verify2FA,
  // staff management
  listStudents,
  getStudent,
  updateStudent,
  listDoctors,
  updateDoctorStatus,
  getStudentHistory,
  autoAssignDoctors,
  autoConfirmPending,
} from '../controllers/staff.controller';
import {
  validateStaffRegister,
  validateStaffLogin,
  validate2FA,
} from '../validators/staff.validator';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/register', validateStaffRegister, staffRegister);
router.post('/login', validateStaffLogin, staffLogin);
router.post('/verify-2fa', validate2FA, verify2FA);

// Student record management (staff-only)
router.get('/students', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), listStudents);
router.get('/students/:id', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), getStudent);
router.get('/students/:id/history', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), getStudentHistory);
router.patch('/students/:id', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), updateStudent);

// Doctor management & availability status (staff-only)
router.get('/doctors', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), listDoctors);
router.patch('/doctors/status', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), updateDoctorStatus);

// Staff operations automation (staff-only)
router.post('/auto-assign-doctors', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), autoAssignDoctors);
router.post('/auto-confirm-pending', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), autoConfirmPending);

export default router;
