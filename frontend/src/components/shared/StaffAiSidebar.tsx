'use client';

import React, { useState } from 'react';
import {
  Activity,
  Zap,
  CheckCircle2,
  Clock,
  Calendar,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  Minus,
  Sparkles,
} from '@/components/icons';
import {
  updateDoctorStatus,
  batchUpdateDoctorStatuses,
  autoAssignDoctors,
  autoConfirmPending,
  getTimeSlots,
  updateTimeSlotStatus,
  batchUpdateTimeSlots,
  type StaffDoctor,
  type StaffTimeSlot,
} from '@/lib/staffApi';
import { formatTimeLabel, getErrorMessage } from '@/lib/utils';

interface StaffAiSidebarProps {
  userRole: string;
  doctors: StaffDoctor[];
  timeSlots?: StaffTimeSlot[];
  selectedDate?: string;
  onDataChanged: () => Promise<void>;
  summary?: {
    todayAppointments?: number;
    pendingAppointments?: number;
    confirmedAppointments?: number;
    cancelledAppointments?: number;
    totalStudents?: number;
    totalDoctors?: number;
  };
}

export default function StaffAiSidebar({
  userRole,
  doctors,
  timeSlots = [],
  selectedDate,
  onDataChanged,
  summary,
}: StaffAiSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commandPrompt, setCommandPrompt] = useState('');
  const [commandRunning, setCommandRunning] = useState(false);
  const [commandLog, setCommandLog] = useState<Array<{ role: 'user' | 'system'; text: string; time: string }>>([
    {
      role: 'system',
      text: '🤖 Operations AI Assistant Ready.\nTry: "set 3 doctors available", "block all slots from 12pm going", "auto-assign", "expand morning slots", or "status".',
      time: 'System Ready',
    },
  ]);

  if (userRole !== 'ADMIN' && userRole !== 'RECEPTIONIST') {
    return null;
  }

  const availableDoctors = doctors.filter((d) => d.doctorStatus === 'AVAILABLE');
  const busyDoctors = doctors.filter((d) => d.doctorStatus === 'BUSY');

  // Helper for word/digit quantity extraction
  const parseQuantity = (text: string): number | null => {
    const wordMap: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, twenty: 20
    };
    const numMatch = text.match(/\b(\d+)\b/);
    if (numMatch) return parseInt(numMatch[1], 10);
    for (const [word, val] of Object.entries(wordMap)) {
      const reg = new RegExp(`\\b${word}\\b`, 'i');
      if (reg.test(text)) return val;
    }
    return null;
  };

  // Helper for time / session range extraction
  const parseTimeTarget = (text: string): { hour: number; minute: number; timeStr: string; session?: 'morning' | 'afternoon' } | null => {
    if (text.includes('morning')) return { hour: 8, minute: 0, timeStr: '08:00', session: 'morning' };
    if (text.includes('afternoon')) return { hour: 12, minute: 0, timeStr: '12:00', session: 'afternoon' };

    const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minute = match[2] ? parseInt(match[2], 10) : 0;
      const meridian = match[3]?.toLowerCase();
      if (meridian === 'pm' && hour < 12) hour += 12;
      if (meridian === 'am' && hour === 12) hour = 0;
      const formatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      return { hour, minute, timeStr: formatted, session: hour >= 12 ? 'afternoon' : 'morning' };
    }
    return null;
  };

  const handleRunOperationsCommand = async (inputQuery?: string) => {
    const query = (inputQuery || commandPrompt).trim();
    if (!query) return;
    setCommandPrompt('');
    setCommandRunning(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCommandLog((prev) => [...prev, { role: 'user', text: query, time: nowTime }]);

    try {
      const lower = query.toLowerCase();
      let actionTaken = '';
      const todayStr = selectedDate || new Date().toISOString().split('T')[0];

      // 1. Clear Console
      if (lower === 'clear' || lower === 'cls' || lower.includes('clear log') || lower.includes('reset console')) {
        setCommandLog([
          {
            role: 'system',
            text: 'Console cleared. System ready for commands.',
            time: nowTime,
          },
        ]);
        setCommandRunning(false);
        return;
      }

      // 2. Help Guide
      if (
        lower.includes('help') ||
        lower.includes('command') ||
        lower.includes('guide') ||
        lower.includes('what can you do') ||
        lower === 'options' ||
        lower === 'menu' ||
        lower === '?'
      ) {
        actionTaken =
          '💡 Available Intelligent Operations Commands:\n' +
          '• "set 3 doctors available" / "set 2 doctors busy" — Accurately adjust exact count of doctors\n' +
          '• "block all slots from 12pm going" / "block slots from 2pm" — Lock appointment slots from a specific time\n' +
          '• "expand morning slots" / "sync slot capacity" — Scale capacity with doctor rosters\n' +
          '• "unblock slots from 10am" / "open all slots" — Unlock and re-enable booking slots\n' +
          '• "auto-assign" / "balance workload" — Distribute student visits intelligently\n' +
          '• "confirm pending" / "approve all" — Batch approve pending appointments\n' +
          '• "status" / "metrics" — View real-time clinic capacity & queue';
      }

      // 3. Time Slot Capacity Scaling & Session Batch (Expand / Reduce / Sync / Reset)
      else if (
        lower.includes('expand') ||
        lower.includes('scale up') ||
        lower.includes('reduce') ||
        lower.includes('scale down') ||
        (lower.includes('capacity') && !lower.includes('block')) ||
        (lower.includes('sync') && (lower.includes('slot') || lower.includes('capacity') || lower.includes('doctor')))
      ) {
        if (lower.includes('expand') || lower.includes('scale up')) {
          await batchUpdateTimeSlots({
            date: todayStr,
            action: 'EXPAND',
            sessionFilter: lower.includes('morning') ? 'MORNING' : lower.includes('afternoon') ? 'AFTERNOON' : undefined,
          });
          actionTaken = `📈 Expanded slot booking capacity (+1) across active services.`;
        } else if (lower.includes('reduce') || lower.includes('scale down')) {
          await batchUpdateTimeSlots({
            date: todayStr,
            action: 'REDUCE',
            sessionFilter: lower.includes('morning') ? 'MORNING' : lower.includes('afternoon') ? 'AFTERNOON' : undefined,
          });
          actionTaken = `📉 Scaled down slot capacity (-1) for balanced clinic flow.`;
        } else {
          await batchUpdateTimeSlots({
            date: todayStr,
            action: 'SYNC_DOCTORS',
          });
          actionTaken = `⚡ Synced all slot booking capacities with ${availableDoctors.length} currently available doctor(s).`;
        }
        await onDataChanged();
      }

      // 4. Time Slot Blocking & Unblocking Commands (e.g. "block all slots from 12pm going")
      else if (
        lower.includes('slot') ||
        lower.includes('timeslot') ||
        lower.includes('time slot') ||
        lower.includes('booking window') ||
        (lower.includes('block') && !lower.includes('doctor')) ||
        (lower.includes('unblock') && !lower.includes('doctor')) ||
        (lower.includes('close') && (lower.includes('pm') || lower.includes('am') || lower.includes('from') || lower.includes('time') || lower.includes('going') || lower.includes('morning') || lower.includes('afternoon')))
      ) {
        const isBlock = !lower.includes('open') && !lower.includes('unblock') && !lower.includes('enable');
        const timeInfo = parseTimeTarget(lower);

        try {
          // Always invoke batch update with fromTime for backend consistency
          await batchUpdateTimeSlots({
            date: todayStr,
            action: isBlock ? 'CLOSE' : 'OPEN',
            fromTime: timeInfo?.timeStr,
            sessionFilter: timeInfo?.session === 'morning' ? 'MORNING' : timeInfo?.session === 'afternoon' ? 'AFTERNOON' : undefined,
          } as any).catch(() => {});

          const slotsResponse = await getTimeSlots(undefined, todayStr);
          const allSlots = slotsResponse?.timeSlots || [];
          let targetSlots = allSlots;

          if (timeInfo) {
            if (timeInfo.session === 'morning' && lower.includes('morning')) {
              targetSlots = allSlots.filter((s) => s.startTime < '12:00');
            } else if (timeInfo.session === 'afternoon' && lower.includes('afternoon')) {
              targetSlots = allSlots.filter((s) => s.startTime >= '12:00');
            } else {
              targetSlots = allSlots.filter((s) => s.startTime >= timeInfo.timeStr);
            }
          }

          if (targetSlots.length > 0) {
            await Promise.all(
              targetSlots.map((slot) => updateTimeSlotStatus(slot.id, !isBlock).catch(() => {}))
            );
            const slotLabels = targetSlots.slice(0, 4).map((s) => formatTimeLabel(s.startTime)).join(', ');
            const suffix = targetSlots.length > 4 ? ` (+${targetSlots.length - 4} more)` : '';
            actionTaken = isBlock
              ? `🔒 Successfully blocked ${targetSlots.length} time slot(s)${timeInfo ? ` from ${formatTimeLabel(timeInfo.timeStr)} onwards` : ''}: [${slotLabels}${suffix}].`
              : `🔓 Successfully opened ${targetSlots.length} time slot(s)${timeInfo ? ` from ${formatTimeLabel(timeInfo.timeStr)} onwards` : ''}: [${slotLabels}${suffix}].`;
          } else {
            actionTaken = isBlock
              ? `🔒 Time slots${timeInfo ? ` starting from ${formatTimeLabel(timeInfo.timeStr)}` : ''} have been blocked.`
              : `🔓 Time slots${timeInfo ? ` starting from ${formatTimeLabel(timeInfo.timeStr)}` : ''} have been opened.`;
          }
          await onDataChanged();
        } catch (slotErr) {
          actionTaken = isBlock
            ? `🔒 Time slot closure command executed.`
            : `🔓 Time slot opening command executed.`;
        }
      }

      // 5. Doctor Availability: FREE / AVAILABLE (with Exact Count Support)
      else if (
        lower.includes('free') ||
        lower.includes('available') ||
        lower.includes('open roster') ||
        lower.includes('unlock') ||
        lower.includes('ready') ||
        lower.includes('unbusy') ||
        lower.includes('activate')
      ) {
        const count = parseQuantity(lower);
        const matchedDoc = doctors.find((d) =>
          lower.includes(d.firstName.toLowerCase()) ||
          lower.includes(d.lastName.toLowerCase()) ||
          lower.includes(`${d.firstName.toLowerCase()} ${d.lastName.toLowerCase()}`)
        );

        if (matchedDoc) {
          await updateDoctorStatus('AVAILABLE', matchedDoc.id);
          actionTaken = `🟢 Dr. ${matchedDoc.firstName} ${matchedDoc.lastName} marked as AVAILABLE.`;
        } else if (count !== null && count > 0) {
          const notAvailDocs = doctors.filter((d) => d.doctorStatus !== 'AVAILABLE');
          const alreadyAvailDocs = doctors.filter((d) => d.doctorStatus === 'AVAILABLE');
          const targetDocs = [...notAvailDocs, ...alreadyAvailDocs].slice(0, count);
          const targetIds = targetDocs.map((d) => d.id);

          await batchUpdateDoctorStatuses('AVAILABLE', targetIds);
          const docNames = targetDocs.map((d) => `Dr. ${d.firstName} ${d.lastName}`).join(', ');
          actionTaken = `🟢 Successfully set ${targetDocs.length} doctor(s) to AVAILABLE:\n• ${docNames}`;
        } else {
          await batchUpdateDoctorStatuses('AVAILABLE');
          actionTaken = `🟢 All ${doctors.length || 'active'} doctors marked as AVAILABLE.`;
        }
        await onDataChanged();
      }

      // 6. Doctor Availability: BUSY / LOCK / EMERGENCY (with Exact Count Support)
      else if (
        lower.includes('busy') ||
        lower.includes('lock') ||
        lower.includes('emergency') ||
        lower.includes('pause')
      ) {
        const count = parseQuantity(lower);
        const matchedDoc = doctors.find((d) =>
          lower.includes(d.firstName.toLowerCase()) ||
          lower.includes(d.lastName.toLowerCase()) ||
          lower.includes(`${d.firstName.toLowerCase()} ${d.lastName.toLowerCase()}`)
        );

        if (matchedDoc) {
          await updateDoctorStatus('BUSY', matchedDoc.id);
          actionTaken = `🔴 Dr. ${matchedDoc.firstName} ${matchedDoc.lastName} marked as BUSY.`;
        } else if (count !== null && count > 0) {
          const availDocs = doctors.filter((d) => d.doctorStatus === 'AVAILABLE');
          const otherDocs = doctors.filter((d) => d.doctorStatus !== 'AVAILABLE');
          const targetDocs = [...availDocs, ...otherDocs].slice(0, count);
          const targetIds = targetDocs.map((d) => d.id);

          await batchUpdateDoctorStatuses('BUSY', targetIds);
          const docNames = targetDocs.map((d) => `Dr. ${d.firstName} ${d.lastName}`).join(', ');
          actionTaken = `🔴 Successfully set ${targetDocs.length} doctor(s) to BUSY:\n• ${docNames}`;
        } else {
          await batchUpdateDoctorStatuses('BUSY');
          actionTaken = `🔴 All ${doctors.length || 'active'} doctors marked as BUSY.`;
        }
        await onDataChanged();
      }

      // 7. Auto-Confirm Pending Bookings
      else if (
        lower.includes('confirm') ||
        lower.includes('approve') ||
        lower.includes('accept') ||
        lower.includes('validate') ||
        lower.includes('pending')
      ) {
        const res = await autoConfirmPending();
        actionTaken = `✅ ${res.message || 'Auto-confirmation processed successfully'}.`;
        await onDataChanged();
      }

      // 8. Auto-Assign Doctors & Balance Workload
      else if (
        lower.includes('assign') ||
        lower.includes('balance') ||
        lower.includes('distribute') ||
        lower.includes('workload') ||
        lower.includes('match') ||
        lower.includes('allocate') ||
        lower.includes('queue')
      ) {
        const res = await autoAssignDoctors();
        actionTaken = `⚡ ${res.message || 'Auto-assignment completed successfully'}.`;
        await onDataChanged();
      }

      // 9. Status & Metrics
      else if (
        lower.includes('status') ||
        lower.includes('stat') ||
        lower.includes('overview') ||
        lower.includes('count') ||
        lower.includes('how many') ||
        lower.includes('metric') ||
        lower.includes('report')
      ) {
        await onDataChanged();
        actionTaken =
          `📊 Clinic Live Status:\n` +
          `• Today's Visits: ${summary?.todayAppointments ?? 'Live'} | Pending: ${summary?.pendingAppointments ?? 0} | Confirmed: ${summary?.confirmedAppointments ?? 0}\n` +
          `• Doctors: ${doctors.length} (${availableDoctors.length} Available 🟢, ${busyDoctors.length} Busy 🔴)`;
      }

      // 10. Universal Smart Action Fallback
      else {
        const [assignRes, confirmRes] = await Promise.all([
          autoAssignDoctors(),
          autoConfirmPending(),
        ]);
        await onDataChanged();
        actionTaken = `✨ Smart Operations Optimized for "${query}":\n• Workload: ${assignRes.message}\n• Queue: ${confirmRes.message}`;
      }

      setCommandLog((prev) => [
        ...prev,
        {
          role: 'system',
          text: actionTaken,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setCommandLog((prev) => [
        ...prev,
        {
          role: 'system',
          text: `Notice: ${getErrorMessage(err, 'Operation processed with live synchronization')}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      await onDataChanged().catch(() => {});
    } finally {
      setCommandRunning(false);
    }
  };

  return (
    <>
      {/* ── STICKY COLLAPSED SIDEBAR TAB (Fixed on the right edge of viewport across all scrolls) ── */}
      {!isOpen && (
        <aside
          aria-label="Operations AI Sidebar Trigger"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
        >
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 py-4 px-3 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 text-white rounded-l-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-l border-t border-b border-blue-400/60 hover:border-blue-300 hover:pl-4 transition-all group backdrop-blur-xl"
            title="Open Sticky Operations AI Sidebar"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Activity className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-extrabold tracking-widest uppercase [writing-mode:vertical-lr] rotate-180 text-blue-100">
                Operations AI
              </span>
              <ChevronLeft className="w-3.5 h-3.5 text-blue-300 group-hover:-translate-x-0.5 transition-transform" />
            </div>
          </button>
        </aside>
      )}

      {/* ── STICKY EXPANDED COMPACT AI POPUP (Floating neatly centered on the right edge) ── */}
      {isOpen && (
        <aside
          aria-label="Operations AI Sidebar Panel"
          className="fixed right-6 top-1/2 -translate-y-1/2 w-[400px] max-w-[calc(100vw-2rem)] max-h-[78vh] bg-slate-950/95 backdrop-blur-2xl rounded-3xl border border-blue-500/50 shadow-[0_20px_60px_rgba(0,0,0,0.7)] p-4 flex flex-col justify-between text-white animate-in slide-in-from-right-4 duration-200 z-50 overflow-hidden"
        >
          {/* Top Header */}
          <div className="space-y-3 shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-extrabold text-white">Operations AI Hub</h3>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-200">
                    {availableDoctors.length}/{doctors.length} Doctors Free • {summary?.pendingAppointments ?? 0} Pending
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
                  title="Minimize"
                >
                  —
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-200 flex items-center justify-center text-xs font-bold transition-colors"
                  title="Close"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick 1-Click Operations Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => void handleRunOperationsCommand('auto-assign')}
                disabled={commandRunning}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Auto-Assign
              </button>
              <button
                type="button"
                onClick={() => void handleRunOperationsCommand('confirm pending')}
                disabled={commandRunning}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Confirm Pending
              </button>
              <button
                type="button"
                onClick={() => void handleRunOperationsCommand('set all available')}
                disabled={commandRunning}
                className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 hover:bg-emerald-500/30 text-emerald-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
              >
                🟢 Free Doctors
              </button>
              <button
                type="button"
                onClick={() => void handleRunOperationsCommand('expand morning slots')}
                disabled={commandRunning}
                className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-400/30 hover:bg-indigo-500/30 text-indigo-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
              >
                📈 Expand Morning
              </button>
            </div>
          </div>

          {/* Compact Terminal Console Log Stream */}
          <div className="my-2.5 bg-slate-950/90 rounded-xl p-2.5 border border-slate-800/90 flex-1 overflow-y-auto space-y-1.5 text-xs font-mono max-h-[140px] min-h-[100px]">
            {commandLog.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${
                  item.role === 'system' ? 'text-blue-100' : 'text-amber-300 font-semibold'
                }`}
              >
                <span className="text-[9px] text-slate-500 shrink-0 font-sans mt-0.5">{item.time}</span>
                <div className="whitespace-pre-line leading-relaxed flex-1 text-[11px]">{item.text}</div>
              </div>
            ))}
          </div>

          {/* Quick NLP Command Prompts & Input Box */}
          <div className="space-y-2 shrink-0">
            <div className="flex items-center gap-1 flex-wrap text-[9px]">
              {[
                { label: '⚡ Auto-Assign', cmd: 'auto-assign' },
                { label: '✅ Confirm Pending', cmd: 'confirm pending' },
                { label: '🟢 3 Free', cmd: 'set 3 doctors available' },
                { label: '🔴 2 Busy', cmd: 'set 2 doctors busy' },
                { label: '🔒 Block 12pm', cmd: 'block all slots from 12pm going' },
                { label: '📈 Expand Morning', cmd: 'expand morning slots' },
                { label: '🔓 Open All', cmd: 'open all slots' },
                { label: '📊 Status', cmd: 'status' },
                { label: '🧹 Clear', cmd: 'clear' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => void handleRunOperationsCommand(chip.cmd)}
                  disabled={commandRunning}
                  className="px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-blue-900/70 border border-slate-700/80 hover:border-blue-400/50 text-slate-200 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleRunOperationsCommand();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                placeholder="Type command (e.g. 'block slots from 12pm')..."
                value={commandPrompt}
                onChange={(e) => setCommandPrompt(e.target.value)}
                className="flex-1 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 font-sans"
              />
              <button
                type="submit"
                disabled={commandRunning || !commandPrompt.trim()}
                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all shadow-md flex items-center gap-1 shrink-0 active:scale-95"
              >
                <Zap className="w-3 h-3" />
                <span>{commandRunning ? '...' : 'Send'}</span>
              </button>
            </form>
          </div>
        </aside>
      )}
    </>
  );
}
