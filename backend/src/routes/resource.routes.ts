import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.status(501).json({ message: 'Resource endpoints not implemented yet' });
});

export default router;
