"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { appointmentApi } from "@/lib/appointmentApi";
import { getErrorMessage } from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import {
  Stethoscope,
  Brain,
  Ribbon,
  Leaf,
  Zap,
  Syringe,
  Pill,
  Eye,
  HeartPulse,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Step1Data {
  studentId: string;
  studentName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  studentEmail: string;
  alternateEmail: string;
  mobilePhone: string;
  whatsappPhone: string;
  bookingFor: string;
}

interface ServiceOption {
  id: string;
  title: string;
  desc?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  bg: string;
  fg: string;
  note?: string;
  badge?: string;
  unavailable?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const SERVICES: ServiceOption[] = [
  { id: "general", title: "General Consultation", desc: "Common illnesses and routine health checkups.", icon: Stethoscope, bg: "#EEF2FF", fg: "#3B4FD8" },
  { id: "mental", title: "Mental Health & Counselling", desc: "Confidential support for emotional wellbeing.", icon: Brain, bg: "#F3E8FF", fg: "#9333EA" },
  { id: "hiv", title: "HIV/AIDS Testing & Support", desc: "Free testing, counseling, and ongoing care.", icon: Ribbon, bg: "#FEE2E2", fg: "#DC2626" },
  { id: "nutrition", title: "Nutrition & Dietetics", desc: "Meal planning and dietary health advice.", icon: Leaf, bg: "#DCFCE7", fg: "#16A34A" },
  { id: "screening", title: "Health Screening", desc: "Comprehensive physical exams and diagnostics.", icon: Zap, bg: "#FFEDD5", fg: "#EA580C" },
  { id: "vaccination", title: "Vaccinations", desc: "Travel vaccines and seasonal immunizations.", icon: Syringe, bg: "#DCFCE7", fg: "#16A34A" },
  { id: "prescription", title: "Prescription & Medication", desc: "Refill requests and pharmacy consultations.", icon: Pill, bg: "#FEF9C3", fg: "#CA8A04" },
  { id: "eye", title: "Eye Care & Dental Services", icon: Eye, bg: "#DBEAFE", fg: "#2563EB", badge: "OFF-SITE ONLY", note: "Visit UG Hospital behind Legon Police Station", unavailable: true },
  { id: "emergency", title: "Emergency & First Aid", icon: HeartPulse, bg: "#FEE2E2", fg: "#DC2626", note: "Walk-ins accepted, no booking needed.", unavailable: true },
];

const TIME_SLOT_LABELS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = MONTHS.map((m) => m);
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const YEARS = Array.from({ length: 50 }, (_, i) => String(2006 - i));

function formatLongDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

// Parse time slot label (e.g., "08:00 AM") to minutes since midnight
function parseTimeSlotToMinutes(timeSlot: string): number {
  const [time, period] = timeSlot.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  const hours24 = period === 'PM' && hours !== 12 ? hours + 12 : period === 'AM' && hours === 12 ? 0 : hours;
  return hours24 * 60 + minutes;
}

// Check if a time slot is in the past for a given date
function isTimeSlotPast(timeSlot: string, date: Date): boolean {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (!isToday) return false;
  
  const slotMinutes = parseTimeSlotToMinutes(timeSlot);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  return slotMinutes < currentMinutes;
}

// ── Stepper ────────────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  const steps = [
    { num: 1, label: "Your Details" },
    { num: 2, label: "Select Service" },
    { num: 3, label: "Date & Time" },
    { num: 4, label: "Confirm" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", marginBottom: 36 }}>
      {steps.map((s, idx) => {
        const isActive = current === s.num;
        const isDone = current > s.num;
        const accent = isActive || isDone ? "#3B4FD8" : "#9CA3AF";
        return (
          <div key={s.num} style={{ display: "flex", alignItems: "flex-start", flex: idx < 3 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: `2px solid ${accent}`,
                background: isDone || isActive ? "#3B4FD8" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isDone || isActive ? "#fff" : "#9CA3AF", fontWeight: 700, fontSize: 14,
              }}>
                {isDone ? <Check size={18} color="#fff" /> : s.num}
              </div>
              <div style={{ fontSize: 12, color: accent, marginTop: 8, fontWeight: isActive ? 600 : 500, textAlign: "center" }}>{s.label}</div>
            </div>
            {idx < 3 && (
              <div style={{ flex: 1, height: 2, background: isDone ? "#3B4FD8" : "#E5E7EB", marginTop: 17, marginLeft: -4, marginRight: -4 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {children} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB",
  borderRadius: 8, fontSize: 14, color: "#111827", background: "#fff",
  outline: "none", boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" as const };

// ── Step 1: Your Details ─────────────────────────────────────────────────────────
function Step1({ data, onChange, onContinue }: {
  data: Step1Data;
  onChange: (d: Step1Data) => void;
  onContinue: () => void;
}) {
  const set = (key: keyof Step1Data) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...data, [key]: e.target.value });

  const handleContinue = () => {
    if (!data.studentId || !data.studentName || !data.studentEmail || !data.mobilePhone || !data.dobDay || !data.dobMonth || !data.dobYear) {
      alert("Please fill in all required fields.");
      return;
    }
    onContinue();
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
        <div>
          <FieldLabel required>Student ID</FieldLabel>
          <input style={inputStyle} placeholder="e.g. 10812345" value={data.studentId} onChange={set("studentId")} />
        </div>
        <div>
          <FieldLabel required>Student Name</FieldLabel>
          <input style={inputStyle} placeholder="Full name" value={data.studentName} onChange={set("studentName")} />
        </div>
        <div>
          <FieldLabel required>Date of Birth</FieldLabel>
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{ ...selectStyle, flex: 1 }} value={data.dobDay} onChange={set("dobDay")}>
              <option value="">Day</option>
              {DAYS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select style={{ ...selectStyle, flex: 1 }} value={data.dobMonth} onChange={set("dobMonth")}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
            <select style={{ ...selectStyle, flex: 1 }} value={data.dobYear} onChange={set("dobYear")}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <FieldLabel required>Student Email</FieldLabel>
          <input style={inputStyle} type="email" placeholder="you@st.ug.edu.gh" value={data.studentEmail} onChange={set("studentEmail")} />
        </div>
        <div>
          <FieldLabel>Alternate Email</FieldLabel>
          <input style={inputStyle} type="email" placeholder="Optional" value={data.alternateEmail} onChange={set("alternateEmail")} />
        </div>
        <div>
          <FieldLabel required>Mobile Phone Number</FieldLabel>
          <input style={inputStyle} placeholder="+233 ..." value={data.mobilePhone} onChange={set("mobilePhone")} />
        </div>
        <div>
          <FieldLabel>WhatsApp Phone Number</FieldLabel>
          <input style={inputStyle} placeholder="Optional" value={data.whatsappPhone} onChange={set("whatsappPhone")} />
        </div>
        <div>
          <FieldLabel required>Who is this booking for?</FieldLabel>
          <select style={selectStyle} value={data.bookingFor} onChange={set("bookingFor")}>
            <option value="Myself">Myself</option>
            <option value="Dependent">Dependent</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
        <button style={{ ...btnSecondary, opacity: 0.5 }} disabled>‹ Back</button>
        <button style={btnPrimary} onClick={handleContinue}>Continue ›</button>
      </div>
    </div>
  );
}

// ── Step 2: Select Service ───────────────────────────────────────────────────────
function Step2Service({ selected, onSelect, onContinue, onBack }: {
  selected: string;
  onSelect: (title: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#3B4FD8", margin: "0 0 6px" }}>Select a Service</h2>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>Choose the type of care you need. Click a service to select it.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {SERVICES.map((s) => {
          const isSelected = selected === s.title;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => !s.unavailable && onSelect(s.title)}
              disabled={s.unavailable}
              style={{
                textAlign: "left",
                border: isSelected ? "2px solid #3B4FD8" : s.id === "eye" ? "1px solid #FCD34D" : "1px solid #E5E7EB",
                background: isSelected ? "#EEF2FF" : s.id === "eye" ? "#FFFBEB" : "#fff",
                borderRadius: 12, padding: 18, position: "relative",
                cursor: s.unavailable ? "default" : "pointer",
                minHeight: 150, display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color={s.fg} />
                </div>
                {isSelected && (
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#3B4FD8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={14} color="#fff" />
                  </div>
                )}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: isSelected ? "#3B4FD8" : "#1F2937", margin: "14px 0 4px" }}>{s.title}</h3>
              {s.badge && (
                <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", letterSpacing: "0.05em", margin: "4px 0" }}>{s.badge}</div>
              )}
              {s.desc && <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>{s.desc}</p>}
              {s.note && s.id === "eye" && (
                <div style={{ marginTop: 8, border: "1px solid #FCD34D", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#B45309" }}>{s.note}</div>
              )}
              {s.note && s.id === "emergency" && (
                <p style={{ fontSize: 13, color: "#DC2626", fontStyle: "italic", margin: 0 }}>{s.note}</p>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, borderTop: "1px solid #F3F4F6", paddingTop: 24 }}>
        <button style={btnSecondary} onClick={onBack}>‹ Back</button>
        <button style={btnPrimary} onClick={onContinue}>Continue ›</button>
      </div>
    </div>
  );
}

// ── Step 3: Date & Time ──────────────────────────────────────────────────────────
function BookingCalendar({ selected, onSelect }: { selected: Date | null; onSelect: (d: Date) => void }) {
  const [view, setView] = useState<Date>(() => selected ?? new Date());
  const year = view.getFullYear();
  const month = view.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: { date: Date; current: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ date: new Date(year, month, 1 - firstWeekday + i), current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), current: false });
    if (cells.length >= 42) break;
  }

  const sameDay = (a: Date, b: Date | null) =>
    !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#3B4FD8", margin: 0 }}>{MONTHS[month]} {year}</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setView(new Date(year, month - 1, 1))} aria-label="Previous month" style={iconBtn}><ChevronLeft size={18} color="#6B7280" /></button>
          <button onClick={() => setView(new Date(year, month + 1, 1))} aria-label="Next month" style={iconBtn}><ChevronRight size={18} color="#6B7280" /></button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {WEEKDAY_HEADERS.map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#9CA3AF", padding: "4px 0" }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map(({ date, current }, i) => {
          const isPast = date < today;
          const disabled = !current || isPast;
          const isSelected = sameDay(date, selected);
          const isToday = sameDay(date, today);
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onSelect(date)}
              style={{
                height: 40, borderRadius: 999, border: isToday && !isSelected ? "1px solid #3B4FD8" : "none",
                background: isSelected ? "#3B4FD8" : "transparent",
                color: isSelected ? "#fff" : disabled ? "#D1D5DB" : "#1F2937",
                fontSize: 14, fontWeight: isSelected || isToday ? 700 : 500,
                cursor: disabled ? "default" : "pointer",
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step3DateTime({ date, time, bookedSlots, onSelectDate, onSelectTime, onContinue, onBack }: {
  date: Date | null;
  time: string;
  bookedSlots: string[];
  onSelectDate: (d: Date) => void;
  onSelectTime: (t: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const handleContinue = () => {
    if (!date || !time) {
      alert("Please select a date and time.");
      return;
    }
    onContinue();
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <BookingCalendar selected={date} onSelect={onSelectDate} />

        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#3B4FD8", margin: "0 0 16px" }}>
            {date ? `Available time slots for ${formatLongDate(date)}` : "Select a date to see available times"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {TIME_SLOT_LABELS.map((label) => {
              const isSelected = time === label;
              const isBooked = bookedSlots.includes(label);
              const isPast = date ? isTimeSlotPast(label, date) : false;
              const disabled = isBooked || !date || isPast;
              return (
                <button
                  key={label}
                  disabled={disabled}
                  onClick={() => onSelectTime(label)}
                  style={{
                    padding: "12px 4px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: isSelected ? "none" : "1px solid #E5E7EB",
                    background: isSelected ? "#3B4FD8" : isBooked || isPast ? "#F3F4F6" : "#fff",
                    color: isSelected ? "#fff" : isBooked || isPast ? "#9CA3AF" : "#374151",
                    cursor: disabled ? "default" : "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 18, fontSize: 13, color: "#6B7280" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={legendDot("#fff", "#D1D5DB")} />Available</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={legendDot("#3B4FD8")} />Selected</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={legendDot("#D1D5DB")} />Booked</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={legendDot("#F3F4F6")} />Past</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, borderTop: "1px solid #F3F4F6", paddingTop: 24 }}>
        <button style={btnSecondary} onClick={onBack}>‹ Back</button>
        <button style={btnPrimary} onClick={handleContinue}>Continue ›</button>
      </div>
    </div>
  );
}

function legendDot(bg: string, border?: string): React.CSSProperties {
  return { width: 12, height: 12, borderRadius: "50%", background: bg, border: border ? `1px solid ${border}` : "none", display: "inline-block" };
}

// ── Step 4: Review & Confirm ─────────────────────────────────────────────────────
function Step4Review({ step1, service, date, time, onConfirm, onBack, loading }: {
  step1: Step1Data;
  service: string;
  date: Date | null;
  time: string;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const dob = [step1.dobDay, step1.dobMonth, step1.dobYear].filter(Boolean).join(" ");
  const info: [string, string][] = [
    ["Student Name", step1.studentName],
    ["Student ID", step1.studentId],
    ["Date of Birth", dob],
    ["Email", step1.studentEmail],
    ["Mobile", step1.mobilePhone],
    ["WhatsApp", step1.whatsappPhone || "—"],
    ["Booking for", step1.bookingFor],
  ];
  const appt: [string, string][] = [
    ["Service", service],
    ["Date", date ? formatLongDate(date) : "—"],
    ["Time", time || "—"],
    ["Location", "Student Clinic, UG Legon"],
    ["Doctor", "Auto-assigned on arrival"],
  ];

  return (
    <div>
      {loading ? (
        <div style={{ padding: "60px 0" }}>
          <LoadingSpinner size={80} />
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#3B4FD8", textAlign: "center", margin: "0 0 28px" }}>
            Almost there! Please confirm your details before booking.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#3B4FD8", margin: "0 0 16px" }}>Your Information</h3>
              {info.map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F3F4F6", fontSize: 14 }}>
                  <span style={{ color: "#6B7280" }}>{label}:</span>
                  <span style={{ color: "#1F2937", fontWeight: 500, textAlign: "right" }}>{value || "—"}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#3B4FD8", margin: "0 0 16px" }}>Appointment Details</h3>
              {appt.map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F3F4F6", fontSize: 14 }}>
                  <span style={{ color: "#6B7280" }}>{label}:</span>
                  <span style={{ color: "#1F2937", fontWeight: 500, textAlign: "right" }}>{value || "—"}</span>
                </div>
              ))}

              <div style={{ marginTop: 20, background: "#DBEAFE", borderRadius: 12, padding: "16px 20px" }}>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#1E40AF", fontSize: 13, lineHeight: 2 }}>
                  <li>Arrive 10 minutes early</li>
                  <li>Bring your Student ID card</li>
                  <li>This service is completely free</li>
                  <li>You can cancel up to 2 hours before</li>
                </ul>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, borderTop: "1px solid #F3F4F6", paddingTop: 24 }}>
            <button style={{ ...btnSecondary, border: "none", color: "#3B4FD8" }} onClick={onBack}>Back</button>
            <button
              style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 8 }}
              onClick={onConfirm}
            >
              <CalendarIcon size={16} color="#fff" />
              Confirm & Book Appointment
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Success ──────────────────────────────────────────────────────────────────────
function SuccessScreen({ step1, service, date, time, bookingRef, onBookAnother }: {
  step1: Step1Data;
  service: string;
  date: Date | null;
  time: string;
  bookingRef: string;
  onBookAnother: () => void;
}) {
  const firstName = step1.studentName.split(" ")[0] || "there";
  const rows: [string, string][] = [
    ["Service", service],
    ["Date", date ? formatLongDate(date) : "—"],
    ["Time", time || "—"],
    ["Location", "Student Clinic, UG Legon"],
    ["Doctor", "To be assigned on arrival"],
  ];

  return (
    <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto", padding: "16px 0" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={26} color="#fff" />
        </div>
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#3B4FD8", margin: "0 0 8px" }}>Appointment Confirmed!</h2>
      <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px" }}>
        Your booking has been successfully submitted. See you soon, {firstName}!
      </p>

      <div style={{ background: "#EEF2FF", borderRadius: 12, padding: "18px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em" }}>BOOKING REFERENCE</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#3B4FD8", marginTop: 4 }}>{bookingRef}</div>
      </div>

      <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        {rows.map(([label, value], i) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < rows.length - 1 ? "1px solid #F3F4F6" : "none", fontSize: 14 }}>
            <span style={{ color: "#6B7280" }}>{label}:</span>
            <span style={{ color: "#1F2937", fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
        A confirmation has been sent to <strong style={{ color: "#3B4FD8" }}>{step1.studentEmail}</strong>
      </p>

      <Link href="/dashboard" style={{ textDecoration: "none" }}>
        <button style={{ ...btnPrimary, width: "100%", background: "linear-gradient(to right, #3730A3, #3B4FD8)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <CalendarIcon size={16} color="#fff" /> View my appointments
        </button>
      </Link>

      <button onClick={() => window.print()} style={{ background: "none", border: "none", color: "#3B4FD8", fontWeight: 600, fontSize: 14, cursor: "pointer", margin: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%" }}>
        <Download size={16} color="#3B4FD8" /> Download confirmation
      </button>

      <button onClick={onBookAnother} style={{ background: "none", border: "none", color: "#3B4FD8", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 20 }}>
        Book another appointment
      </button>

      <p style={{ fontSize: 13, color: "#6B7280" }}>
        Need to cancel or reschedule? <Link href="/dashboard" style={{ color: "#1F2937", fontWeight: 600 }}>Visit your dashboard</Link> anytime.
      </p>
    </div>
  );
}

// ── Button styles ──────────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  padding: "11px 28px", background: "#3B4FD8", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14,
  cursor: "pointer", transition: "background 0.15s",
};

const btnSecondary: React.CSSProperties = {
  padding: "11px 20px", background: "transparent", color: "#6B7280",
  border: "1px solid #D1D5DB", borderRadius: 8, fontWeight: 500, fontSize: 14,
  cursor: "pointer",
};

const iconBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB",
  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Prefill the patient details from the signed-in student (read once on mount).
  const [step1, setStep1] = useState<Step1Data>(() => {
    const user = useAuthStore.getState().user;
    // Handle case where user might have only one name stored in both fields
    const fullName = user 
      ? (user.firstName === user.lastName || !user.lastName)
        ? user.firstName 
        : `${user.firstName} ${user.lastName}`.trim()
      : "";
    return {
      studentId: user?.studentId ?? "",
      studentName: fullName,
      dobDay: "", dobMonth: "", dobYear: "",
      studentEmail: user?.email ?? "",
      alternateEmail: "",
      mobilePhone: user?.phone ?? "",
      whatsappPhone: "",
      bookingFor: "Myself",
    };
  });
  const [service, setService] = useState("General Consultation");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!date || step !== 3) {
      setBookedSlots([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const services = await appointmentApi.listServices();
        const match = services.find(
          (s) => s.name.toLowerCase() === service.toLowerCase()
        );
        const slots = await appointmentApi.getAvailability(
          date.toISOString(),
          match?.id
        );
        if (!cancelled) setBookedSlots(slots);
      } catch {
        if (!cancelled) setBookedSlots([]);
      }
    })();

    return () => { cancelled = true; };
  }, [date, service, step]);

  const handleSelectDate = (d: Date) => {
    setDate(d);
    setTime("");
  };

  const handleReturn = () => {
    router.push(isAuthenticated ? "/dashboard" : "/home");
  };

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      alert("Please sign in to book an appointment.");
      router.push("/login");
      return;
    }
    if (!date || !time) {
      alert("Please select a date and time.");
      return;
    }

    setLoading(true);
    try {
      const services = await appointmentApi.listServices();
      const match = services.find(
        (s) => s.name.toLowerCase() === service.toLowerCase()
      );
      const serviceId = match?.id ?? services[0]?.id;
      if (!serviceId) {
        alert("No clinic services are available right now. Please try again later.");
        return;
      }

      const response = await appointmentApi.create({
        serviceId,
        date: date.toISOString(),
        timeSlot: time,
        reason: service,
      });

      if (response.success && response.data) {
        const appt = response.data.appointment;
        const year = new Date(appt.date).getFullYear();
        setBookingRef(`UGC-${year}-${appt.id.slice(0, 5).toUpperCase()}`);
        setSubmitted(true);
      } else {
        alert(response.message || "Failed to book appointment. Please try again.");
      }
    } catch (err) {
      alert(getErrorMessage(err, "An error occurred. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setSubmitted(false);
    setStep(1);
    setStep1({ studentId: "", studentName: "", dobDay: "", dobMonth: "", dobYear: "", studentEmail: "", alternateEmail: "", mobilePhone: "", whatsappPhone: "", bookingFor: "Myself" });
    setService("General Consultation");
    setDate(null);
    setTime("");
    setBookedSlots([]);
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minHeight: "100vh", background: "#F3F4F6", width: "100%", overflowX: "hidden" }}>
      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "0 16px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#3B4FD8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>UG</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>UG Student Clinic</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Quality Healthcare for Students</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleReturn}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#3B4FD8", background: "#fff", border: "1px solid #3B4FD8", borderRadius: 8, padding: "9px 18px", cursor: "pointer" }}
>
            <ChevronLeft size={16} /> Return
          </button>
          <Link href="/demo-booking">
            <button style={btnPrimary}>Book Appointment</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "#3B4FD8", padding: "40px 24px 60px", textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>Book an Appointment</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", maxWidth: 520, margin: "0 auto" }}>
          Schedule a visit with the University of Ghana, Legon Student Clinic in three quick steps. Free for all students.
        </p>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: submitted ? 720 : 920, margin: "-24px auto 40px", padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "12px 28px", textAlign: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {submitted ? "Booking Complete" : step === 4 ? "Review Your Details" : "Complete the form below"}
            </span>
          </div>

          <div style={{ padding: "32px 28px" }}>
            {submitted ? (
              <SuccessScreen step1={step1} service={service} date={date} time={time} bookingRef={bookingRef} onBookAnother={resetBooking} />
            ) : (
              <>
                <Stepper current={step} />
                {step === 1 && <Step1 data={step1} onChange={setStep1} onContinue={() => setStep(2)} />}
                {step === 2 && <Step2Service selected={service} onSelect={setService} onContinue={() => setStep(3)} onBack={() => setStep(1)} />}
                {step === 3 && <Step3DateTime date={date} time={time} bookedSlots={bookedSlots} onSelectDate={handleSelectDate} onSelectTime={setTime} onContinue={() => setStep(4)} onBack={() => setStep(2)} />}
                {step === 4 && <Step4Review step1={step1} service={service} date={date} time={time} onConfirm={handleConfirm} onBack={() => setStep(3)} loading={loading} />}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "#111827", padding: "20px 24px", textAlign: "center" }}>
        <span style={{ fontSize: 13, color: "#6B7280" }}>© 2026 University Student Clinic. All rights reserved.</span>
      </footer>
    </div>
  );
}



