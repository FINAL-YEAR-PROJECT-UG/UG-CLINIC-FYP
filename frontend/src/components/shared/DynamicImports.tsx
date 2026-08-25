/**
 * Dynamic Imports Configuration
 * 
 * This file exports dynamically imported components to enable code splitting
 * and reduce initial bundle size. Heavy components are loaded only when needed.
 */

import dynamic from 'next/dynamic';
import React, { useState, useCallback } from 'react';

// Loading component for dynamic imports
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Error component for dynamic imports
const ErrorFallback = ({ error }: { error?: Error }) => (
  <div className="p-4 text-center text-red-600">
    <p>Failed to load component</p>
    {error && <p className="text-sm mt-1">{error.message}</p>}
  </div>
);

// ── AI Components (typically heavy) ─────────────────────────────────────────────

/**
 * Dynamic import for Staff AI Sidebar
 * Already optimized with no SSR and custom loading state
 */
export const StaffAiSidebar = dynamic(
  () => import('@/components/shared/StaffAiSidebar'),
  {
    ssr: false,
    loading: () => null, // Show nothing while loading (already optimized in original)
  }
);

// ── Chart/Data Visualization Components ───────────────────────────────────────

/**
 * Dynamic import for dashboard charts and analytics
 * These are typically heavy and only needed on dashboard pages
 */
export const DashboardCharts = dynamic(
  () => import('@/components/dashboard/DashboardCharts'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

/**
 * Dynamic import for appointment statistics charts
 */
export const AppointmentStatsChart = dynamic(
  () => import('@/components/dashboard/AppointmentStatsChart'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

// ── Form Components (can be loaded on demand) ───────────────────────────────────

/**
 * Dynamic import for complex booking form
 */
export const BookingForm = dynamic(
  () => import('@/components/booking/BookingForm'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

/**
 * Dynamic import for appointment rescheduling form
 */
export const RescheduleForm = dynamic(
  () => import('@/components/booking/RescheduleForm'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

/**
 * Dynamic import for complex forms with validation
 */
export const DynamicForm = dynamic(
  () => import('@/components/forms/DynamicForm'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

// ── Modal/Dialog Components (load on interaction) ──────────────────────────────

/**
 * Dynamic import for appointment cancel modal
 */
export const CancelAppointmentModal = dynamic(
  () => import('@/components/modals/CancelAppointmentModal'),
  {
    ssr: false,
    loading: () => null, // Don't show loading for modals
  }
);

/**
 * Dynamic import for doctor assignment modal
 */
export const AssignDoctorModal = dynamic(
  () => import('@/components/modals/AssignDoctorModal'),
  {
    ssr: false,
    loading: () => null,
  }
);

/**
 * Dynamic import for reschedule modal
 */
export const RescheduleModal = dynamic(
  () => import('@/components/modals/RescheduleModal'),
  {
    ssr: false,
    loading: () => null,
  }
);

// ── Table Components (can be heavy with many rows) ─────────────────────────────

/**
 * Dynamic import for data tables with sorting/filtering
 */
export const DataTable = dynamic(
  () => import('@/components/tables/DataTable'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

/**
 * Dynamic import for appointments table
 */
export const AppointmentsTable = dynamic(
  () => import('@/components/tables/AppointmentsTable'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

/**
 * Dynamic import for students table
 */
export const StudentsTable = dynamic(
  () => import('@/components/tables/StudentsTable'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

// ── Rich Text/Editor Components ────────────────────────────────────────────────

/**
 * Dynamic import for rich text editor (very heavy)
 */
export const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

// ── File Upload Components ─────────────────────────────────────────────────────

/**
 * Dynamic import for file upload component
 */
export const FileUpload = dynamic(
  () => import('@/components/upload/FileUpload'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

// ── Calendar/Date Picker Components ─────────────────────────────────────────────

/**
 * Dynamic import for advanced calendar component
 */
export const AdvancedCalendar = dynamic(
  () => import('@/components/calendar/AdvancedCalendar'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

// ── PDF/Document Viewers ───────────────────────────────────────────────────────

/**
 * Dynamic import for PDF viewer
 */
export const PDFViewer = dynamic(
  () => import('@/components/viewers/PDFViewer'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

// ── Notification/Toast Components ───────────────────────────────────────────────

/**
 * Dynamic import for advanced notification system
 */
export const NotificationSystem = dynamic(
  () => import('@/components/notifications/NotificationSystem'),
  {
    ssr: false,
    loading: () => null,
  }
);

// ── Admin/Management Components ────────────────────────────────────────────────

/**
 * Dynamic import for admin dashboard components
 */
export const AdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

/**
 * Dynamic import for user management component
 */
export const UserManagement = dynamic(
  () => import('@/components/admin/UserManagement'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

// ── Report/Export Components ───────────────────────────────────────────────────

/**
 * Dynamic import for report generation component
 */
export const ReportGenerator = dynamic(
  () => import('@/components/reports/ReportGenerator'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

/**
 * Dynamic import for data export component
 */
export const DataExport = dynamic(
  () => import('@/components/reports/DataExport'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

// ── Help/Support Components ───────────────────────────────────────────────────

/**
 * Dynamic import for help center/chat widget
 */
export const HelpWidget = dynamic(
  () => import('@/components/help/HelpWidget'),
  {
    ssr: false,
    loading: () => null,
  }
);

// ── Utility Components ─────────────────────────────────────────────────────────

/**
 * Dynamic import for image gallery/carousel
 */
export const ImageGallery = dynamic(
  () => import('@/components/gallery/ImageGallery'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

/**
 * Dynamic import for map component
 */
export const MapComponent = dynamic(
  () => import('@/components/map/MapComponent'),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

// ── Hook for lazy loading components with prefetch ─────────────────────────────

/**
 * Custom hook to lazy load components with prefetch on hover
 */
export function useLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (Component) return Component;
    
    setLoading(true);
    setError(null);
    
    try {
      const module = await importFn();
      setComponent(module.default);
      return module.default;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load component'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [importFn, Component]);

  const prefetch = useCallback(() => {
    // Prefetch without showing loading state
    void load();
  }, [load]);

  return { Component, loading, error, load, prefetch };
}