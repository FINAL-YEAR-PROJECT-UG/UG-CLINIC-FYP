import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNewsPosts,
  createNewsPost,
  updateNewsPost,
  deleteNewsPost,
} from '../controllers/news.controller';

const router = Router();

router.get('/', getNewsPosts);
router.post('/', authenticate, createNewsPost);
router.put('/:id', authenticate, updateNewsPost);
router.delete('/:id', authenticate, deleteNewsPost);

export default router;
