import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listResourcesForStaff,
  createResource,
  updateResource,
  deleteResource,
} from '../controllers/resource.controller';

const router = Router();

// Public listing (only public resources)
router.get('/', async (_req, res) => {
  try {
    const resources = await (await import('../lib/prisma')).prisma.resource.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, description: true, fileUrl: true, fileType: true, fileSize: true, category: true, tags: true, createdAt: true },
    });
    res.status(200).json({ success: true, data: { resources } });
  } catch (error) {
    console.error('Public list resources error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching resources' });
  }
});

// Staff endpoints
router.get('/staff', authenticate, listResourcesForStaff);
router.post('/', authenticate, createResource);
router.patch('/:id', authenticate, updateResource);
router.delete('/:id', authenticate, deleteResource);

export default router;
