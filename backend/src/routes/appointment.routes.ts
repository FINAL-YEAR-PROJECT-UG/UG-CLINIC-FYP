import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAvailability,
  getMyAppointments,
  getStaffDashboard,
  createAppointment,
  cancelAppointment,
  // staff management
  getAllAppointments,
  assignDoctorToAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
  updateTimeSlot,
  getTimeSlots,
} from '../controllers/appointment.controller';

const router = Router();

router.get('/availability', authenticate, getAvailability);
router.get('/', authenticate, getMyAppointments);
router.get('/staff/dashboard', authenticate, getStaffDashboard);
router.get('/timeslots', authenticate, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, getTimeSlots);

// Staff management endpoints
router.get('/staff/all', authenticate, (req, res, next) => {
  // only staff roles allowed
  (req as any).user && ['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
}, getAllAppointments);

router.patch('/:id/assign', authenticate, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, assignDoctorToAppointment);

router.patch('/:id/assign-doctor', authenticate, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, assignDoctorToAppointment);

router.patch('/:id/reschedule', authenticate, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, rescheduleAppointment);

router.patch('/:id/status', authenticate, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
}, updateAppointmentStatus);

router.post('/:id/staff-cancel', authenticate, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, cancelAppointment);

// TimeSlot management for marking slots booked/free
router.patch('/timeslot/:id', authenticate, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, updateTimeSlot);
router.post('/', authenticate, createAppointment);
router.patch('/:id/cancel', authenticate, cancelAppointment);

export default router;
