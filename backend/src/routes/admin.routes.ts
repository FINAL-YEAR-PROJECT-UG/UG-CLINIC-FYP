import { Router } from 'express';

const router = Router();

router.get('/dashboard', (_req, res) => {
  res.status(501).json({ message: 'Admin dashboard not implemented yet' });
});

export default router;
