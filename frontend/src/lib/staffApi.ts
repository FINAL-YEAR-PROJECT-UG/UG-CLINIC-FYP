import api from './api';

export interface StaffAppointment {
  id: string;
  date: string;
  timeSlot: string;
  status: string;
  reason: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    studentId?: string;
    email: string;
  };
  service?: {
    id: string;
    name: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    doctorStatus?: string;
  };
}

export interface StaffDoctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  doctorStatus: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
  _count?: {
    doctorAppointments: number;
  };
}

export interface StaffTimeSlot {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxBookings: number;
  currentBookings: number;
  service?: {
    id: string;
    name: string;
  };
}

export interface StaffStudent {
  id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  studentId?: string;
  email: string;
  phone?: string;
  program?: string;
  gender?: string;
  isResident?: string;
  isActive: boolean;
  dateOfBirth?: string;
  createdAt: string;
  appointments?: StaffAppointment[];
}

export interface StaffResource {
  id: string;
  title: string;
  description?: string;
  category: string;
  fileType: string;
  fileUrl: string;
  fileSize?: number;
  tags?: string[];
  isPublic?: boolean;
  status?: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED' | 'FLAGGED';
  securityScanStatus?: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  securityScanDetails?: string;
  authorName?: string;
  authorEmail?: string;
  createdAt: string;
  uploader?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SecurityScanResponse {
  status: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  riskScore: number;
  threatsDetected: string[];
  scanDetails: string;
  scannedAt: string;
}

export interface PublicResourceSubmissionPayload {
  title: string;
  description?: string;
  category?: string;
  fileUrl?: string;
  authorName?: string;
  authorEmail?: string;
}

export interface DailyTrend {
  date: string;
  dayName: string;
  count: number;
}

export interface StaffDashboardData {
  summary: {
    totalAppointments: number;
    todayAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalStudents: number;
    totalDoctors: number;
    totalServices: number;
  };
  recentAppointments: StaffAppointment[];
  upcomingAppointments: StaffAppointment[];
  dailyTrends?: DailyTrend[];
}

export const staffApi = {
  getStaffDashboard: async (): Promise<StaffDashboardData> => {
    const response = await api.get<{ success: boolean; data: StaffDashboardData }>('/appointments/staff/dashboard');
    return response.data.data;
  },

  getAllStaffAppointments: async (): Promise<{ appointments: StaffAppointment[] }> => {
    const response = await api.get<{ success: boolean; data: { appointments: StaffAppointment[] } }>('/appointments/staff/all');
    return response.data.data;
  },

  getAllStudents: async (): Promise<{ students: StaffStudent[] }> => {
    const response = await api.get<{ success: boolean; data: { students: StaffStudent[] } }>('/staff/students');
    return response.data.data;
  },

  getStudentHistory: async (studentId: string): Promise<{ student: StaffStudent }> => {
    const response = await api.get<{ success: boolean; data: { student: StaffStudent } }>(`/staff/students/${studentId}/history`);
    return response.data.data;
  },

  updateStudentStatus: async (studentId: string, isActive: boolean): Promise<void> => {
    await api.patch(`/staff/students/${studentId}`, { isActive });
  },

  getDoctors: async (): Promise<{ doctors: StaffDoctor[] }> => {
    const response = await api.get<{ success: boolean; data: { doctors: StaffDoctor[] } }>('/staff/doctors');
    return response.data.data;
  },

  updateDoctorStatus: async (status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE', doctorId?: string): Promise<void> => {
    await api.patch('/staff/doctors/status', { status, doctorId });
  },

  getTimeSlots: async (serviceId?: string, date?: string): Promise<{ timeSlots: StaffTimeSlot[] }> => {
    const params: any = {};
    if (serviceId) params.serviceId = serviceId;
    if (date) params.date = date;
    const response = await api.get<{ success: boolean; data: { timeSlots: StaffTimeSlot[] } }>('/appointments/timeslots', { params });
    return response.data.data;
  },

  updateTimeSlotStatus: async (slotId: string, isAvailable: boolean): Promise<void> => {
    await api.patch(`/appointments/timeslot/${slotId}`, { isAvailable });
  },

  updateTimeSlotCapacity: async (slotId: string, maxBookings: number, isAvailable?: boolean): Promise<void> => {
    const payload: any = { maxBookings };
    if (typeof isAvailable === 'boolean') payload.isAvailable = isAvailable;
    await api.patch(`/appointments/timeslot/${slotId}`, payload);
  },

  batchUpdateTimeSlots: async (data: {
    date: string;
    action: string;
    maxBookings?: number;
    sessionFilter?: string;
  }): Promise<{ updatedCount: number; message: string; timeSlots: StaffTimeSlot[] }> => {
    const response = await api.patch<{
      success: boolean;
      message: string;
      data: { timeSlots: StaffTimeSlot[]; updatedCount: number };
    }>('/appointments/timeslots/batch', data);
    return {
      updatedCount: response.data.data.updatedCount,
      message: response.data.message,
      timeSlots: response.data.data.timeSlots,
    };
  },

  batchUpdateDoctorStatuses: async (
    status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE',
    doctorIds?: string[],
  ): Promise<{ updatedCount: number; message: string }> => {
    const response = await api.patch<{
      success: boolean;
      message: string;
      data: { updatedCount: number; status: string };
    }>('/staff/doctors/batch-status', { status, doctorIds });
    return { updatedCount: response.data.data.updatedCount, message: response.data.message };
  },

  getAllStaffResources: async (params?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<{ resources: StaffResource[] }> => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== 'all') qs.set('status', params.status);
    if (params?.category && params.category !== 'all') qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get<{ success: boolean; data: { resources: StaffResource[] } }>(`/resources/staff${query}`);
    return response.data.data;
  },

  uploadResource: async (data: {
    title: string;
    description?: string;
    category: string;
    fileType: string;
    fileUrl: string;
    fileSize?: number;
    isPublic?: boolean;
    tags?: string[];
  }): Promise<{ resource: StaffResource; scanResult?: SecurityScanResponse }> => {
    const response = await api.post<{ success: boolean; data: { resource: StaffResource; scanResult?: SecurityScanResponse } }>('/resources', { ...data, fileSize: data.fileSize ?? 1024 * 100 });
    return response.data.data;
  },

  updateResourceDetails: async (
    resourceId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      fileUrl?: string;
      fileType?: string;
      isPublic?: boolean;
      status?: string;
      tags?: string[];
    },
  ): Promise<StaffResource> => {
    const response = await api.patch<{ success: boolean; data: { resource: StaffResource } }>(`/resources/${resourceId}`, data);
    return response.data.data.resource;
  },

  reviewResourceSubmission: async (
    resourceId: string,
    action: 'APPROVE' | 'REJECT' | 'FLAG',
  ): Promise<StaffResource> => {
    const response = await api.patch<{ success: boolean; data: { resource: StaffResource } }>(`/resources/${resourceId}/review`, { action });
    return response.data.data.resource;
  },

  deleteResource: async (resourceId: string): Promise<void> => {
    await api.delete(`/resources/${resourceId}`);
  },

  updateAppointmentStatus: async (appointmentId: string, status: string): Promise<void> => {
    await api.patch(`/appointments/${appointmentId}/status`, { status });
  },

  staffCancelAppointment: async (appointmentId: string, reason: string, note?: string): Promise<void> => {
    await api.post(`/appointments/${appointmentId}/staff-cancel`, { cancellationReason: reason, cancellationNote: note });
  },

  assignDoctorToAppointment: async (appointmentId: string, doctorId: string): Promise<void> => {
    await api.patch(`/appointments/${appointmentId}/assign-doctor`, { doctorId });
  },

  rescheduleAppointment: async (appointmentId: string, date: string, timeSlot: string): Promise<void> => {
    await api.patch(`/appointments/${appointmentId}/reschedule`, { date, timeSlot });
  },

  autoAssignDoctors: async (): Promise<{ assignedCount: number; message: string }> => {
    const response = await api.post<{ success: boolean; message: string; data: { assignedCount: number } }>('/staff/auto-assign-doctors');
    return { assignedCount: response.data.data.assignedCount, message: response.data.message };
  },

  autoConfirmPending: async (): Promise<{ confirmedCount: number; message: string }> => {
    const response = await api.post<{ success: boolean; message: string; data: { confirmedCount: number } }>('/staff/auto-confirm-pending');
    return { confirmedCount: response.data.data.confirmedCount, message: response.data.message };
  },
};

export const getStaffDashboard = staffApi.getStaffDashboard;
export const getAllStaffAppointments = staffApi.getAllStaffAppointments;
export const getAllStudents = staffApi.getAllStudents;
export const getStudentHistory = staffApi.getStudentHistory;
export const updateStudentStatus = staffApi.updateStudentStatus;
export const getDoctors = staffApi.getDoctors;
export const updateDoctorStatus = staffApi.updateDoctorStatus;
export const getTimeSlots = staffApi.getTimeSlots;
export const updateTimeSlotStatus = staffApi.updateTimeSlotStatus;
export const updateTimeSlotCapacity = staffApi.updateTimeSlotCapacity;
export const batchUpdateTimeSlots = staffApi.batchUpdateTimeSlots;
export const batchUpdateDoctorStatuses = staffApi.batchUpdateDoctorStatuses;
export const getAllStaffResources = staffApi.getAllStaffResources;
export const uploadResource = staffApi.uploadResource;
export const updateResourceDetails = staffApi.updateResourceDetails;
export const reviewResourceSubmission = staffApi.reviewResourceSubmission;
export const deleteResource = staffApi.deleteResource;
export const updateAppointmentStatus = staffApi.updateAppointmentStatus;
export const staffCancelAppointment = staffApi.staffCancelAppointment;
export const assignDoctorToAppointment = staffApi.assignDoctorToAppointment;
export const rescheduleAppointment = staffApi.rescheduleAppointment;
export const autoAssignDoctors = staffApi.autoAssignDoctors;
export const autoConfirmPending = staffApi.autoConfirmPending;

// Public (unauthenticated) submission of articles for staff review
import axios from 'axios';
const publicApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005/api' });

export const submitPublicResource = async (payload: PublicResourceSubmissionPayload): Promise<{
  success: boolean;
  message: string;
  scanResult?: SecurityScanResponse;
}> => {
  const response = await publicApi.post<{
    success: boolean;
    message: string;
    data: { resource: StaffResource; scanResult?: SecurityScanResponse };
  }>('/resources/submit-public', payload);
  return {
    success: response.data.success,
    message: response.data.message,
    scanResult: response.data.data?.scanResult,
  };
};



