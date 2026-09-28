import { Router } from 'express';
import { authenticateSession } from '../middleware/sessionAuth';
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
  batchUpdateTimeSlots,
} from '../controllers/appointment.controller';

const router = Router();

router.get('/availability', authenticateSession, getAvailability);
router.get('/', authenticateSession, getMyAppointments);
router.get('/staff/dashboard', authenticateSession, getStaffDashboard);
router.get('/timeslots', authenticateSession, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, getTimeSlots);

router.patch('/timeslots/batch', authenticateSession, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
}, batchUpdateTimeSlots);


// Staff management endpoints
router.get('/staff/all', authenticateSession, (req, res, next) => {
  // only staff roles allowed
  (req as any).user && ['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
}, getAllAppointments);

router.patch('/:id/assign', authenticateSession, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, assignDoctorToAppointment);

router.patch('/:id/assign-doctor', authenticateSession, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, assignDoctorToAppointment);

router.patch('/:id/reschedule', authenticateSession, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, rescheduleAppointment);

router.patch('/:id/status', authenticateSession, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
}, updateAppointmentStatus);

router.post('/:id/staff-cancel', authenticateSession, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, cancelAppointment);

// TimeSlot management for marking slots booked/free
router.patch('/timeslot/:id', authenticateSession, (req, res, next) => {
  (req as any).user && ['RECEPTIONIST', 'ADMIN'].includes((req as any).user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
}, updateTimeSlot);
router.post('/', authenticateSession, createAppointment);
router.patch('/:id/cancel', authenticateSession, cancelAppointment);

export default router;
