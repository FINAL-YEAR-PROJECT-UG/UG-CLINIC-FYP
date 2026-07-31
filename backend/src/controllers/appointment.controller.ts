import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Helper to convert time slot string to minutes since midnight
function timeSlotToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const trimmed = String(timeStr).trim();
  const ampmMatch = trimmed.match(/(am|pm)/i);
  const ampm = ampmMatch ? ampmMatch[1].toUpperCase() : null;
  const timeOnly = trimmed.replace(/(am|pm)/i, '').trim();
  const [hoursStr, minutesStr] = timeOnly.split(':');
  let hours = parseInt(hoursStr, 10) || 0;
  const minutes = parseInt(minutesStr, 10) || 0;

  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

// Mapping of frontend-friendly alias IDs to service names for resolution
const SERVICE_ALIAS_TO_NAME: Record<string, string> = {
  general: 'General Consultation',
  mental: 'Mental Health & Counseling',
  'eye-care': 'Eye Care Services',
  dental: 'Dental Checkup & Oral Health',
  hiv: 'HIV/AIDS Testing & Support',
  nutrition: 'Nutrition & Dietetics',
  screening: 'Comprehensive Health Screening',
  vaccination: 'Vaccinations & Immunizations',
  'family-planning': 'Family Planning & Reproductive Health',
  prescription: 'Prescription & Pharmacy Refill',
};

/**
 * Resolve a service identifier (either DB UUID, alias key, or partial name)
 * to a real Service DB record. Auto-creates active service if missing.
 */
async function resolveService(idOrAlias: string) {
  if (!idOrAlias) return null;

  // 1. Try exact DB ID match first (UUID format)
  const byId = await prisma.service.findUnique({ where: { id: idOrAlias } });
  if (byId) return byId;

  // 2. Try alias map or exact name match
  const targetName = SERVICE_ALIAS_TO_NAME[idOrAlias] ?? idOrAlias;
  const byExactName = await prisma.service.findFirst({
    where: { name: { equals: targetName, mode: 'insensitive' } },
  });
  if (byExactName) return byExactName;

  // 3. Try case-insensitive contains match
  const byFuzzy = await prisma.service.findFirst({
    where: { name: { contains: String(idOrAlias), mode: 'insensitive' } },
  });
  if (byFuzzy) return byFuzzy;

  // 4. Fallback: Auto-create active service to ensure appointment booking never fails
  try {
    const fallbackName = SERVICE_ALIAS_TO_NAME[idOrAlias] || idOrAlias;
    const created = await prisma.service.create({
      data: {
        name: fallbackName,
        description: `${fallbackName} service for UG clinic students`,
        duration: 30,
        category: 'General Medicine',
        isActive: true,
      },
    });
    return created;
  } catch (err) {
    console.error('Failed to auto-create service:', err);
    return null;
  }
}

/**
 * Start/end of day helpers for date window queries
 */
function startOfDay(d: Date) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}
function endOfDay(d: Date) {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

/**
 * Check whether a specific doctor already has an active appointment
 * at the same date + time slot (used to prevent double-booking).
 */
async function isDoctorDoubleBooked(
  doctorId: string,
  date: Date,
  timeSlot: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  const conflicting = await prisma.appointment.findFirst({
    where: {
      doctorId,
      date: { gte: startOfDay(date), lte: endOfDay(date) },
      timeSlot,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { id: true },
  });
  return !!conflicting;
}

// ==========================================================================
// PUBLIC / STUDENT ENDPOINTS
// ==========================================================================

export const getAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { date, serviceId } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, message: 'Appointment date is required' });
    }

    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid appointment date format' });
    }

    const sDay = startOfDay(appointmentDate);
    const eDay = endOfDay(appointmentDate);

    const whereDate: any = { date: { gte: sDay, lte: eDay }, status: { notIn: ['CANCELLED', 'NO_SHOW'] } };

    // If a specific service is requested, filter booked slots to that service.
    // If no service filter, ALL appointments (any service) block the time slot
    // because the clinic cannot run two appointments in the same slot for the
    // same room/resource pool in this MVP.
    if (typeof serviceId === 'string' && serviceId) {
      const resolved = await resolveService(serviceId);
      if (resolved) whereDate.serviceId = resolved.id;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereDate,
      select: { timeSlot: true },
    });

    let bookedSlots = appointments.map((a) => a.timeSlot);

    const today = new Date();
    const isToday =
      today.getFullYear() === appointmentDate.getFullYear() &&
      today.getMonth() === appointmentDate.getMonth() &&
      today.getDate() === appointmentDate.getDate();

    if (isToday) {
      const currentMinutes = today.getHours() * 60 + today.getMinutes();
      const allPossibleSlots = [
        '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM',
        '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
        '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM',
        '03:30 PM', '04:00 PM',
      ];

      const pastSlots = allPossibleSlots.filter((slot) => timeSlotToMinutes(slot) < currentMinutes);
      bookedSlots = [...new Set([...bookedSlots, ...pastSlots])];
    }

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
    if (req.user?.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Only students may book appointments directly' });
    }

    const { serviceId, date, timeSlot, reason, notes, doctorId } = req.body;

    if (!serviceId || !date || !timeSlot || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Service, date, time slot, and reason are required',
      });
    }

    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    // Prevent past-date bookings entirely
    const todayStart = startOfDay(new Date());
    if (startOfDay(appointmentDate) < todayStart) {
      return res.status(400).json({ success: false, message: 'Cannot book an appointment in the past' });
    }

    // Prevent past-time slot if it's today
    const today = new Date();
    const isToday =
      today.getFullYear() === appointmentDate.getFullYear() &&
      today.getMonth() === appointmentDate.getMonth() &&
      today.getDate() === appointmentDate.getDate();

    if (isToday) {
      const slotMinutes = timeSlotToMinutes(timeSlot);
      const currentMinutes = today.getHours() * 60 + today.getMinutes();
      if (slotMinutes < currentMinutes) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book a time slot that has already passed',
        });
      }
    }

    const service = await resolveService(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (!service.isActive) {
      return res.status(400).json({ success: false, message: 'Service is currently unavailable' });
    }

    // Validate doctorId (optional): must be a valid, active DOCTOR
    let resolvedDoctorId: string | null = null;
    if (doctorId && typeof doctorId === 'string' && doctorId.trim()) {
      const doctor = await prisma.user.findUnique({ where: { id: doctorId.trim() } });
      if (!doctor || doctor.role !== 'DOCTOR' || !doctor.isActive) {
        return res.status(400).json({ success: false, message: 'Selected doctor is not available' });
      }
      if (doctor.doctorStatus === 'ON_LEAVE') {
        return res.status(400).json({ success: false, message: 'Selected doctor is currently on leave' });
      }
      resolvedDoctorId = doctor.id;
    }

    const appointment = await prisma.$transaction(async (tx) => {
      // One appointment per student per day
      const existingSameDay = await tx.appointment.findFirst({
        where: {
          userId,
          date: { gte: startOfDay(appointmentDate), lte: endOfDay(appointmentDate) },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      });
      if (existingSameDay) {
        throw new Error('You already have an appointment on this date');
      }

      // Time-slot conflict (any user taking that slot across services -> treat as booked since single-room MVP)
      const conflictingTime = await tx.appointment.findFirst({
        where: {
          date: { gte: startOfDay(appointmentDate), lte: endOfDay(appointmentDate) },
          timeSlot,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      });
      if (conflictingTime) {
        throw new Error('Time slot is already booked');
      }

      // Doctor double-booking check
      if (resolvedDoctorId) {
        const doctorConflict = await tx.appointment.findFirst({
          where: {
            doctorId: resolvedDoctorId,
            date: { gte: startOfDay(appointmentDate), lte: endOfDay(appointmentDate) },
            timeSlot,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          },
        });
        if (doctorConflict) {
          throw new Error('Selected doctor is already booked at this time');
        }
      }

      // Optional: Update TimeSlot record if it exists for audit/capacity tracking
      try {
        const slot = await tx.timeSlot.findFirst({
          where: {
            serviceId: service.id,
            date: { gte: startOfDay(appointmentDate), lte: endOfDay(appointmentDate) },
            startTime: timeSlot,
          },
        });
        if (slot) {
          if (!slot.isAvailable || slot.currentBookings >= slot.maxBookings) {
            throw new Error('Time slot is fully booked');
          }
          const nextBookings = slot.currentBookings + 1;
          await tx.timeSlot.update({
            where: { id: slot.id },
            data: {
              currentBookings: nextBookings,
              isAvailable: nextBookings < slot.maxBookings,
            },
          });
        }
      } catch (e) {
        if (e instanceof Error && /booked/i.test(e.message)) throw e;
        // Ignore missing TimeSlot rows (system works without them as well)
      }

      const newAppointment = await tx.appointment.create({
        data: {
          userId,
          serviceId: service.id,
          doctorId: resolvedDoctorId,
          date: appointmentDate,
          timeSlot,
          reason: String(reason).trim().slice(0, 500),
          notes: notes ? String(notes).trim().slice(0, 1000) : null,
          status: resolvedDoctorId ? 'CONFIRMED' : 'PENDING',
        },
        include: {
          service: { select: { id: true, name: true, category: true } },
          doctor: { select: { firstName: true, lastName: true } },
        },
      });

      return newAppointment;
    });

    res.status(201).json({
      success: true,
      message: resolvedDoctorId
        ? 'Appointment booked and confirmed successfully'
        : 'Appointment submitted successfully, pending doctor assignment',
      data: { appointment },
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    if (error instanceof Error) {
      switch (error.message) {
        case 'Service not found':
          return res.status(404).json({ success: false, message: error.message });
        case 'Service is currently unavailable':
        case 'Selected doctor is not available':
        case 'Selected doctor is currently on leave':
        case 'Cannot book an appointment in the past':
        case 'Cannot book a time slot that has already passed':
          return res.status(400).json({ success: false, message: error.message });
        case 'You already have an appointment on this date':
        case 'Time slot is already booked':
        case 'Time slot is fully booked':
        case 'Selected doctor is already booked at this time':
          return res.status(409).json({ success: false, message: error.message });
      }
    }
    res.status(500).json({
      success: false,
      message: 'An error occurred while booking the appointment',
    });
  }
};

/**
 * cancelAppointment handles BOTH student self-cancel (/:id/cancel) and
 * staff-initiated cancel (/:id/staff-cancel).  For students, we require the
 * userId match.  For staff (RECEPTIONIST/DOCTOR/ADMIN), no userId match.
 */
export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const requestingUserId = req.user?.userId;
    const requestingRole = (req.user?.role || '') as string;
    if (!requestingUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const isStaff = ['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(requestingRole);
    const id = String(req.params.id);

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (!isStaff && appointment.userId !== requestingUserId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
    }

    const { cancellationReason, cancellationNote } = req.body || {};
    if (!cancellationReason || typeof cancellationReason !== 'string' || !cancellationReason.trim()) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Decrement capacity on the TimeSlot if it still exists (restore availability)
      try {
        await tx.timeSlot.updateMany({
          where: {
            serviceId: appointment.serviceId,
            date: { gte: startOfDay(appointment.date), lte: endOfDay(appointment.date) },
            startTime: appointment.timeSlot,
            currentBookings: { gt: 0 },
          },
          data: {
            currentBookings: { decrement: 1 },
            isAvailable: true,
          },
        });
      } catch {
        // ignore if no matching TimeSlot
      }

      return tx.appointment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledBy: requestingUserId,
          cancelledAt: new Date(),
          cancellationReason: String(cancellationReason).trim().slice(0, 100),
          cancellationNote: cancellationNote ? String(cancellationNote).trim().slice(0, 1000) : null,
        },
      });
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

// ==========================================================================
// STAFF ENDPOINTS
// ==========================================================================

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

    const appointments = await prisma.appointment.findMany({
      where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
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
      where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
      _count: { id: true },
    });

    const todayCount = await prisma.appointment.count({
      where: {
        date: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    const summary = {
      totalAppointments: statusCounts.reduce((sum, item) => sum + item._count.id, 0),
      todayAppointments: todayCount,
      pendingAppointments: statusCounts.find((item) => item.status === 'PENDING')?._count.id ?? 0,
      confirmedAppointments: statusCounts.find((item) => item.status === 'CONFIRMED')?._count.id ?? 0,
      completedAppointments: statusCounts.find((item) => item.status === 'COMPLETED')?._count.id ?? 0,
      cancelledAppointments: statusCounts.find((item) => item.status === 'CANCELLED')?._count.id ?? 0,
      totalStudents: await prisma.user.count({ where: { role: 'STUDENT' } }),
      totalDoctors: await prisma.user.count({ where: { role: 'DOCTOR' } }),
      totalServices: await prisma.service.count({ where: { isActive: true } }),
    };

    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = startOfDay(d);
      const dayEnd = endOfDay(d);

      const count = await prisma.appointment.count({
        where: { date: { gte: dayStart, lte: dayEnd } },
      });

      dailyTrends.push({
        date: dayStart.toISOString().split('T')[0],
        dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      });
    }

    const t0 = startOfDay(new Date());
    const recentAppointments = appointments.filter((apt) => apt.date < t0);
    const upcomingAppointments = appointments.filter((apt) => apt.date >= t0);

    res.status(200).json({
      success: true,
      data: { summary, recentAppointments, upcomingAppointments, dailyTrends },
    });
  } catch (error) {
    console.error('Get staff dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the staff dashboard',
    });
  }
};

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
    if (serviceId) {
      const resolved = await resolveService(serviceId);
      if (resolved) where.serviceId = resolved.id;
      else where.serviceId = String(serviceId);
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startOfDay(new Date(String(startDate)));
      if (endDate) where.date.lte = endOfDay(new Date(String(endDate)));
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
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

    res.status(200).json({
      success: true,
      data: { appointments, total, page: pageNum, pageSize: size },
    });
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching appointments' });
  }
};

export const assignDoctorToAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || '';
    if (!req.user || !['RECEPTIONIST', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: receptionist/admin only' });
    }

    const id = String(req.params.id);
    const { doctorId } = req.body || {};
    if (!doctorId) return res.status(400).json({ success: false, message: 'Doctor ID is required' });

    const doctor = await prisma.user.findUnique({ where: { id: String(doctorId) } });
    if (!doctor || doctor.role !== 'DOCTOR' || !doctor.isActive) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign doctor to a ${appointment.status.toLowerCase()} appointment`,
      });
    }

    // Guard against double-booking the same doctor in the same slot
    const conflict = await isDoctorDoubleBooked(doctor.id, appointment.date, appointment.timeSlot, id);
    if (conflict) {
      return res.status(409).json({ success: false, message: 'Doctor already has an appointment at this time' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { doctorId: doctor.id, status: 'CONFIRMED' },
      include: { doctor: { select: { firstName: true, lastName: true } } },
    });

    res.status(200).json({ success: true, message: 'Doctor assigned', data: { appointment: updated } });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while assigning doctor' });
  }
};

export const rescheduleAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || '';
    const isStaff = ['RECEPTIONIST', 'ADMIN'].includes(userRole);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const id = String(req.params.id);
    const { date, timeSlot } = req.body || {};
    if (!date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Date and time slot are required' });
    }

    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    // Prevent past-date reschedule
    const todayStart = startOfDay(new Date());
    if (startOfDay(appointmentDate) < todayStart) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule to a past date' });
    }

    const isToday =
      todayStart.getTime() === startOfDay(appointmentDate).getTime();
    if (isToday) {
      const slotMinutes = timeSlotToMinutes(timeSlot);
      const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      if (slotMinutes < currentMinutes) {
        return res.status(400).json({ success: false, message: 'Cannot reschedule to a past time slot' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({ where: { id } });
      if (!appointment) throw new Error('Appointment not found');

      // Permission: staff always, student only for own CONFIRMED/PENDING appointments
      if (!isStaff) {
        if (appointment.userId !== userId) throw new Error('Forbidden');
        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
          throw new Error('Cannot reschedule this appointment');
        }
      }

      if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED' || appointment.status === 'NO_SHOW') {
        throw new Error('Cannot reschedule this appointment');
      }

      // Decrement old timeslot capacity
      try {
        await tx.timeSlot.updateMany({
          where: {
            serviceId: appointment.serviceId,
            date: { gte: startOfDay(appointment.date), lte: endOfDay(appointment.date) },
            startTime: appointment.timeSlot,
            currentBookings: { gt: 0 },
          },
          data: { currentBookings: { decrement: 1 }, isAvailable: true },
        });
      } catch {
        /* ignore missing slot */
      }

      // New slot conflict (global - single room MVP)
      const newSlotConflict = await tx.appointment.findFirst({
        where: {
          id: { not: appointment.id },
          date: { gte: startOfDay(appointmentDate), lte: endOfDay(appointmentDate) },
          timeSlot: String(timeSlot),
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      });
      if (newSlotConflict) throw new Error('Time slot is already booked');

      // New slot doctor conflict
      if (appointment.doctorId) {
        const doctorConflict = await tx.appointment.findFirst({
          where: {
            id: { not: appointment.id },
            doctorId: appointment.doctorId,
            date: { gte: startOfDay(appointmentDate), lte: endOfDay(appointmentDate) },
            timeSlot: String(timeSlot),
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          },
        });
        if (doctorConflict) throw new Error('Doctor is already booked at the new time');
      }

      // Increment new timeslot capacity if record exists
      try {
        const newSlot = await tx.timeSlot.findFirst({
          where: {
            serviceId: appointment.serviceId,
            date: { gte: startOfDay(appointmentDate), lte: endOfDay(appointmentDate) },
            startTime: String(timeSlot),
          },
        });
        if (newSlot) {
          if (!newSlot.isAvailable || newSlot.currentBookings >= newSlot.maxBookings) {
            throw new Error('Time slot is fully booked');
          }
          const nextBookings = newSlot.currentBookings + 1;
          await tx.timeSlot.update({
            where: { id: newSlot.id },
            data: { currentBookings: nextBookings, isAvailable: nextBookings < newSlot.maxBookings },
          });
        }
      } catch (e) {
        if (e instanceof Error && /booked/i.test(e.message)) throw e;
      }

      return tx.appointment.update({
        where: { id },
        data: {
          date: appointmentDate,
          timeSlot: String(timeSlot),
          status: 'RESCHEDULED',
          updatedAt: new Date(),
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled',
      data: { appointment: updated },
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    if (error instanceof Error) {
      switch (error.message) {
        case 'Appointment not found':
          return res.status(404).json({ success: false, message: error.message });
        case 'Forbidden':
          return res.status(403).json({ success: false, message: error.message });
        case 'Cannot reschedule this appointment':
        case 'Cannot reschedule to a past date':
        case 'Cannot reschedule to a past time slot':
          return res.status(400).json({ success: false, message: error.message });
        case 'Time slot is already booked':
        case 'Time slot is fully booked':
        case 'Doctor is already booked at the new time':
          return res.status(409).json({ success: false, message: error.message });
      }
    }
    res.status(500).json({ success: false, message: 'An error occurred while rescheduling the appointment' });
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || '';
    if (!req.user || !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: staff access only' });
    }

    const id = String(req.params.id);
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ success: false, message: 'Appointment status is required' });

    const allowed = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment status' });
    }

    const updateData: any = { status };
    if (status === 'CANCELLED') {
      updateData.cancelledBy = req.user?.userId;
      updateData.cancelledAt = new Date();
      if (!updateData.cancellationReason) updateData.cancellationReason = 'Staff cancelled';
    }

    const updated = await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.findUnique({ where: { id } });
      if (apt && status === 'CANCELLED' && apt.status !== 'CANCELLED') {
        try {
          await tx.timeSlot.updateMany({
            where: {
              serviceId: apt.serviceId,
              date: { gte: startOfDay(apt.date), lte: endOfDay(apt.date) },
              startTime: apt.timeSlot,
              currentBookings: { gt: 0 },
            },
            data: { currentBookings: { decrement: 1 }, isAvailable: true },
          });
        } catch {
          /* ignore missing slot */
        }
      }
      return tx.appointment.update({ where: { id }, data: updateData });
    });

    res.status(200).json({
      success: true,
      message: 'Appointment status updated',
      data: { appointment: updated },
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating appointment status' });
  }
};

export const updateTimeSlot = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || '';
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

export const getTimeSlots = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, date } = req.query as any;

    const where: any = {};
    if (serviceId) {
      const resolved = await resolveService(serviceId);
      where.serviceId = resolved ? resolved.id : String(serviceId);
    }
    if (date) {
      const d = new Date(String(date));
      if (!Number.isNaN(d.getTime())) {
        where.date = { gte: startOfDay(d), lte: endOfDay(d) };
      }
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: { service: { select: { id: true, name: true, category: true } } },
    });

    res.status(200).json({ success: true, data: { timeSlots } });
  } catch (error) {
    console.error('Get timeslots error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching time slots' });
  }
};
