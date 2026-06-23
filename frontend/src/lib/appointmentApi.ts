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

export interface CreateAppointmentData {
  serviceId: string;
  date: string;
  timeSlot: string;
  reason: string;
  notes?: string;
}

export const appointmentApi = {
  listServices: async (): Promise<ApiService[]> => {
    const response = await api.get<{ success: boolean; data: { services: ApiService[] } }>(
      '/services'
    );
    return response.data.data.services;
  },

  getAvailability: async (date: string, serviceId?: string): Promise<string[]> => {
    const params = new URLSearchParams({ date });
    if (serviceId) params.set('serviceId', serviceId);
    const response = await api.get<{ success: boolean; data: { bookedSlots: string[] } }>(
      `/appointments/availability?${params}`
    );
    return response.data.data.bookedSlots;
  },

  getMyAppointments: async (): Promise<ApiAppointment[]> => {
    const response = await api.get<{ success: boolean; data: { appointments: ApiAppointment[] } }>(
      '/appointments'
    );
    return response.data.data.appointments;
  },

  create: async (
    data: CreateAppointmentData
  ): Promise<{ success: boolean; message: string; data?: { appointment: ApiAppointment } }> => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  cancel: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/appointments/${id}/cancel`);
    return response.data;
  },
};
