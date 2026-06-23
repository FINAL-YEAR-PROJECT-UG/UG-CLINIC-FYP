import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import {
  getDayBounds,
  normalizeToStartOfDay,
  ACTIVE_APPOINTMENT_STATUSES,
} from '../utils/date';

export const getAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { date, serviceId } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, message: 'date is required' });
    }

    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const { startOfDay, endOfDay } = getDayBounds(appointmentDate);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        ...(typeof serviceId === 'string' && serviceId ? { serviceId } : {}),
      },
      select: { timeSlot: true },
    });

    const bookedSlots = appointments.map((a) => a.timeSlot);

    res.status(200).json({ success: true, data: { bookedSlots } });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching availability',
    });
  }
};

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: {
        service: { select: { id: true, name: true, category: true, duration: true } },
        doctor: { select: { firstName: true, lastName: true } },
      },
    });

    res.status(200).json({ success: true, data: { appointments } });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching appointments',
    });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { serviceId, date, timeSlot, reason, notes } = req.body;

    if (!serviceId || !date || !timeSlot || !reason) {
      return res.status(400).json({
        success: false,
        message: 'serviceId, date, timeSlot and reason are required',
      });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const normalizedDate = normalizeToStartOfDay(appointmentDate);
    const { startOfDay, endOfDay } = getDayBounds(normalizedDate);

    const existing = await prisma.appointment.findFirst({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an appointment on this date. Cancel or reschedule it before booking again.',
      });
    }

    const slotTaken = await prisma.appointment.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        timeSlot,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
    });
    if (slotTaken) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is no longer available. Please choose another time.',
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        serviceId,
        date: normalizedDate,
        timeSlot,
        reason,
        notes: notes || null,
        status: 'CONFIRMED',
      },
      include: {
        service: { select: { id: true, name: true, category: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment },
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while booking the appointment',
    });
  }
};

export const rescheduleAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const id = String(req.params.id);
    const { serviceId, date, timeSlot, reason, notes } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'date and timeSlot are required',
      });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, userId },
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'This appointment can no longer be rescheduled',
      });
    }

    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const normalizedDate = normalizeToStartOfDay(appointmentDate);
    const { startOfDay, endOfDay } = getDayBounds(normalizedDate);

    const existing = await prisma.appointment.findFirst({
      where: {
        userId,
        id: { not: id },
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an appointment on this date. Choose a different day or cancel the other booking first.',
      });
    }

    const slotTaken = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        date: { gte: startOfDay, lte: endOfDay },
        timeSlot,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
    });
    if (slotTaken) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is no longer available. Please choose another time.',
      });
    }

    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service || !service.isActive) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        date: normalizedDate,
        timeSlot,
        ...(serviceId ? { serviceId } : {}),
        ...(reason ? { reason } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        status: 'CONFIRMED',
      },
      include: {
        service: { select: { id: true, name: true, category: true } },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: { appointment: updated },
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while rescheduling the appointment',
    });
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const id = String(req.params.id);

    const appointment = await prisma.appointment.findFirst({
      where: { id, userId },
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'This appointment has already been cancelled or completed',
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy: userId,
        cancelledAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled',
      data: { appointment: updated },
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while cancelling the appointment',
    });
  }
};
