import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const listServices = async (_req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        category: true,
      },
    });

    res.status(200).json({ success: true, data: { services } });
  } catch (error) {
    console.error('List services error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching services',
    });
  }
};
