import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { scanResourcePayload } from '../services/securityScanner';

export const listResourcesForStaff = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const { status, category, search } = req.query as any;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = String(status).toUpperCase();
    }
    if (category && category !== 'all') {
      where.category = { equals: String(category), mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { authorName: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
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

    // Run Security & Virus Scan on upload
    const scan = scanResourcePayload({
      title: String(title),
      description: description ? String(description) : '',
      fileUrl: String(fileUrl),
      fileType: String(fileType),
    });

    const isFlagged = scan.status === 'MALICIOUS';

    const resource = await prisma.resource.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        fileUrl: String(fileUrl),
        fileType: String(fileType),
        fileSize: Math.max(0, Math.floor(fileSize)),
        category: category ? String(category) : 'General Health',
        tags: Array.isArray(tags) ? tags.map(String) : [],
        isPublic: isFlagged ? false : (isPublic !== undefined ? !!isPublic : true),
        status: isFlagged ? 'FLAGGED' : 'APPROVED',
        securityScanStatus: scan.status,
        securityScanDetails: scan.scanDetails,
        uploadedBy: req.user.userId,
      },
    });

    res.status(201).json({
      success: true,
      message: isFlagged
        ? 'Resource uploaded but flagged by Security Scanner due to potential security risks.'
        : 'Resource created and passed security scan successfully.',
      data: { resource, scanResult: scan },
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while creating resource' });
  }
};

export const submitPublicArticle = async (req: Request, res: Response) => {
  try {
    const { title, description, category, fileUrl, authorName, authorEmail } = req.body || {};

    if (!title || (!description && !fileUrl)) {
      return res.status(400).json({ success: false, message: 'Title and content/description or file URL are required' });
    }

    // Automated Security & Virus Scan
    const scan = scanResourcePayload({
      title: String(title),
      description: description ? String(description) : '',
      fileUrl: fileUrl ? String(fileUrl) : 'article-text-submission',
      fileType: fileUrl ? 'doc' : 'article',
      authorName: authorName ? String(authorName) : 'Anonymous Student',
      authorEmail: authorEmail ? String(authorEmail) : '',
    });

    const isMalicious = scan.status === 'MALICIOUS';

    const resource = await prisma.resource.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        fileUrl: fileUrl ? String(fileUrl) : '#article-submission',
        fileType: fileUrl ? 'doc' : 'article',
        fileSize: 1024 * 100, // 100 KB default
        category: category ? String(category) : 'Physical Health',
        tags: ['student-submission', 'community-article'],
        isPublic: false, // Requires staff approval before becoming public
        status: isMalicious ? 'FLAGGED' : 'PENDING_REVIEW',
        securityScanStatus: scan.status,
        securityScanDetails: scan.scanDetails,
        authorName: authorName ? String(authorName).trim() : 'Public Contributor',
        authorEmail: authorEmail ? String(authorEmail).trim() : null,
      },
    });

    res.status(201).json({
      success: true,
      message: isMalicious
        ? 'Submission flagged for security review. Suspected payload detected.'
        : 'Article submitted successfully! Passed automated security scan and queued for clinic staff review.',
      data: { resource, scanResult: scan },
    });
  } catch (error) {
    console.error('Submit public article error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while submitting article' });
  }
};

export const updateResource = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const id = String(req.params.id);
    const { title, description, fileUrl, fileType, fileSize, category, tags, isPublic, status } = req.body || {};

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
    if (status !== undefined) data.status = String(status).toUpperCase();

    // Re-run security scan if text or url changed
    if (title !== undefined || description !== undefined || fileUrl !== undefined) {
      const scan = scanResourcePayload({
        title: data.title || resource.title,
        description: data.description !== undefined ? (data.description || '') : (resource.description || ''),
        fileUrl: data.fileUrl || resource.fileUrl,
        fileType: data.fileType || resource.fileType,
      });
      data.securityScanStatus = scan.status;
      data.securityScanDetails = scan.scanDetails;
    }

    const updated = await prisma.resource.update({ where: { id }, data });

    res.status(200).json({ success: true, message: 'Resource updated successfully', data: { resource: updated } });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating resource' });
  }
};

export const reviewResourceSubmission = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const id = String(req.params.id);
    const { action } = req.body || {}; // 'APPROVE' | 'REJECT' | 'FLAG'

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    let status = 'APPROVED';
    let isPublic = true;

    if (action === 'REJECT') {
      status = 'REJECTED';
      isPublic = false;
    } else if (action === 'FLAG') {
      status = 'FLAGGED';
      isPublic = false;
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: { status, isPublic },
    });

    res.status(200).json({
      success: true,
      message: `Resource review action complete: ${status}`,
      data: { resource: updated },
    });
  } catch (error) {
    console.error('Review resource error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while reviewing resource' });
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
