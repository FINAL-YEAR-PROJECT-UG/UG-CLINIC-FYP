'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { InactivityWarning } from '@/components/shared/InactivityWarning';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import UGLogo from '@/components/shared/UGLogo';
import StaffNav from '@/components/shared/StaffNav';
import { getErrorMessage, normalizeRole, isStaffRole, canManageClinicOperations, isDoctorRole, formatTimeLabel } from '@/lib/utils';
import {
  getStaffDashboard,
  getDoctors,
  updateDoctorStatus,
  batchUpdateDoctorStatuses,
  autoAssignDoctors,
  autoConfirmPending,
  type StaffDoctor,
} from '@/lib/staffApi';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  FileText,
  Settings,
  Activity,
  UserCheck,
  Stethoscope,
  TrendingUp,
  Bot,
  Sparkles,
  Wand2,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface DailyTrend {
  date: string;
  dayName: string;
  count: number;
}

interface StaffOverviewData {
  summary: {
    totalAppointments: number;
    todayAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalStudents: number;
    totalDoctors?: number;
    totalServices?: number;
  };
  recentAppointments: Array<{
    id: string;
    date: string;
    timeSlot: string;
    status: string;
    reason: string;
    user: { firstName: string; lastName: string; studentId?: string; email: string };
    service?: { name: string };
  }>;
  dailyTrends?: DailyTrend[];
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-600' },
  NO_SHOW: { label: 'No show', className: 'bg-red-100 text-red-600' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  RESCHEDULED: { label: 'Rescheduled', className: 'bg-blue-100 text-blue-700' },
};

function getStaffRoleLabel(role: string) {
  switch ((role ?? '').toUpperCase()) {
    case 'DOCTOR': return 'Doctor';
    case 'RECEPTIONIST': return 'Receptionist';
    case 'ADMIN': return 'Administrator';
    default: return 'Staff';
  }
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function StaffOverviewPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const storeIsAuth = useAuthStore((s) => s.isAuthenticated);
  const storeUser = useAuthStore((s) => s.user);

  // Inactivity timeout hook
  const { showWarning, timeRemaining, handleStayLoggedIn, handleLogout: handleInactivityLogout } = useInactivityTimeout({
    warningMinutes: 10,
    logoutMinutes: 2,
    enabled: storeIsAuth,
  });

  const initialSnap = useAuthStore.getState();
  const initialUser = initialSnap.user ?? storeUser;
  const initialIsAuth = initialSnap.isAuthenticated || storeIsAuth;
  const initialRole = normalizeRole(initialUser?.role);
  const initialIsStaff = initialIsAuth && isStaffRole(initialRole);

  // Guard state
  const [guardResolved, setGuardResolved] = useState(() => initialIsStaff);
  const [guardRedirecting, setGuardRedirecting] = useState(false);
  const [userRole, setUserRole] = useState<string>(() => initialRole);
  const [userId, setUserId] = useState<string>(() => initialUser?.id || '');
  const [userEmail, setUserEmail] = useState<string>(() => initialUser?.email || '');
  const [firstName, setFirstName] = useState<string>(() => initialUser?.firstName || 'Staff');
  const [lastName, setLastName] = useState<string>(() => initialUser?.lastName || '');

  // Data state
  const [staffData, setStaffData] = useState<StaffOverviewData | null>(null);
  const [doctors, setDoctors] = useState<StaffDoctor[]>([]);
  const [myDoctorStatus, setMyDoctorStatus] = useState<'AVAILABLE' | 'BUSY' | 'ON_LEAVE'>('AVAILABLE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [automationMessage, setAutomationMessage] = useState<string | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);

  // ——— Guard: synchronous + early redirect ———
  useEffect(() => {
    let active = true;
    let t: ReturnType<typeof setTimeout> | null = null;

    const runGuard = () => {
      const snapshot = useAuthStore.getState();
      const isAuth = snapshot.isAuthenticated || storeIsAuth;
      const u = snapshot.user ?? storeUser;
      const role = normalizeRole(u?.role);
      const isStaff = isStaffRole(role);

      if (!isAuth || !u || !isStaff) {
        setGuardRedirecting(true);
        const target = !isAuth ? '/staff-portal-access' : '/dashboard';
        t = setTimeout(() => { if (active) router.replace(target); }, 0);
        return;
      }

      setUserRole(role);
      setUserId(u.id);
      setUserEmail(u.email);
      setFirstName(u.firstName || 'Staff');
      setLastName(u.lastName || '');
      setGuardResolved(true);
    };

    runGuard();
    return () => { active = false; if (t) clearTimeout(t); };
  }, [router, storeIsAuth, storeUser]);

  // ——— Loaders ———
  const fetchStaffOverview = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStaffDashboard();
      setStaffData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load staff overview'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDoctorsList = useCallback(async () => {
    try {
      const data = await getDoctors();
      const list = Array.isArray(data?.doctors) ? data.doctors : [];
      setDoctors(list);
      const me = list.find((d) => d.id === userId || d.email === userEmail);
      if (me) setMyDoctorStatus(me.doctorStatus);
    } catch (err) {
      console.error('Failed to load doctors availability:', err);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    if (!guardResolved) return;
    fetchStaffOverview();
    fetchDoctorsList();
  }, [guardResolved, fetchStaffOverview, fetchDoctorsList]);

  // ——— Actions ———
  const handleStatusChange = async (newStatus: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE', targetDoctorId?: string) => {
    try {
      setStatusUpdating(true);
      await updateDoctorStatus(newStatus, targetDoctorId);
      const isMe = !targetDoctorId || targetDoctorId === userId;
      if (isMe) setMyDoctorStatus(newStatus);
      await fetchDoctorsList();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update doctor status'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login?role=staff');
    } catch (err) {
      console.error('Logout failed:', err);
      router.replace('/staff-portal-access');
    }
  };

  const handleAutoAssign = async () => {
    try {
      setAutoLoading(true);
      setAutomationMessage(null);
      const res = await autoAssignDoctors();
      setAutomationMessage(res.message);
      await Promise.all([fetchStaffOverview(), fetchDoctorsList()]);
    } catch (err) {
      setError(getErrorMessage(err, 'Automated doctor assignment failed'));
    } finally {
      setAutoLoading(false);
    }
  };

  const handleAutoConfirm = async () => {
    try {
      setAutoLoading(true);
      setAutomationMessage(null);
      const res = await autoConfirmPending();
      setAutomationMessage(res.message);
      await fetchStaffOverview();
    } catch (err) {
      setError(getErrorMessage(err, 'Batch auto-confirmation failed'));
    } finally {
      setAutoLoading(false);
    }
  };

  // Autonomous Overview Agent State & Handlers
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentLog, setAgentLog] = useState<Array<{ role: 'user' | 'agent'; text: string; time: string }>>([
    {
      role: 'agent',
      text: 'Greetings! I am UG-OverviewAgent. I track doctor availability and workload analytics. Ask me to auto-assign pending visits, manage doctor statuses, or balance patient queues.',
      time: 'Just now',
    },
  ]);

  const handleBatchDoctorStatus = async (status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE', doctorIds?: string[]) => {
    try {
      setStatusUpdating(true);
      const res = await batchUpdateDoctorStatuses(status, doctorIds);
      setAutomationMessage(`✨ ${res.message}`);
      await fetchDoctorsList();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to batch update doctor statuses'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleRunOverviewAgentCommand = async (inputQuery?: string) => {
    const query = (inputQuery || agentPrompt).trim();
    if (!query) return;
    setAgentPrompt('');
    setAgentRunning(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAgentLog((prev) => [...prev, { role: 'user', text: query, time: nowTime }]);

    try {
      const lower = query.toLowerCase();
      let actionTaken = '';

      if (lower.includes('assign') || lower.includes('balance') || lower.includes('workload')) {
        const res = await autoAssignDoctors();
        actionTaken = res.message;
        await Promise.all([fetchStaffOverview(), fetchDoctorsList()]);
      } else if (lower.includes('confirm') || lower.includes('pending')) {
        const res = await autoConfirmPending();
        actionTaken = res.message;
        await fetchStaffOverview();
      } else if (lower.includes('all available') || lower.includes('activate roster') || lower.includes('free doctors')) {
        const res = await batchUpdateDoctorStatuses('AVAILABLE');
        actionTaken = res.message;
        await fetchDoctorsList();
      } else if (lower.includes('busy') || lower.includes('emergency') || lower.includes('lock')) {
        const res = await batchUpdateDoctorStatuses('BUSY');
        actionTaken = res.message;
        await fetchDoctorsList();
      } else {
        const res = await autoAssignDoctors();
        actionTaken = `Analyzed workload: ${res.message}`;
        await Promise.all([fetchStaffOverview(), fetchDoctorsList()]);
      }

      setAgentLog((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `🤖 Autonomous Action Complete: ${actionTaken}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setAgentLog((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `⚠️ Agent execution error: ${getErrorMessage(err, 'Failed to process command')}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setAgentRunning(false);
    }
  };

  // ——— Loading shell ———
  if (!guardResolved) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <UGLogo size="md" />
          <LoadingSpinner size={48} />
          <p className="text-sm text-gray-500 font-medium">
            {guardRedirecting ? 'Redirecting…' : 'Verifying staff access…'}
          </p>
        </div>
      </div>
    );
  }

  const summary = staffData?.summary ?? {
    totalAppointments: 0, todayAppointments: 0, pendingAppointments: 0,
    confirmedAppointments: 0, completedAppointments: 0, cancelledAppointments: 0,
    totalStudents: 0, totalDoctors: 0,
  };
  const recentAppointments = staffData?.recentAppointments ?? [];
  const dailyTrends = staffData?.dailyTrends ?? [
    { date: '2026-07-15', dayName: 'Mon', count: 4 },
    { date: '2026-07-16', dayName: 'Tue', count: 7 },
    { date: '2026-07-17', dayName: 'Wed', count: 5 },
    { date: '2026-07-18', dayName: 'Thu', count: 9 },
    { date: '2026-07-19', dayName: 'Fri', count: 12 },
    { date: '2026-07-20', dayName: 'Sat', count: 3 },
    { date: '2026-07-21', dayName: 'Sun', count: 6 },
  ];
  const maxTrend = Math.max(...dailyTrends.map((t) => t.count), 1);
  const roleLabel = getStaffRoleLabel(userRole);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <UGLogo size="md" href="/staff/overview" />
              <span className="text-xs font-extrabold uppercase px-2.5 py-1 bg-[#1e3a8a] text-white rounded-md">
                {roleLabel} Portal
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                ← Public Site
              </Link>
              <div className="flex items-center gap-3 border-l pl-4 border-[#E2E8F0]">
                <div className="w-8 h-8 bg-[#E8ECF1] rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-[#1e3a8a]">{firstName?.[0] || 'S'}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-[#020617]">{firstName} {lastName}</p>
                  <p className="text-xs text-[#334155]">{roleLabel}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#334155] hover:bg-[#E8ECF1] rounded-lg transition-colors border border-[#E2E8F0]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaffNav userRole={userRole} />

        {automationMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
            <span>✨ {automationMessage}</span>
            <button onClick={() => setAutomationMessage(null)} aria-label="Dismiss">✕</button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {(userRole === 'ADMIN' || userRole === 'RECEPTIONIST') && (
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl mb-8 border border-blue-500/30 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">UG-OverviewAgent</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Doctor Workload & Operations AI
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Live Analytics: {doctors.filter((d) => d.doctorStatus === 'AVAILABLE').length}/{doctors.length} Doctor(s) Available • Workload Index: {((summary.pendingAppointments + summary.confirmedAppointments) / Math.max(1, doctors.filter((d) => d.doctorStatus === 'AVAILABLE').length)).toFixed(1)} apts/doc
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => void handleRunOverviewAgentCommand('Auto assign available doctors')}
                  disabled={agentRunning || autoLoading}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Auto-Assign Doctors
                </button>
                <button
                  type="button"
                  onClick={() => void handleRunOverviewAgentCommand('Batch confirm pending bookings')}
                  disabled={agentRunning || autoLoading}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Batch Auto-Confirm
                </button>
                <button
                  type="button"
                  onClick={() => void handleBatchDoctorStatus('AVAILABLE')}
                  disabled={statusUpdating}
                  className="px-3 py-2 bg-emerald-500/20 border border-emerald-400/30 hover:bg-emerald-500/30 text-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  🟢 Set All AVAILABLE
                </button>
              </div>
            </div>

            <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 max-h-28 overflow-y-auto space-y-1.5 text-xs">
              {agentLog.slice(-3).map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 ${
                    item.role === 'agent' ? 'text-blue-200' : 'text-amber-200 font-semibold'
                  }`}
                >
                  <span className="text-[10px] text-slate-500 shrink-0">{item.time}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleRunOverviewAgentCommand();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask UG-OverviewAgent (e.g. 'auto-assign doctors', 'set all doctors to AVAILABLE', 'confirm pending visits')..."
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={agentRunning || !agentPrompt.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{agentRunning ? 'Running...' : 'Execute'}</span>
              </button>
            </form>
          </div>
        )}

        <div className="bg-gradient-to-r from-[#0F172A] to-[#0369A1] text-white rounded-2xl p-6 shadow-md mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-200 font-semibold">UG Clinic Admin & Receptionist Portal</p>
              <h2 className="text-2xl font-extrabold mt-1">Welcome back, {firstName}!</h2>
              <p className="mt-1 text-sm text-blue-100 max-w-xl">
                Graphically view appointment trends, manage doctor busy/free availability, and assign student appointments to doctors.
              </p>
            </div>
            {userRole === 'DOCTOR' && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex flex-col gap-2 min-w-[260px]">
                <p className="text-xs font-semibold text-blue-100">Your Live Availability Status:</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleStatusChange('AVAILABLE')} disabled={statusUpdating}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                      myDoctorStatus === 'AVAILABLE' ? 'bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-300' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}>🟢 Available (Free)</button>
                  <button onClick={() => handleStatusChange('BUSY')} disabled={statusUpdating}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                      myDoctorStatus === 'BUSY' ? 'bg-amber-500 text-white shadow-lg ring-2 ring-amber-300' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}>🔴 Busy</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mb-8">
          {[
            { label: "Today's Visits", value: summary.todayAppointments, Icon: Calendar, tint: 'text-[#1e3a8a]', bg: 'bg-[#E8ECF1]' },
            { label: 'Confirmed', value: summary.confirmedAppointments, Icon: CheckCircle2, tint: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pending', value: summary.pendingAppointments, Icon: Clock, tint: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Cancelled', value: summary.cancelledAppointments, Icon: XCircle, tint: 'text-red-600', bg: 'bg-red-50' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 ${card.bg} ${card.tint} rounded-xl`}>
                  <card.Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#334155]">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[#020617]">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#020617] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#0369A1]" /> Appointment Volume Trend (Past 7 Days)
                  </h3>
                  <p className="text-xs text-[#334155]">Visual activity breakdown of booking flow</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-[#E8ECF1] text-[#0369A1] rounded-md">Live Analytics</span>
              </div>
              <div className="h-56 mt-6 flex items-end justify-between gap-3 pt-6 border-b border-[#E2E8F0] pb-2">
                {dailyTrends.map((t, idx) => {
                  const h = Math.max(12, Math.round((t.count / maxTrend) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-xs font-bold text-[#020617] group-hover:text-[#1e3a8a] transition-colors">{t.count}</span>
                      <div className="w-full bg-[#E8ECF1] rounded-t-lg overflow-hidden h-40 flex items-end">
                        <div style={{ height: `${h}%` }} className="w-full bg-gradient-to-t from-[#0F172A] to-[#0369A1] rounded-t-lg group-hover:from-[#0369A1] group-hover:to-[#0F172A] transition-all duration-500" />
                      </div>
                      <span className="text-xs font-medium text-[#334155]">{t.dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-[#334155]">
              <span>Peak Day: {dailyTrends.reduce((max, t) => (t.count > max.count ? t : max), dailyTrends[0]).dayName}</span>
              <span>Total Volume: {dailyTrends.reduce((s, t) => s + t.count, 0)} visits</span>
            </div>
          </div>

          {canManageClinicOperations(userRole) && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-bold text-[#020617] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" /> Doctor Roster & Status
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void handleBatchDoctorStatus('AVAILABLE')}
                    disabled={statusUpdating}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-200 transition-colors"
                  >
                    All Free
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBatchDoctorStatus('BUSY')}
                    disabled={statusUpdating}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold rounded-lg border border-amber-200 transition-colors"
                  >
                    All Busy
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#334155] mb-4">
                Manage doctor availability status. Changing status auto-syncs booking slot capacity.
              </p>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {doctors.length === 0 ? (
                  <p className="text-xs text-[#334155] text-center py-6">No doctors registered yet.</p>
                ) : (
                  doctors.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#E8ECF1] transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-[#020617]">Dr. {doc.firstName} {doc.lastName}</p>
                        <p className="text-xs text-[#334155]">{doc._count?.doctorAppointments ?? 0} active booking(s)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                          doc.doctorStatus === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                          doc.doctorStatus === 'BUSY' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {doc.doctorStatus === 'AVAILABLE' ? '🟢 Available' : doc.doctorStatus === 'BUSY' ? '🔴 Busy' : '⚪ On Leave'}
                        </span>
                        {(userRole === 'ADMIN' || userRole === 'RECEPTIONIST') && (
                          <select value={doc.doctorStatus} onChange={(e) => handleStatusChange(e.target.value as any, doc.id)}
                            className="text-xs border border-[#E2E8F0] rounded px-1 py-0.5">
                            <option value="AVAILABLE">Free</option>
                            <option value="BUSY">Busy</option>
                            <option value="ON_LEAVE">Leave</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <Link href="/staff/appointments"
                className="w-full block text-center py-2 bg-[#E8ECF1] text-[#0369A1] hover:bg-[#E2E8F0] font-semibold text-xs rounded-lg transition-colors">
                Assign Doctors & Manage Time Slots →
              </Link>
            </div>
          </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#020617]">Recent Appointments</h3>
              <p className="text-sm text-[#334155]">Latest scheduled visits for your clinic.</p>
            </div>
            <Link href="/staff/appointments" className="text-sm text-[#1e3a8a] hover:text-[#3b82f6] font-medium">
              View all →
            </Link>
          </div>
          {recentAppointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center text-[#334155]">
              No recent appointments available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#020617]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wide text-[#334155]">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC]">
                      <td className="px-4 py-4">{formatShortDate(apt.date)}</td>
                      <td className="px-4 py-4">{formatTimeLabel(apt.timeSlot)}</td>
                      <td className="px-4 py-4">
                        {apt.user.firstName} {apt.user.lastName}
                        <div className="text-xs text-[#334155]">{apt.user.studentId || apt.user.email}</div>
                      </td>
                      <td className="px-4 py-4">{apt.service?.name || apt.reason}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full text-[11px] font-medium px-2.5 py-1 ${STATUS_STYLES[apt.status]?.className ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_STYLES[apt.status]?.label ?? apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Inactivity Warning Modal */}
      <InactivityWarning
        show={showWarning}
        timeRemaining={timeRemaining}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleInactivityLogout}
      />
    </div>
  );
}
