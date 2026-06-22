export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "admin" | "staff";
  department?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  studentId: string;
  serviceId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  createdAt?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: "room" | "equipment" | "facility";
  location?: string;
  availability?: boolean;
  createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

