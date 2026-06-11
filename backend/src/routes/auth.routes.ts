import { Router } from 'express';

const router = Router();

router.post('/register', (_req, res) => {
  res.status(501).json({ message: 'Auth registration not implemented yet' });
});

router.post('/login', (_req, res) => {
  res.status(501).json({ message: 'Auth login not implemented yet' });
});

export default router;
