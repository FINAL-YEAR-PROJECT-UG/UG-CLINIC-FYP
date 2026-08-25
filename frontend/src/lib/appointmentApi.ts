import api from './api';

export interface ApiService {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  category: string;
}

export interface ApiAppointment {
  id: string;
  userId: string;
  serviceId: string;
  date: string;
  timeSlot: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
  reason: string;
  notes?: string | null;
  createdAt: string;
  service?: { id: string; name: string; category?: string; duration?: number } | null;
  doctor?: { firstName: string; lastName: string } | null;
}

export interface StaffDashboardAppointment {
  id: string;
  date: string;
  timeSlot: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
  reason: string;
  service?: { id: string; name: string; category?: string; duration?: number } | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    studentId?: string | null;
    email: string;
  };
  doctor?: { firstName: string; lastName: string } | null;
}

export interface StaffDashboardSummary {
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalStudents: number;
  totalDoctors: number;
  totalServices: number;
}

export interface StaffDashboardData {
  summary: StaffDashboardSummary;
  recentAppointments: StaffDashboardAppointment[];
  upcomingAppointments: StaffDashboardAppointment[];
  dailyTrends?: Array<{ date: string; dayName: string; count: number }>;
}

export interface CreateAppointmentData {
  serviceId: string;
  date: string;
  timeSlot: string;
  reason: string;
  notes?: string;
  doctorId?: string;
}

export const appointmentApi = {
  listServices: async (): Promise<ApiService[]> => {
    const response = await api.get<{ success: boolean; data: { services: ApiService[] } }>(
      '/services'
    );
    return response.data.data.services;
  },

  getAvailability: async (
    date: string,
    serviceId?: string,
    excludeAppointmentId?: string
  ): Promise<{
    bookedSlots: string[];
    hasExistingBooking?: boolean;
    existingTimeSlot?: string | null;
    existingAppointmentId?: string | null;
  }> => {
    const params = new URLSearchParams({ date });
    if (serviceId) params.set('serviceId', serviceId);
    if (excludeAppointmentId) params.set('excludeAppointmentId', excludeAppointmentId);
    const response = await api.get<{
      success: boolean;
      data: {
        bookedSlots: string[];
        hasExistingBooking?: boolean;
        existingTimeSlot?: string | null;
        existingAppointmentId?: string | null;
      };
    }>(`/appointments/availability?${params}`);
    return response.data.data;
  },

  getMyAppointments: async (): Promise<ApiAppointment[]> => {
    const response = await api.get<{ success: boolean; data: { appointments: ApiAppointment[] } }>(
      '/appointments'
    );
    return response.data.data.appointments;
  },

  getStaffDashboard: async (): Promise<StaffDashboardData> => {
    const response = await api.get<{ success: boolean; data: StaffDashboardData }>('/appointments/staff/dashboard');
    return response.data.data;
  },

  create: async (
    data: CreateAppointmentData
  ): Promise<{ success: boolean; message: string; data?: { appointment: ApiAppointment } }> => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  reschedule: async (
    id: string,
    data: { date: string; timeSlot: string }
  ): Promise<{ success: boolean; message: string; data?: { appointment: ApiAppointment } }> => {
    const response = await api.patch(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  cancel: async (
    id: string,
    data: { cancellationReason: string; cancellationNote?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/appointments/${id}/cancel`, data);
    return response.data;
  },
};
