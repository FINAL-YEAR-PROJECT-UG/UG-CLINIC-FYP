import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.status(501).json({ message: 'Appointment endpoints not implemented yet' });
});

router.post('/', (_req, res) => {
  res.status(501).json({ message: 'Appointment creation not implemented yet' });
});

export default router;
