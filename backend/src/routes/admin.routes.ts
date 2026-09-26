import { Router } from 'express';
import { triggerSessionCleanup, getSystemHealth } from '../controllers/admin.controller';
import { authenticateSession } from '../middleware/sessionAuth';
import { authorizeSession } from '../middleware/sessionAuth';

const router = Router();

// System health endpoint
router.get('/health', authenticateSession, authorizeSession('ADMIN'), getSystemHealth);

// Manual session cleanup trigger
router.post('/cleanup-sessions', authenticateSession, authorizeSession('ADMIN'), triggerSessionCleanup);

// Admin dashboard (placeholder for future implementation)
router.get('/dashboard', authenticateSession, authorizeSession('ADMIN'), (_req, res) => {
  res.status(501).json({ message: 'Admin dashboard not implemented yet' });
});

export default router;
