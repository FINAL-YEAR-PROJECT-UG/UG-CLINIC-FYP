"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import UGLogo from "@/components/shared/UGLogo";
import { getErrorMessage, normalizeRole, isStaffRole, getStaffRoleLabel, formatTimeLabel, getAppointmentTimestamp } from "@/lib/utils";
import StaffNav from "@/components/shared/StaffNav";
const StaffAiSidebar = dynamic(
  () => import("@/components/shared/StaffAiSidebar"),
  { ssr: false, loading: () => null },
);
import {
  assignDoctorToAppointment,
  rescheduleAppointment,
  staffCancelAppointment,
  updateAppointmentStatus,
  updateTimeSlotStatus,
  updateTimeSlotCapacity,
  batchUpdateTimeSlots,
  type StaffAppointment,
  type StaffDoctor,
  type StaffTimeSlot,
} from "@/lib/staffApi";
import {
  getCachedAppointments,
  getCachedDoctors,
  getCachedStaffDashboard,
  getCachedTimeSlots,
  invalidateAppointmentsCache,
  invalidateDoctorsCache,
  invalidateStaffDashboardCache,
  invalidateTimeSlotsCache,
} from "@/lib/cachedApi";
import { getAppointmentDateRange } from "@/lib/dateFilters";
import type { StaffDashboardData } from "@/lib/staffApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,

  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Layers3,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Unlock,
  UserCheck,
  Users,

  X,
  Zap,
} from "@/components/icons";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  completed: {
    label: "Completed",
    className: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-700 border border-rose-200",
  },
  no_show: {
    label: "No Show",
    className: "bg-rose-50 text-rose-700 border border-rose-200",
  },
  rescheduled: {
    label: "Rescheduled",
    className: "bg-violet-50 text-violet-700 border border-violet-200",
  },
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  // Use UTC to avoid timezone conversion issues
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}


function isSameDay(iso: string, date: Date) {
  return new Date(iso).toDateString() === date.toDateString();
}

function statusMeta(status: string) {
  return (
    STATUS_STYLES[status.toLowerCase()] ?? {
      label: status,
      className: "bg-slate-100 text-slate-700 border border-slate-200",
    }
  );
}

export default function StaffAppointmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const storeIsAuth = useAuthStore((s) => s.isAuthenticated);
  const storeUser = useAuthStore((s) => s.user);

  const [guardResolved, setGuardResolved] = useState(false);
  const [guardRedirecting, setGuardRedirecting] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("Staff");
  const [lastName, setLastName] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"appointments" | "timeslots">(
    "appointments",
  );
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [dashboardSummary, setDashboardSummary] = useState<
    StaffDashboardData["summary"] | null
  >(null);
  const [upcomingPreview, setUpcomingPreview] = useState<StaffAppointment[]>([]);
  const [doctors, setDoctors] = useState<StaffDoctor[]>([]);
  const [timeSlots, setTimeSlots] = useState<StaffTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSlotDate, setSelectedSlotDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(false);

  const [selectedAppointment, setSelectedAppointment] =
    useState<StaffAppointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // Clinical Schedule Automation Controller state
  const [commandPrompt, setCommandPrompt] = useState("");
  const [commandRunning, setCommandRunning] = useState(false);
  const [commandMessage, setCommandMessage] = useState<string | null>(null);
  const [commandLog, setCommandLog] = useState<
    Array<{ role: "user" | "system"; text: string; time: string }>
  >([
    {
      role: "system",
      text: "Slot Automation Ready. Manage capacity based on doctor availability, expand peak hours, or adjust emergency booking limits.",
      time: "System Ready",
    },
  ]);

  const handleAdjustSlotCapacity = async (
    slotId: string,
    currentMax: number,
    delta: number,
  ) => {
    try {
      const targetMax = Math.max(1, currentMax + delta);
      setBusyAction(slotId);
      await updateTimeSlotCapacity(slotId, targetMax);
      await fetchTimeSlots(selectedSlotDate);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to adjust slot capacity"));
    } finally {
      setBusyAction(null);
    }
  };

  const handleBatchSlotAction = async (
    action: string,
    maxBookings?: number,
    sessionFilter?: string,
  ) => {
    try {
      setSlotsLoading(true);
      const res = await batchUpdateTimeSlots({
        date: selectedSlotDate,
        action,
        maxBookings,
        sessionFilter,
      });
      setTimeSlots(res.timeSlots);
      setCommandMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err, "Batch slot operation failed"));
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleRunSlotAutomation = async (inputQuery?: string) => {
    const query = (inputQuery || commandPrompt).trim();
    if (!query) return;
    setCommandPrompt("");
    setCommandRunning(true);
    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setCommandLog((prev) => [
      ...prev,
      { role: "user", text: query, time: nowTime },
    ]);

    try {
      const availableDocsCount = doctors.filter(
        (d) => d.doctorStatus === "AVAILABLE",
      ).length;
      let actionTaken = "";

      const lower = query.toLowerCase();
      if (lower.includes("sync") || lower.includes("doctor")) {
        const res = await batchUpdateTimeSlots({
          date: selectedSlotDate,
          action: "SYNC_DOCTORS",
        });
        setTimeSlots(res.timeSlots);
        actionTaken = `Synced all slot capacities to match the ${availableDocsCount} currently available doctor(s).`;
      } else if (
        lower.includes("emergency") ||
        lower.includes("lockdown") ||
        lower.includes("shrink") ||
        lower.includes("busy")
      ) {
        const res = await batchUpdateTimeSlots({
          date: selectedSlotDate,
          action: "LOCK_AFTERNOON",
        });
        setTimeSlots(res.timeSlots);
        actionTaken = `Emergency protocol executed: Reserved afternoon slots for urgent triage.`;
      } else if (
        lower.includes("expand") ||
        lower.includes("morning") ||
        lower.includes("boost") ||
        lower.includes("increase")
      ) {
        const res = await batchUpdateTimeSlots({
          date: selectedSlotDate,
          action: "EXPAND",
          sessionFilter: "MORNING",
        });
        setTimeSlots(res.timeSlots);
        actionTaken = `Expanded capacity for all morning slots (+1 booking capacity per window).`;
      } else if (
        lower.includes("reset") ||
        lower.includes("default") ||
        lower.includes("1")
      ) {
        const res = await batchUpdateTimeSlots({
          date: selectedSlotDate,
          action: "RESET",
        });
        setTimeSlots(res.timeSlots);
        actionTaken = `Reset all slot capacities to baseline (1 appointment per slot).`;
      } else if (lower.includes("unlock") || lower.includes("open")) {
        const res = await batchUpdateTimeSlots({
          date: selectedSlotDate,
          action: "UNLOCK_ALL",
        });
        setTimeSlots(res.timeSlots);
        actionTaken = `Re-opened all active booking slots for ${selectedSlotDate}.`;
      } else {
        const res = await batchUpdateTimeSlots({
          date: selectedSlotDate,
          action: "SYNC_DOCTORS",
        });
        setTimeSlots(res.timeSlots);
        actionTaken = `Aligned slot capacity with active doctor count (${availableDocsCount} doctor(s) on duty).`;
      }

      setCommandLog((prev) => [
        ...prev,
        {
          role: "system",
          text: `Action Completed: ${actionTaken}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err) {
      setCommandLog((prev) => [
        ...prev,
        {
          role: "system",
          text: `Notice: ${getErrorMessage(err, "Could not adjust slots")}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setCommandRunning(false);
    }
  };
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");

  const appointmentsPerPage = 8;

  useEffect(() => {
    let active = true;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const runGuard = () => {
      const snap = useAuthStore.getState();
      const auth = snap.isAuthenticated || storeIsAuth || isAuthenticated;
      const currentUser = snap.user ?? storeUser ?? user;
      const role = normalizeRole(currentUser?.role);
      const isStaff = isStaffRole(role);

      if (!auth || !currentUser || !isStaff) {
        setGuardRedirecting(true);
        const target = !auth ? "/staff-portal-access" : "/dashboard";
        timeoutHandle = setTimeout(() => {
          if (active) router.replace(target);
        }, 0);
        return;
      }

      setUserRole(role);
      setFirstName(currentUser.firstName || "Staff");
      setLastName(currentUser.lastName || "");
      setGuardResolved(true);
    };

    runGuard();

    return () => {
      active = false;
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [router, storeIsAuth, storeUser, isAuthenticated, user]);

  const fetchAppointments = useCallback(async (force = false) => {
    try {
      setLoading(true);
      const dateRange = getAppointmentDateRange(selectedDate);
      const result = await getCachedAppointments(
        {
          page: currentPage,
          pageSize: appointmentsPerPage,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          search: debouncedSearch.trim() || undefined,
          ...dateRange,
        },
        {
          force,
          onRevalidate: (fresh) => setAppointments(fresh),
        },
      );
      setAppointments(result.data);
      setTotalAppointments(result.total);
      if (result.fromCache) setLoading(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load appointments"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus, selectedDate, debouncedSearch]);

  const fetchDashboardSummary = useCallback(async (force = false) => {
    try {
      const result = await getCachedStaffDashboard({
        force,
        onRevalidate: (dashboard) => {
          setDashboardSummary(dashboard.summary);
          setUpcomingPreview(dashboard.upcomingAppointments.slice(0, 4));
        },
      });
      setDashboardSummary(result.dashboard.summary);
      setUpcomingPreview(result.dashboard.upcomingAppointments.slice(0, 4));
    } catch (err) {
      console.error("Failed to load dashboard summary:", err);
    }
  }, []);

  const fetchDoctors = useCallback(async (force = false) => {
    try {
      const result = await getCachedDoctors({
        force,
        onRevalidate: (fresh) => setDoctors(fresh),
      });
      setDoctors(result.doctors);
    } catch (err) {
      console.error("Failed to load doctors list:", err);
    }
  }, []);

  const fetchTimeSlots = useCallback(async (date: string, force = false) => {
    try {
      setSlotsLoading(true);
      const result = await getCachedTimeSlots(date, {
        force,
        onRevalidate: (fresh) => setTimeSlots(fresh),
      });
      setTimeSlots(result.timeSlots);
      // Immediately hide spinner when returning cached data
      if (result.fromCache) setSlotsLoading(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load booking slots"));
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!guardResolved) return;

    const timeoutHandle = setTimeout(() => {
      void fetchAppointments();
      void fetchDashboardSummary();
      void fetchDoctors();
      void fetchTimeSlots(selectedSlotDate);
    }, 0);

    return () => clearTimeout(timeoutHandle);
  }, [
    guardResolved,
    fetchAppointments,
    fetchDashboardSummary,
    fetchDoctors,
    fetchTimeSlots,
    selectedSlotDate,
  ]);

  const closeAppointmentOverlays = () => {
    setSelectedAppointment(null);
    setShowAssignModal(false);
    setShowCancelModal(false);
    setShowRescheduleModal(false);
  };

  const openAppointment = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setShowAssignModal(false);
    setShowCancelModal(false);
    setShowRescheduleModal(false);
    setSelectedDoctor(appointment.doctor?.id || "");
    setCancelReason("");
    setCancelNote("");
    setRescheduleDate(appointment.date.split("T")[0] || "");
    setRescheduleTime("");
  };

  const handleRefreshAll = async () => {
    invalidateAppointmentsCache();
    invalidateStaffDashboardCache();
    invalidateDoctorsCache();
    invalidateTimeSlotsCache();
    await Promise.all([
      fetchAppointments(true),
      fetchDashboardSummary(true),
      fetchDoctors(true),
      fetchTimeSlots(selectedSlotDate, true),
    ]);
  };

  const [batchUpdating, setBatchUpdating] = useState(false);

  const handleBatchSlots = async (
    action: "OPEN" | "CLOSE" | "EXPAND" | "REDUCE" | "RESET" | "SYNC_DOCTORS",
    sessionFilter?: "MORNING" | "AFTERNOON"
  ) => {
    try {
      setBatchUpdating(true);
      setError(null);
      await batchUpdateTimeSlots({
        date: selectedSlotDate,
        action,
        sessionFilter,
      });
      // Invalidate and force-refetch so slots reflect the mutation
      invalidateTimeSlotsCache(selectedSlotDate);
      await fetchTimeSlots(selectedSlotDate, true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to perform batch slot update"));
    } finally {
      setBatchUpdating(false);
    }
  };

  const handleToggleSlotAvailability = async (
    slotId: string,
    currentAvailable: boolean,
  ) => {
    try {
      setBusyAction(slotId);
      await updateTimeSlotStatus(slotId, !currentAvailable);
      invalidateTimeSlotsCache(selectedSlotDate);
      await fetchTimeSlots(selectedSlotDate, true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update time slot availability"));
    } finally {
      setBusyAction(null);
    }
  };

  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: string,
  ) => {
    try {
      setBusyAction(`appointment-${appointmentId}-${newStatus}`);
      await updateAppointmentStatus(appointmentId, newStatus);
      invalidateAppointmentsCache();
      closeAppointmentOverlays();
      await fetchAppointments(true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update appointment status"));
    } finally {
      setBusyAction(null);
    }
  };

  const handleStaffCancel = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      setError("Cancellation reason is required");
      return;
    }

    try {
      setBusyAction(`cancel-${selectedAppointment.id}`);
      await staffCancelAppointment(
        selectedAppointment.id,
        cancelReason,
        cancelNote,
      );
      invalidateAppointmentsCache();
      closeAppointmentOverlays();
      await fetchAppointments(true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to cancel appointment"));
    } finally {
      setBusyAction(null);
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) {
      setError("Date and time are required for rescheduling");
      return;
    }

    try {
      setBusyAction(`reschedule-${selectedAppointment.id}`);
      await rescheduleAppointment(
        selectedAppointment.id,
        rescheduleDate,
        rescheduleTime,
      );
      invalidateAppointmentsCache();
      invalidateTimeSlotsCache(rescheduleDate);
      closeAppointmentOverlays();
      await Promise.all([fetchAppointments(true), fetchTimeSlots(rescheduleDate, true)]);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reschedule appointment"));
    } finally {
      setBusyAction(null);
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedAppointment || !selectedDoctor) {
      setError("Doctor selection is required");
      return;
    }

    try {
      setBusyAction(`assign-${selectedAppointment.id}`);
      await assignDoctorToAppointment(selectedAppointment.id, selectedDoctor);
      invalidateAppointmentsCache();
      invalidateDoctorsCache();
      closeAppointmentOverlays();
      await Promise.all([fetchAppointments(true), fetchDoctors(true)]);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to assign doctor"));
    } finally {
      setBusyAction(null);
    }
  };

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const today = new Date();

    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      const matchesSearch =
        query.length === 0 ||
        appointment.user.firstName.toLowerCase().includes(query) ||
        appointment.user.lastName.toLowerCase().includes(query) ||
        appointment.user.studentId?.toLowerCase().includes(query) ||
        appointment.user.email.toLowerCase().includes(query) ||
        appointment.service?.name?.toLowerCase().includes(query) ||
        appointment.reason.toLowerCase().includes(query);

      const matchesStatus =
        selectedStatus === "all" ||
        appointment.status.toLowerCase() === selectedStatus.toLowerCase();

      const matchesDate =
        selectedDate === "all" ||
        (selectedDate === "today" &&
          appointmentDate.toDateString() === today.toDateString()) ||
        (selectedDate === "upcoming" &&
          appointmentDate >= new Date(today.setHours(0, 0, 0, 0))) ||
        (selectedDate === "past" &&
          appointmentDate < new Date(new Date().setHours(0, 0, 0, 0)));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchQuery, selectedStatus, selectedDate]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / appointmentsPerPage),
  );
  const paginatedAppointments = useMemo(() => {
    return filteredAppointments.slice(
      (currentPage - 1) * appointmentsPerPage,
      currentPage * appointmentsPerPage,
    );
  }, [filteredAppointments, currentPage]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const left = getAppointmentTimestamp(a.date, a.timeSlot);
      const right = getAppointmentTimestamp(b.date, b.timeSlot);
      return left - right;
    });
  }, [appointments]);

  const today = new Date();
  const todayAppointments = appointments.filter((appointment) =>
    isSameDay(appointment.date, today),
  ).length;
  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status.toLowerCase() === "pending",
  ).length;
  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status.toLowerCase() === "confirmed",
  ).length;
  const unassignedAppointments = appointments.filter(
    (appointment) =>
      !appointment.doctor &&
      !["cancelled", "completed"].includes(appointment.status.toLowerCase()),
  ).length;
  const doctorAvailability = {
    available: doctors.filter((doctor) => doctor.doctorStatus === "AVAILABLE")
      .length,
    busy: doctors.filter((doctor) => doctor.doctorStatus === "BUSY").length,
    onLeave: doctors.filter((doctor) => doctor.doctorStatus === "ON_LEAVE")
      .length,
  };
  const slotOverview = {
    total: timeSlots.length,
    open: timeSlots.filter((slot) => slot.isAvailable).length,
    blocked: timeSlots.filter((slot) => !slot.isAvailable).length,
    nearlyFull: timeSlots.filter(
      (slot) =>
        slot.isAvailable &&
        slot.maxBookings > 0 &&
        slot.currentBookings / slot.maxBookings >= 0.75,
    ).length,
  };
  const nextAppointments = sortedAppointments
    .filter(
      (appointment) =>
        !["cancelled", "completed"].includes(appointment.status.toLowerCase()),
    )
    .slice(0, 4);
  const roleLabel = getStaffRoleLabel(userRole);
  const isSlotDateWeekend = (() => {
    const d = new Date(selectedSlotDate + "T00:00:00").getDay();
    return d === 0 || d === 6;
  })();

  if (!guardResolved) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <UGLogo size="md" />
            <LoadingSpinner size={48} />
            <p className="text-sm text-slate-500 font-medium">
              {guardRedirecting ? "Redirecting..." : "Verifying staff access..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaffNav userRole={userRole} />

        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="rounded-lg p-1 hover:bg-rose-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <section className="rounded-[28px] border border-[#C7D2FE] bg-gradient-to-r from-[#0F172A] via-[#1D4ED8] to-[#38BDF8] text-white p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-blue-100">
                <Sparkles className="w-3.5 h-3.5" />
                Appointment Operations Hub
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
                Design-led control for bookings, queues, and clinic slot
                availability.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-blue-50 max-w-2xl">
                Manage appointment flow, assign doctors faster, and keep booking
                capacity visible from one polished workspace.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-full sm:min-w-[360px] xl:max-w-md">
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-100">
                  Today&apos;s Visits
                </p>
                <p className="mt-2 text-3xl font-extrabold">
                  {todayAppointments}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-100">
                  Unassigned Queue
                </p>
                <p className="mt-2 text-3xl font-extrabold">
                  {unassignedAppointments}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-100">
                  Open Slots
                </p>
                <p className="mt-2 text-3xl font-extrabold">
                  {slotOverview.open}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-100">
                  Doctors Available
                </p>
                <p className="mt-2 text-3xl font-extrabold">
                  {doctorAvailability.available}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="inline-flex rounded-2xl bg-white/10 p-1 border border-white/15">
              <button
                type="button"
                onClick={() => setActiveTab("appointments")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "appointments"
                    ? "bg-white text-[#0F172A]"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Appointments Queue
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("timeslots")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "timeslots"
                    ? "bg-white text-[#0F172A]"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Slot Availability
              </button>
            </div>

            <button
              type="button"
              onClick={() => void handleRefreshAll()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-[#0F172A] text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Refresh Live Data
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Pending Review",
              value: pendingAppointments,
              note: "Needs triage or staff action",
              Icon: AlertTriangle,
              tint: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Confirmed",
              value: confirmedAppointments,
              note: "Ready for clinic flow",
              Icon: CheckCircle2,
              tint: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Doctor Coverage",
              value: doctorAvailability.available,
              note: `${doctorAvailability.busy} busy, ${doctorAvailability.onLeave} on leave`,
              Icon: Stethoscope,
              tint: "text-sky-600",
              bg: "bg-sky-50",
            },
            {
              label: "Slots Near Capacity",
              value: slotOverview.nearlyFull,
              note: `For ${formatDate(selectedSlotDate)}`,
              Icon: Layers3,
              tint: "text-violet-600",
              bg: "bg-violet-50",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-slate-950">
                    {card.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{card.note}</p>
                </div>
                <div className={`p-3 rounded-2xl ${card.bg} ${card.tint}`}>
                  <card.Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </section>

        {activeTab === "appointments" ? (
          <section className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Search queue
                    </label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Find by student, service, email, or reason..."
                        value={searchQuery}
                        onChange={(event) => {
                          setSearchQuery(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1D4ED8] focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:w-[340px]">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(event) => {
                          setSelectedStatus(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1D4ED8] focus:bg-white focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Date view
                      </label>
                      <select
                        value={selectedDate}
                        onChange={(event) => {
                          setSelectedDate(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1D4ED8] focus:bg-white focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="all">All dates</option>
                        <option value="today">Today</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Appointments queue
                    </h2>
                    <p className="text-sm text-slate-500">
                      {loading
                        ? "Loading appointments..."
                        : `${filteredAppointments.length} appointments match the current filters.`}
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-16">
                    <LoadingSpinner size={42} />
                  </div>
                ) : paginatedAppointments.length === 0 ? (
                  <div className="px-5 py-16 text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                      <CalendarClock className="w-6 h-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-950">
                      No appointments found
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Try widening the search or switching the date/status
                      filters.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {paginatedAppointments.map((appointment) => {
                      const appointmentStatus = statusMeta(appointment.status);
                      const doctorAvailable =
                        appointment.doctor?.doctorStatus === "AVAILABLE";

                      return (
                        <article
                          key={appointment.id}
                          className="px-5 py-5 hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${appointmentStatus.className}`}
                                >
                                  {appointmentStatus.label}
                                </span>
                                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600">
                                  {appointment.service?.name ||
                                    "General clinic visit"}
                                </span>
                                {!appointment.doctor && (
                                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                                    Needs doctor assignment
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr] gap-4">
                                <div>
                                  <p className="text-base font-bold text-slate-950">
                                    {appointment.user.firstName}{" "}
                                    {appointment.user.lastName}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {appointment.user.studentId ||
                                      "No student ID"}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {appointment.user.email}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                    Visit window
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-slate-900">
                                    {formatDate(appointment.date)}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {formatTimeLabel(appointment.timeSlot)}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                    Assigned doctor
                                  </p>
                                  {appointment.doctor ? (
                                    <>
                                      <p className="mt-2 text-sm font-semibold text-slate-900">
                                        Dr. {appointment.doctor.firstName}{" "}
                                        {appointment.doctor.lastName}
                                      </p>
                                      <p
                                        className={`text-sm ${doctorAvailable ? "text-emerald-600" : "text-amber-600"}`}
                                      >
                                        {appointment.doctor.doctorStatus ||
                                          "Status unavailable"}
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="mt-2 text-sm font-semibold text-slate-900">
                                        Unassigned
                                      </p>
                                      <p className="text-sm text-slate-500">
                                        Choose from available doctors
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                  Reason for visit
                                </p>
                                <p className="mt-2 text-sm text-slate-700">
                                  {appointment.reason}
                                </p>
                              </div>
                            </div>

                            <div className="xl:w-[180px] flex xl:flex-col gap-3">
                              <button
                                type="button"
                                onClick={() => openAppointment(appointment)}
                                className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#1D4ED8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1E40AF] transition-colors"
                              >
                                Manage booking
                              </button>
                              {appointment.status.toLowerCase() ===
                                "pending" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleUpdateStatus(
                                      appointment.id,
                                      "CONFIRMED",
                                    )
                                  }
                                  disabled={
                                    busyAction ===
                                    `appointment-${appointment.id}-CONFIRMED`
                                  }
                                  className="flex-1 inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60"
                                >
                                  Confirm now
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {!loading &&
                  filteredAppointments.length > appointmentsPerPage && (
                    <div className="px-5 py-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        Showing {(currentPage - 1) * appointmentsPerPage + 1}-
                        {Math.min(
                          currentPage * appointmentsPerPage,
                          filteredAppointments.length,
                        )}{" "}
                        of {filteredAppointments.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage((page) => Math.max(1, page - 1))
                          }
                          disabled={currentPage === 1}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage((page) =>
                              Math.min(totalPages, page + 1),
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      Next up
                    </h3>
                    <p className="text-sm text-slate-500">
                      Closest active bookings in the queue.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-700">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {nextAppointments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 text-center">
                      No active appointments scheduled.
                    </div>
                  ) : (
                    nextAppointments.map((appointment) => (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => openAppointment(appointment)}
                        className="w-full text-left rounded-2xl border border-slate-200 px-4 py-4 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-950">
                              {appointment.user.firstName}{" "}
                              {appointment.user.lastName}
                            </p>
                            <p className="text-sm text-slate-500">
                              {appointment.service?.name ||
                                "General clinic visit"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta(appointment.status).className}`}
                          >
                            {statusMeta(appointment.status).label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-700">
                          {formatDate(appointment.date)} at{" "}
                          {formatTimeLabel(appointment.timeSlot)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      Doctor readiness
                    </h3>
                    <p className="text-sm text-slate-500">
                      Availability snapshot for assignments.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {doctors.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 text-center">
                      No doctors available in the current list.
                    </div>
                  ) : (
                    doctors.slice(0, 6).map((doctor) => {
                      const tone =
                        doctor.doctorStatus === "AVAILABLE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : doctor.doctorStatus === "BUSY"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200";

                      return (
                        <div
                          key={doctor.id}
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-950">
                                Dr. {doctor.firstName} {doctor.lastName}
                              </p>
                              <p className="text-sm text-slate-500">
                                {doctor.email}
                              </p>
                            </div>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}
                            >
                              {doctor.doctorStatus.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-950">
                      Slot availability manager
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {doctors.filter((d) => d.doctorStatus === "AVAILABLE").length} Doctor(s) Available
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Dynamically expand slot capacities when doctors are free or scale down during emergencies for{" "}
                    {formatDate(selectedSlotDate)}.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Selected date
                    </label>
                    <input
                      type="date"
                      value={selectedSlotDate}
                      onChange={(event) =>
                        setSelectedSlotDate(event.target.value)
                      }
                      className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1D4ED8] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky AI Operations Sidebar Controller */}
            <StaffAiSidebar
              userRole={userRole}
              doctors={doctors}
              timeSlots={timeSlots}
              selectedDate={selectedSlotDate}
              onDataChanged={async () => {
                await Promise.all([fetchAppointments(), fetchTimeSlots(selectedSlotDate), fetchDoctors()]);
              }}
              summary={{
                todayAppointments,
                pendingAppointments,
                confirmedAppointments,
                totalDoctors: doctors.length,
              }}
            />

            {slotsLoading ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-16 shadow-sm flex justify-center">
                <LoadingSpinner size={42} />
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-16 shadow-sm text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950">
                  {isSlotDateWeekend ? "Clinic is closed on weekends" : "No slots generated for this day"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {isSlotDateWeekend
                    ? "The UG Clinic only operates Monday \u2013 Friday. Please select a weekday to manage booking slots."
                    : "Time slots will be auto-generated when you reload. If they still don\u2019t appear, ensure at least one service is active in the system."}
                </p>
                {!isSlotDateWeekend && (
                  <button
                    type="button"
                    onClick={() => void fetchTimeSlots(selectedSlotDate)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]/90 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate slots for this day
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Global Controls & Collapsible Overview Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-950">
                        ⚡ Clinical Sessions & Capacity Overview
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        {timeSlots.length} Windows ({formatDate(selectedSlotDate)})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Split session management for morning and afternoon clinic operational windows.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={batchUpdating}
                      onClick={() => void handleBatchSlots("OPEN")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock All</span>
                    </button>

                    <button
                      type="button"
                      disabled={batchUpdating}
                      onClick={() => void handleBatchSlots("CLOSE")}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock All</span>
                    </button>

                    <button
                      type="button"
                      disabled={batchUpdating}
                      onClick={() => void handleBatchSlots("SYNC_DOCTORS")}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Sync Doctors ({doctors.filter((d) => d.doctorStatus === "AVAILABLE").length})</span>
                    </button>

                    <button
                      type="button"
                      disabled={batchUpdating}
                      onClick={() => void handleBatchSlots("RESET")}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset 1/Slot</span>
                    </button>

                    {/* Collapse / Expand Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsOverviewCollapsed((prev) => !prev)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 ml-1"
                    >
                      <span>{isOverviewCollapsed ? "Expand Overview ▼" : "Collapse Overview ▲"}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsed Split Summary View */}
                {isOverviewCollapsed ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                      {/* Left: Morning Collapsed Tile */}
                      <div className="flex items-center justify-between pr-0 md:pr-6 pb-4 md:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-lg">
                            ☀️
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-950">Morning Session Overview</h4>
                            <p className="text-xs text-slate-500">
                              08:30 AM – 12:00 PM • {timeSlots.filter((s) => s.startTime < "12:00" && s.isAvailable).length} of {timeSlots.filter((s) => s.startTime < "12:00").length} Open
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          timeSlots.some((s) => s.startTime < "12:00" && s.isAvailable)
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {timeSlots.some((s) => s.startTime < "12:00" && s.isAvailable) ? "Open" : "Locked"}
                        </span>
                      </div>

                      {/* Right: Afternoon Collapsed Tile */}
                      <div className="flex items-center justify-between pl-0 md:pl-6 pt-4 md:pt-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-lg">
                            🌤️
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-950">Afternoon Session Overview</h4>
                            <p className="text-xs text-slate-500">
                              01:30 PM – 05:00 PM • {timeSlots.filter((s) => s.startTime >= "12:00" && s.isAvailable).length} of {timeSlots.filter((s) => s.startTime >= "12:00").length} Open
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          timeSlots.some((s) => s.startTime >= "12:00" && s.isAvailable)
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {timeSlots.some((s) => s.startTime >= "12:00" && s.isAvailable) ? "Open" : "Locked"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Expanded 2-Column Split: Morning on the Left, Afternoon on the Right */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* ══════════════════════════════════════════════════════════
                        LEFT COLUMN: MORNING SESSION OVERVIEW (08:30 AM – 12:00 PM)
                       ══════════════════════════════════════════════════════════ */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                      <div className="p-5 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-lg shadow-2xs">
                              ☀️
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-slate-950">Morning Overview</h3>
                              <p className="text-xs text-slate-500 font-semibold">08:30 AM – 12:00 PM Session</p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                              timeSlots.some((s) => s.startTime < "12:00" && s.isAvailable)
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {timeSlots.some((s) => s.startTime < "12:00" && s.isAvailable)
                              ? `Open (${timeSlots.filter((s) => s.startTime < "12:00" && s.isAvailable).length}/${timeSlots.filter((s) => s.startTime < "12:00").length})`
                              : "Locked"}
                          </span>
                        </div>

                        {/* Morning KPI Stats */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Total Windows</p>
                            <p className="text-base font-extrabold text-slate-900 mt-0.5">
                              {timeSlots.filter((s) => s.startTime < "12:00").length}
                            </p>
                          </div>
                          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Open Bookable</p>
                            <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                              {timeSlots.filter((s) => s.startTime < "12:00" && s.isAvailable).length}
                            </p>
                          </div>
                          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Avg Capacity</p>
                            <p className="text-base font-extrabold text-blue-600 mt-0.5">
                              {(() => {
                                const morning = timeSlots.filter((s) => s.startTime < "12:00");
                                if (!morning.length) return "1";
                                return Math.round(morning.reduce((sum, s) => sum + s.maxBookings, 0) / morning.length);
                              })()} / slot
                            </p>
                          </div>
                        </div>

                        {/* Morning Batch Action Buttons */}
                        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            disabled={batchUpdating}
                            onClick={() => void handleBatchSlots("OPEN", "MORNING")}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Unlock</span>
                          </button>
                          <button
                            type="button"
                            disabled={batchUpdating}
                            onClick={() => void handleBatchSlots("CLOSE", "MORNING")}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Lock</span>
                          </button>
                          <button
                            type="button"
                            disabled={batchUpdating}
                            onClick={() => void handleBatchSlots("EXPAND", "MORNING")}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+1 Cap</span>
                          </button>
                          <button
                            type="button"
                            disabled={batchUpdating}
                            onClick={() => void handleBatchSlots("REDUCE", "MORNING")}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Minus className="w-3 h-3" />
                            <span>-1 Cap</span>
                          </button>
                        </div>
                      </div>

                      {/* Morning Time Windows Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2.5">Time Window</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5">Bookings</th>
                              <th className="px-4 py-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {Array.from(
                              new Set(
                                timeSlots
                                  .filter((s) => s.startTime < "12:00")
                                  .map((s) => `${s.startTime}-${s.endTime}`)
                              )
                            )
                              .sort()
                              .map((timeKey) => {
                                const [startTime, endTime] = timeKey.split("-");
                                const matchingSlots = timeSlots.filter(
                                  (s) => s.startTime === startTime && s.endTime === endTime
                                );
                                const isAvailable = matchingSlots.some((s) => s.isAvailable);
                                const totalCap = matchingSlots.reduce((acc, s) => acc + s.maxBookings, 0);
                                const totalBooked = matchingSlots.reduce((acc, s) => acc + s.currentBookings, 0);

                                return (
                                  <tr key={timeKey} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-950">
                                      {formatTimeLabel(startTime)} – {formatTimeLabel(endTime)}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          isAvailable
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                        }`}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            isAvailable ? "bg-emerald-500" : "bg-rose-500"
                                          }`}
                                        ></span>
                                        {isAvailable ? "Open" : "Locked"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-600">
                                      {totalBooked}/{totalCap}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <button
                                        type="button"
                                        disabled={busyAction === timeKey}
                                        onClick={async () => {
                                          try {
                                            setBusyAction(timeKey);
                                            await Promise.all(
                                              matchingSlots.map((s) =>
                                                updateTimeSlotStatus(s.id, !isAvailable).catch(() => {})
                                              )
                                            );
                                            await fetchTimeSlots(selectedSlotDate);
                                          } finally {
                                            setBusyAction(null);
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                          isAvailable
                                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                        }`}
                                      >
                                        {isAvailable ? "Lock" : "Unlock"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════
                        RIGHT COLUMN: AFTERNOON SESSION OVERVIEW (01:30 PM – 05:00 PM)
                       ══════════════════════════════════════════════════════════ */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                      <div className="p-5 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-lg shadow-2xs">
                              🌤️
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-slate-950">Afternoon Overview</h3>
                              <p className="text-xs text-slate-500 font-semibold">01:30 PM – 05:00 PM Session</p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                              timeSlots.some((s) => s.startTime >= "12:00" && s.isAvailable)
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {timeSlots.some((s) => s.startTime >= "12:00" && s.isAvailable)
                              ? `Open (${timeSlots.filter((s) => s.startTime >= "12:00" && s.isAvailable).length}/${timeSlots.filter((s) => s.startTime >= "12:00").length})`
                              : "Locked"}
                          </span>
                        </div>

                        {/* Afternoon KPI Stats */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Total Windows</p>
                            <p className="text-base font-extrabold text-slate-900 mt-0.5">
                              {timeSlots.filter((s) => s.startTime >= "12:00").length}
                            </p>
                          </div>
                          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Open Bookable</p>
                            <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                              {timeSlots.filter((s) => s.startTime >= "12:00" && s.isAvailable).length}
                            </p>
                          </div>
                          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Avg Capacity</p>
                            <p className="text-base font-extrabold text-blue-600 mt-0.5">
                              {(() => {
                                const afternoon = timeSlots.filter((s) => s.startTime >= "12:00");
                                if (!afternoon.length) return "1";
                                return Math.round(afternoon.reduce((sum, s) => sum + s.maxBookings, 0) / afternoon.length);
                              })()} / slot
                            </p>
                          </div>
                        </div>

                        {/* Afternoon Batch Action Buttons */}
                        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            disabled={batchUpdating}
                            onClick={() => void handleBatchSlots("OPEN", "AFTERNOON")}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Unlock</span>
                          </button>
                          <button
                            type="button"
                            disabled={batchUpdating}
                            onClick={() => void handleBatchSlots("CLOSE", "AFTERNOON")}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Lock</span>
                          </button>
                          <button
                            type="button"
                            disabled={batchUpdating}
                            onClick={() => void handleBatchSlots("EXPAND", "AFTERNOON")}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+1 Cap</span>
                          </button>
                          <button
                            type="button"
                            disabled={batchUpdating}
                            onClick={() => void handleBatchSlots("REDUCE", "AFTERNOON")}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Minus className="w-3 h-3" />
                            <span>-1 Cap</span>
                          </button>
                        </div>
                      </div>

                      {/* Afternoon Time Windows Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2.5">Time Window</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5">Bookings</th>
                              <th className="px-4 py-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {Array.from(
                              new Set(
                                timeSlots
                                  .filter((s) => s.startTime >= "12:00")
                                  .map((s) => `${s.startTime}-${s.endTime}`)
                              )
                            )
                              .sort()
                              .map((timeKey) => {
                                const [startTime, endTime] = timeKey.split("-");
                                const matchingSlots = timeSlots.filter(
                                  (s) => s.startTime === startTime && s.endTime === endTime
                                );
                                const isAvailable = matchingSlots.some((s) => s.isAvailable);
                                const totalCap = matchingSlots.reduce((acc, s) => acc + s.maxBookings, 0);
                                const totalBooked = matchingSlots.reduce((acc, s) => acc + s.currentBookings, 0);

                                return (
                                  <tr key={timeKey} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-950">
                                      {formatTimeLabel(startTime)} – {formatTimeLabel(endTime)}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          isAvailable
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                        }`}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            isAvailable ? "bg-emerald-500" : "bg-rose-500"
                                          }`}
                                        ></span>
                                        {isAvailable ? "Open" : "Locked"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-600">
                                      {totalBooked}/{totalCap}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <button
                                        type="button"
                                        disabled={busyAction === timeKey}
                                        onClick={async () => {
                                          try {
                                            setBusyAction(timeKey);
                                            await Promise.all(
                                              matchingSlots.map((s) =>
                                                updateTimeSlotStatus(s.id, !isAvailable).catch(() => {})
                                              )
                                            );
                                            await fetchTimeSlots(selectedSlotDate);
                                          } finally {
                                            setBusyAction(null);
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                          isAvailable
                                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                        }`}
                                      >
                                        {isAvailable ? "Lock" : "Unlock"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[28px] shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Booking control panel
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-slate-950">
                  {selectedAppointment.user.firstName}{" "}
                  {selectedAppointment.user.lastName}
                </h3>
                <p className="text-sm text-slate-500">
                  {formatDate(selectedAppointment.date)} at{" "}
                  {formatTimeLabel(selectedAppointment.timeSlot)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAppointmentOverlays}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta(selectedAppointment.status).className}`}
                >
                  {statusMeta(selectedAppointment.status).label}
                </span>
                <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600">
                  {selectedAppointment.service?.name || "General clinic visit"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Student profile
                  </p>
                  <p className="mt-3 text-base font-bold text-slate-950">
                    {selectedAppointment.user.firstName}{" "}
                    {selectedAppointment.user.lastName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedAppointment.user.studentId || "No student ID"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedAppointment.user.email}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Assigned doctor
                  </p>
                  {selectedAppointment.doctor ? (
                    <>
                      <p className="mt-3 text-base font-bold text-slate-950">
                        Dr. {selectedAppointment.doctor.firstName}{" "}
                        {selectedAppointment.doctor.lastName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedAppointment.doctor.doctorStatus ||
                          "Status unavailable"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-base font-bold text-slate-950">
                        Unassigned
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Use the assignment action below.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Reason for visit
                </p>
                <p className="mt-3 text-sm text-slate-700">
                  {selectedAppointment.reason}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedAppointment.status.toLowerCase() === "pending" && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleUpdateStatus(
                        selectedAppointment.id,
                        "CONFIRMED",
                      )
                    }
                    disabled={
                      busyAction ===
                      `appointment-${selectedAppointment.id}-CONFIRMED`
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Confirm appointment
                  </button>
                )}

                {selectedAppointment.status.toLowerCase() === "confirmed" && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleUpdateStatus(
                        selectedAppointment.id,
                        "COMPLETED",
                      )
                    }
                    disabled={
                      busyAction ===
                      `appointment-${selectedAppointment.id}-COMPLETED`
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    Mark as completed
                  </button>
                )}

                {!["cancelled", "completed"].includes(
                  selectedAppointment.status.toLowerCase(),
                ) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(true)}
                      className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      Assign doctor
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRescheduleModal(true)}
                      className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 sm:col-span-2"
                    >
                      Cancel appointment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[28px] shadow-2xl max-w-lg w-full border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Doctor assignment
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-slate-950">
                  Match this appointment to a doctor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Available doctor list
              </label>
              <select
                value={selectedDoctor}
                onChange={(event) => setSelectedDoctor(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
              >
                <option value="">Choose a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName} (
                    {doctor.doctorStatus.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 space-y-2 max-h-52 overflow-auto pr-1">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{doctor.email}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        doctor.doctorStatus === "AVAILABLE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : doctor.doctorStatus === "BUSY"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {doctor.doctorStatus.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAssignDoctor()}
                disabled={busyAction === `assign-${selectedAppointment.id}`}
                className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                Confirm assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[28px] shadow-2xl max-w-lg w-full border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Cancellation
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-slate-950">
                  Cancel appointment with a clear reason
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Reason
                </label>
                <select
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-100"
                >
                  <option value="">Select a reason</option>
                  <option value="Doctor Emergency">Doctor Emergency</option>
                  <option value="Student Request">Student Request</option>
                  <option value="Clinic Maintenance">Clinic Maintenance</option>
                  <option value="Schedule Conflict">Schedule Conflict</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Optional note
                </label>
                <textarea
                  value={cancelNote}
                  onChange={(event) => setCancelNote(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-100"
                  placeholder="Add context for the student or clinic team..."
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={() => void handleStaffCancel()}
                disabled={busyAction === `cancel-${selectedAppointment.id}`}
                className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Confirm cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[28px] shadow-2xl max-w-lg w-full border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Reschedule
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-slate-950">
                  Move this booking to a new slot
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  New date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(event) => setRescheduleDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  New time
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(event) => setRescheduleTime(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReschedule()}
                disabled={busyAction === `reschedule-${selectedAppointment.id}`}
                className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                Confirm reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
