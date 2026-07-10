import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

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

    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(typeof serviceId === 'string' && serviceId ? { serviceId } : {}),
      },
      select: { timeSlot: true },
    });

    const bookedSlots = appointments.map((a: { timeSlot: string }) => a.timeSlot);

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

export const getStaffDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const staffWhere = role === 'DOCTOR' ? { doctorId: userId } : {};

    const appointments = await prisma.appointment.findMany({
      where: {
        ...staffWhere,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      orderBy: { date: 'asc' },
      take: 12,
      include: {
        service: { select: { id: true, name: true, category: true, duration: true } },
        user: { select: { id: true, firstName: true, lastName: true, studentId: true, email: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const statusCounts = await prisma.appointment.groupBy({
      by: ['status'],
      where: staffWhere,
      _count: { id: true },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayCount = await prisma.appointment.count({
      where: {
        ...staffWhere,
        date: { gte: startOfToday, lte: endOfToday },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    const summary = {
      total: statusCounts.reduce((sum, item) => sum + item._count.id, 0),
      today: todayCount,
      pending: statusCounts.find((item) => item.status === 'PENDING')?._count.id ?? 0,
      confirmed: statusCounts.find((item) => item.status === 'CONFIRMED')?._count.id ?? 0,
      completed: statusCounts.find((item) => item.status === 'COMPLETED')?._count.id ?? 0,
      cancelled: statusCounts.find((item) => item.status === 'CANCELLED')?._count.id ?? 0,
      rescheduled: statusCounts.find((item) => item.status === 'RESCHEDULED')?._count.id ?? 0,
    };

    res.status(200).json({ success: true, data: { summary, appointments } });
  } catch (error) {
    console.error('Get staff dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the staff dashboard',
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

    const existing = await prisma.appointment.findFirst({
      where: {
        userId,
        date: appointmentDate,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an appointment on this date',
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        serviceId,
        date: appointmentDate,
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

    const { cancellationReason, cancellationNote } = req.body || {};

    if (!cancellationReason || typeof cancellationReason !== 'string' || !cancellationReason.trim()) {
      return res.status(400).json({ success: false, message: 'cancellationReason is required' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy: userId,
        cancelledAt: new Date(),
        cancellationReason: cancellationReason.trim(),
        cancellationNote: cancellationNote ? String(cancellationNote).trim() : null,
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

// ---------- Staff management handlers ----------

export const getAllAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    if (!req.user || role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const {
      page = '1',
      pageSize = '25',
      doctorId,
      status,
      serviceId,
      startDate,
      endDate,
    } = req.query as any;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));

    const where: any = {};
    if (doctorId) where.doctorId = String(doctorId);
    if (status) where.status = String(status);
    if (serviceId) where.serviceId = String(serviceId);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(String(startDate));
      if (endDate) where.date.lte = new Date(String(endDate));
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { date: 'asc' },
        skip: (pageNum - 1) * size,
        take: size,
        include: {
          service: { select: { id: true, name: true, category: true, duration: true } },
          user: { select: { id: true, firstName: true, lastName: true, studentId: true, email: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    res.status(200).json({ success: true, data: { appointments, total, page: pageNum, pageSize: size } });
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching appointments' });
  }
};

export const assignDoctorToAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!req.user || !['RECEPTIONIST', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
    }

    const id = String(req.params.id);
    const { doctorId } = req.body || {};
    if (!doctorId) return res.status(400).json({ success: false, message: 'doctorId is required' });

    const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const updated = await prisma.appointment.update({ where: { id }, data: { doctorId: doctor.id, status: 'CONFIRMED' } });

    res.status(200).json({ success: true, message: 'Doctor assigned', data: { appointment: updated } });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while assigning doctor' });
  }
};

export const rescheduleAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!req.user || !['RECEPTIONIST', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
    }

    const id = String(req.params.id);
    const { date, timeSlot } = req.body || {};
    if (!date || !timeSlot) return res.status(400).json({ success: false, message: 'date and timeSlot are required' });

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid date' });

    // Decrement currentBookings on old timeslot if exists
    try {
      await prisma.timeSlot.updateMany({
        where: {
          serviceId: appointment.serviceId,
          date: appointment.date,
          startTime: appointment.timeSlot,
        },
        data: { currentBookings: { decrement: 1 } },
      });
    } catch (e) {
      // ignore if not found
    }

    // Find new timeslot
    const targetSlot = await prisma.timeSlot.findFirst({
      where: {
        serviceId: appointment.serviceId,
        date: appointmentDate,
        startTime: String(timeSlot),
        isAvailable: true,
      },
    });

    if (!targetSlot) return res.status(404).json({ success: false, message: 'Target timeslot not available' });
    if (targetSlot.currentBookings >= targetSlot.maxBookings) return res.status(409).json({ success: false, message: 'Target timeslot fully booked' });

    // increment new slot
    await prisma.timeSlot.update({ where: { id: targetSlot.id }, data: { currentBookings: { increment: 1 }, isAvailable: targetSlot.currentBookings + 1 + 0 < targetSlot.maxBookings } });

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        date: appointmentDate,
        timeSlot: String(timeSlot),
        status: 'RESCHEDULED',
        updatedAt: new Date(),
      },
    });

    res.status(200).json({ success: true, message: 'Appointment rescheduled', data: { appointment: updated } });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while rescheduling the appointment' });
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!req.user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const id = String(req.params.id);
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ success: false, message: 'status is required' });

    const allowed = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const updateData: any = { status };
    if (status === 'CANCELLED') {
      updateData.cancelledBy = req.user?.userId;
      updateData.cancelledAt = new Date();
    }

    const updated = await prisma.appointment.update({ where: { id }, data: updateData });

    res.status(200).json({ success: true, message: 'Appointment status updated', data: { appointment: updated } });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating appointment status' });
  }
};

export const updateTimeSlot = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!req.user || !['RECEPTIONIST', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
    }

    const id = String(req.params.id);
    const { isAvailable, maxBookings, currentBookings } = req.body || {};

    const slot = await prisma.timeSlot.findUnique({ where: { id } });
    if (!slot) return res.status(404).json({ success: false, message: 'TimeSlot not found' });

    const data: any = {};
    if (typeof isAvailable === 'boolean') data.isAvailable = isAvailable;
    if (typeof maxBookings === 'number') data.maxBookings = Math.max(1, maxBookings);
    if (typeof currentBookings === 'number') data.currentBookings = Math.max(0, currentBookings);

    // if currentBookings >= maxBookings -> mark unavailable
    if (data.currentBookings !== undefined || data.maxBookings !== undefined) {
      const eventualCurrent = data.currentBookings !== undefined ? data.currentBookings : slot.currentBookings;
      const eventualMax = data.maxBookings !== undefined ? data.maxBookings : slot.maxBookings;
      data.isAvailable = eventualCurrent < eventualMax;
    }

    const updated = await prisma.timeSlot.update({ where: { id }, data });

    res.status(200).json({ success: true, message: 'TimeSlot updated', data: { timeSlot: updated } });
  } catch (error) {
    console.error('Update timeslot error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating timeslot' });
  }
};
