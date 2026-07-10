import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const listResourcesForStaff = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    res.status(200).json({ success: true, data: { resources } });
  } catch (error) {
    console.error('List resources error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching resources' });
  }
};

export const createResource = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const { title, description, fileUrl, fileType, fileSize, category, tags, isPublic } = req.body || {};
    if (!title || !fileUrl || !fileType || typeof fileSize !== 'number') {
      return res.status(400).json({ success: false, message: 'title, fileUrl, fileType and fileSize are required' });
    }

    const resource = await prisma.resource.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        fileUrl: String(fileUrl),
        fileType: String(fileType),
        fileSize: Math.max(0, Math.floor(fileSize)),
        category: category ? String(category) : 'General',
        tags: Array.isArray(tags) ? tags.map(String) : [],
        isPublic: !!isPublic,
        uploadedBy: req.user.userId,
      },
    });

    res.status(201).json({ success: true, message: 'Resource created', data: { resource } });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while creating resource' });
  }
};

export const updateResource = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const id = String(req.params.id);
    const { title, description, fileUrl, fileType, fileSize, category, tags, isPublic } = req.body || {};

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    const data: any = {};
    if (title !== undefined) data.title = String(title).trim();
    if (description !== undefined) data.description = description ? String(description).trim() : null;
    if (fileUrl !== undefined) data.fileUrl = String(fileUrl);
    if (fileType !== undefined) data.fileType = String(fileType);
    if (fileSize !== undefined) data.fileSize = Math.max(0, Math.floor(Number(fileSize)));
    if (category !== undefined) data.category = String(category);
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags.map(String) : [];
    if (isPublic !== undefined) data.isPublic = !!isPublic;

    const updated = await prisma.resource.update({ where: { id }, data });

    res.status(200).json({ success: true, message: 'Resource updated', data: { resource: updated } });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating resource' });
  }
};

export const deleteResource = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const id = String(req.params.id);
    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    await prisma.resource.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting resource' });
  }
};
