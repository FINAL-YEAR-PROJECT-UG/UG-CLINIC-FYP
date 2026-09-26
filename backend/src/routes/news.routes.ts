import { Router } from 'express';
import { authenticateSession } from '../middleware/sessionAuth';
import {
  getNewsPosts,
  createNewsPost,
  updateNewsPost,
  deleteNewsPost,
} from '../controllers/news.controller';

const router = Router();

router.get('/', getNewsPosts);
router.post('/', authenticateSession, createNewsPost);
router.put('/:id', authenticateSession, updateNewsPost);
router.delete('/:id', authenticateSession, deleteNewsPost);

export default router;
