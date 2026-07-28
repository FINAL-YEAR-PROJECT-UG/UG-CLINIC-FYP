import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getNewsPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { category, priority, page = '1', pageSize = '20' } = req.query as any;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const size = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20));

    const where: any = {};
    if (category && category !== 'all') where.category = String(category);
    if (priority && priority !== 'all') where.priority = String(priority);

    const [posts, total] = await Promise.all([
      prisma.newsPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * size,
        take: size,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      prisma.newsPost.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: { newsPosts: posts, total, page: pageNum, pageSize: size },
    });
  } catch (error) {
    console.error('Get news posts error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching news posts',
    });
  }
};

export const createNewsPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId || !role || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access required' });
    }

    const { title, content, category = 'announcement', priority = 'medium', isPublic = true } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const post = await prisma.newsPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: String(category).toLowerCase(),
        priority: String(priority).toLowerCase(),
        isPublic: Boolean(isPublic),
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'News post created successfully',
      data: { newsPost: post },
    });
  } catch (error) {
    console.error('Create news post error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating news post',
    });
  }
};

export const updateNewsPost = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    if (!req.user || !role || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access required' });
    }

    const id = String(req.params.id);
    const { title, content, category, priority, isPublic } = req.body;

    const existing = await prisma.newsPost.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'News post not found' });
    }

    const data: any = {};
    if (title) data.title = String(title).trim();
    if (content) data.content = String(content).trim();
    if (category) data.category = String(category).toLowerCase();
    if (priority) data.priority = String(priority).toLowerCase();
    if (typeof isPublic === 'boolean') data.isPublic = isPublic;

    const updated = await prisma.newsPost.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'News post updated',
      data: { newsPost: updated },
    });
  } catch (error) {
    console.error('Update news post error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating news post',
    });
  }
};

export const deleteNewsPost = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    if (!req.user || !role || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access required' });
    }

    const id = String(req.params.id);

    const existing = await prisma.newsPost.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'News post not found' });
    }

    await prisma.newsPost.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'News post deleted successfully',
    });
  } catch (error) {
    console.error('Delete news post error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting news post',
    });
  }
};
