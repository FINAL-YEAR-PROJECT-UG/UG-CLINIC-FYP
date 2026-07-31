import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listResourcesForStaff,
  createResource,
  submitPublicArticle,
  updateResource,
  reviewResourceSubmission,
  deleteResource,
} from '../controllers/resource.controller';

const router = Router();

// Public endpoints (Approved & Public resources only)
router.get('/', async (_req, res) => {
  try {
    const resources = await (await import('../lib/prisma')).prisma.resource.findMany({
      where: { isPublic: true, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        category: true,
        tags: true,
        authorName: true,
        createdAt: true,
      },
    });
    res.status(200).json({ success: true, data: { resources } });
  } catch (error) {
    console.error('Public list resources error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching resources' });
  }
});

// Public submission endpoint for articles/documents for review
router.post('/submit-public', submitPublicArticle);

// Staff management endpoints (Receptionist, Doctor, Admin)
router.get('/staff', authenticate, listResourcesForStaff);
router.post('/', authenticate, createResource);
router.patch('/:id', authenticate, updateResource);
router.patch('/:id/review', authenticate, reviewResourceSubmission);
router.delete('/:id', authenticate, deleteResource);

export default router;
