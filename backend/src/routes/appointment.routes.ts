import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAvailability,
  getMyAppointments,
  createAppointment,
  cancelAppointment,
} from '../controllers/appointment.controller';

const router = Router();

router.get('/availability', authenticate, getAvailability);
router.get('/', authenticate, getMyAppointments);
router.post('/', authenticate, createAppointment);
router.patch('/:id/cancel', authenticate, cancelAppointment);

export default router;
