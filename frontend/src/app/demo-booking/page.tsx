"use client";

import { useState } from "react";
import Link from "next/link";

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

interface Step2Data {
  service: string;
  preferredDoctor: string;
  preferredDate: string;
  preferredTime: string;
  reasonForVisit: string;
}

interface Step3Data {
  additionalNotes: string;
  consent: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TIME_SLOTS = ["08:30", "09:30", "10:30", "11:30", "13:00", "14:00", "15:00", "16:00"];

const SERVICES = [
  "General Consultation",
  "Dental Care",
  "Eye Care",
  "Mental Health",
  "Physiotherapy",
  "Laboratory Tests",
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const YEARS = Array.from({ length: 50 }, (_, i) => String(2006 - i));

// ── Sub-components ─────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  const steps = [
    { num: 1, label: "Your Details" },
    { num: 2, label: "Appointment" },
    { num: 3, label: "Confirm" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", marginBottom: 32, position: "relative" }}>
      {steps.map((s, idx) => {
        const isActive = current === s.num;
        const isDone = current > s.num;
        const color = isActive || isDone ? "#3B4FD8" : "#9CA3AF";
        return (
          <div key={s.num} style={{ display: "flex", alignItems: "flex-start", flex: idx < 2 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", border: `2px solid ${color}`,
                background: isActive ? "#fff" : isDone ? "#fff" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color, fontWeight: 700, fontSize: 14, zIndex: 1,
              }}>
                {s.num}
              </div>
              <div style={{ marginTop: 6, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  STEP {s.num}
                </div>
                <div style={{ fontSize: 12, color, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
            {idx < 2 && (
              <div style={{
                flex: 1, height: 2,
                background: isDone ? "#3B4FD8" : "#E5E7EB",
                marginTop: 17, marginLeft: -4, marginRight: -4,
              }} />
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
  borderRadius: 8, fontSize: 14, color: "#374151", background: "#fff",
  outline: "none", boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" as const };

// ── Step 1 ─────────────────────────────────────────────────────────────────────
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
        {/* Student ID */}
        <div>
          <FieldLabel required>Student ID</FieldLabel>
          <input style={inputStyle} placeholder="e.g. 10812345" value={data.studentId} onChange={set("studentId")} />
        </div>
        {/* Student Name */}
        <div>
          <FieldLabel required>Student Name</FieldLabel>
          <input style={inputStyle} placeholder="Full name" value={data.studentName} onChange={set("studentName")} />
        </div>
        {/* Date of Birth */}
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
        {/* Student Email */}
        <div>
          <FieldLabel required>Student Email</FieldLabel>
          <input style={inputStyle} type="email" placeholder="you@st.ug.edu.gh" value={data.studentEmail} onChange={set("studentEmail")} />
        </div>
        {/* Alternate Email */}
        <div>
          <FieldLabel>Alternate Email</FieldLabel>
          <input style={inputStyle} type="email" placeholder="Optional" value={data.alternateEmail} onChange={set("alternateEmail")} />
        </div>
        {/* Mobile Phone */}
        <div>
          <FieldLabel required>Mobile Phone Number</FieldLabel>
          <input style={inputStyle} placeholder="+233 ..." value={data.mobilePhone} onChange={set("mobilePhone")} />
        </div>
        {/* WhatsApp */}
        <div>
          <FieldLabel>WhatsApp Phone Number</FieldLabel>
          <input style={inputStyle} placeholder="Optional" value={data.whatsappPhone} onChange={set("whatsappPhone")} />
        </div>
        {/* Booking for */}
        <div>
          <FieldLabel required>Who is this booking for?</FieldLabel>
          <select style={selectStyle} value={data.bookingFor} onChange={set("bookingFor")}>
            <option value="MYSELF">MYSELF</option>
            <option value="DEPENDENT">DEPENDENT</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
        <button style={{ ...btnSecondary }} disabled>
          ‹ Back
        </button>
        <button style={btnPrimary} onClick={handleContinue}>
          Continue ›
        </button>
      </div>
    </div>
  );
}

// ── Step 2 ─────────────────────────────────────────────────────────────────────
function Step2({ data, onChange, onContinue, onBack }: {
  data: Step2Data;
  onChange: (d: Step2Data) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const set = (key: keyof Step2Data) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange({ ...data, [key]: e.target.value });

  const handleContinue = () => {
    if (!data.service || !data.preferredDate || !data.preferredTime || !data.reasonForVisit) {
      alert("Please fill in all required fields.");
      return;
    }
    onContinue();
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
        {/* Service */}
        <div>
          <FieldLabel required>Service</FieldLabel>
          <select style={selectStyle} value={data.service} onChange={set("service")}>
            {SERVICES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {/* Preferred Doctor */}
        <div>
          <FieldLabel>Preferred Doctor</FieldLabel>
          <input style={inputStyle} placeholder="Dr. Owusu" value={data.preferredDoctor} onChange={set("preferredDoctor")} />
        </div>
        {/* Preferred Date */}
        <div>
          <FieldLabel required>Preferred Date</FieldLabel>
          <input style={inputStyle} type="date" value={data.preferredDate}
            onChange={(e) => onChange({ ...data, preferredDate: e.target.value })} />
        </div>
        {/* Preferred Time */}
        <div>
          <FieldLabel required>Preferred Time</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {TIME_SLOTS.map(t => (
              <button key={t} onClick={() => onChange({ ...data, preferredTime: t })}
                style={{
                  padding: "10px 4px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
                  border: data.preferredTime === t ? "2px solid #3B4FD8" : "1px solid #D1D5DB",
                  background: data.preferredTime === t ? "#3B4FD8" : "#fff",
                  color: data.preferredTime === t ? "#fff" : "#374151",
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div style={{ marginTop: 20 }}>
        <FieldLabel required>Reason for visit</FieldLabel>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
          placeholder="Describe your symptoms or reason for visit..."
          value={data.reasonForVisit}
          onChange={set("reasonForVisit")}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
        <button style={btnSecondary} onClick={onBack}>‹ Back</button>
        <button style={btnPrimary} onClick={handleContinue}>Continue ›</button>
      </div>
    </div>
  );
}

// ── Step 3 ─────────────────────────────────────────────────────────────────────
function Step3({
  step1, step2, data, onChange, onConfirm, onBack, loading,
}: {
  step1: Step1Data; step2: Step2Data; data: Step3Data;
  onChange: (d: Step3Data) => void;
  onConfirm: () => void; onBack: () => void; loading: boolean;
}) {
  const dob = [step1.dobDay, step1.dobMonth, step1.dobYear].filter(Boolean).join(" ");

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>Review your details</h2>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>Please confirm everything is correct before submitting.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Student card */}
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#3B4FD8", letterSpacing: "0.08em", marginBottom: 14 }}>STUDENT</div>
          {[
            ["Name", step1.studentName],
            ["Student ID", step1.studentId],
            ["Email", step1.studentEmail],
            ["Phone", step1.mobilePhone],
            ["Date of Birth", dob],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
              <span style={{ color: "#6B7280" }}>{label}</span>
              <span style={{ color: "#1F2937", fontWeight: 500 }}>{value || "—"}</span>
            </div>
          ))}
        </div>
        {/* Appointment card */}
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#3B4FD8", letterSpacing: "0.08em", marginBottom: 14 }}>APPOINTMENT</div>
          {[
            ["Service", step2.service],
            ["Date", step2.preferredDate],
            ["Time", step2.preferredTime],
            ["Doctor", step2.preferredDoctor || "—"],
            ["For", step1.bookingFor],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
              <span style={{ color: "#6B7280" }}>{label}</span>
              <span style={{ color: "#1F2937", fontWeight: 500 }}>{value || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional notes */}
      <div style={{ marginBottom: 20 }}>
        <FieldLabel>Additional notes for the clinic</FieldLabel>
        <textarea
          style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
          placeholder="Optional"
          value={data.additionalNotes}
          onChange={(e) => onChange({ ...data, additionalNotes: e.target.value })}
        />
      </div>

      {/* Consent */}
      <div style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, marginBottom: 28, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <input type="checkbox" id="consent" checked={data.consent}
          onChange={(e) => onChange({ ...data, consent: e.target.checked })}
          style={{ marginTop: 2, accentColor: "#3B4FD8", width: 16, height: 16, flexShrink: 0, cursor: "pointer" }} />
        <label htmlFor="consent" style={{ fontSize: 13, color: "#374151", cursor: "pointer", lineHeight: 1.5 }}>
          I confirm the information provided is accurate and I consent to the University of Ghana Student Clinic processing it to schedule my appointment.
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button style={btnSecondary} onClick={onBack}>‹ Back</button>
        <button style={{ ...btnPrimary, opacity: (!data.consent || loading) ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8 }}
          onClick={onConfirm} disabled={!data.consent || loading}>
          📅 {loading ? "Submitting..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

// ── Success ────────────────────────────────────────────────────────────────────
function SuccessScreen({ name, service, date, time, email, onHome }: {
  name: string; service: string; date: string; time: string; email: string; onHome: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%", background: "#EEF2FF",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px", fontSize: 28,
      }}>
        ✓
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>Appointment Confirmed</h2>
      <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, maxWidth: 440, margin: "0 auto 28px" }}>
        Thank you, {name}. Your {service.toLowerCase()} appointment is booked for{" "}
        <strong>{date}</strong> at <strong>{time}</strong>. A confirmation email has been sent to {email}.
      </p>
      <button style={btnPrimary} onClick={onHome}>Back to Home</button>
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [step1, setStep1] = useState<Step1Data>({
    studentId: "", studentName: "", dobDay: "", dobMonth: "", dobYear: "",
    studentEmail: "", alternateEmail: "", mobilePhone: "", whatsappPhone: "", bookingFor: "MYSELF",
  });

  const [step2, setStep2] = useState<Step2Data>({
    service: "General Consultation", preferredDoctor: "",
    preferredDate: "", preferredTime: "", reasonForVisit: "",
  });

  const [step3, setStep3] = useState<Step3Data>({ additionalNotes: "", consent: false });

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload = {
        studentId: step1.studentId,
        name: step1.studentName,
        email: step1.studentEmail,
        date: step2.preferredDate,
        time: step2.preferredTime,
        reason: step2.reasonForVisit,
        service: step2.service,
        doctor: step2.preferredDoctor,
        notes: step3.additionalNotes,
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to book appointment. Please try again.");
      }
    } catch {
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHome = () => {
    setSubmitted(false);
    setStep(1);
    setStep1({ studentId: "", studentName: "", dobDay: "", dobMonth: "", dobYear: "", studentEmail: "", alternateEmail: "", mobilePhone: "", whatsappPhone: "", bookingFor: "MYSELF" });
    setStep2({ service: "General Consultation", preferredDoctor: "", preferredDate: "", preferredTime: "", reasonForVisit: "" });
    setStep3({ additionalNotes: "", consent: false });
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minHeight: "100vh", background: "#F3F4F6" }}>
      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, background: "#3B4FD8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>UG</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1F2937" }}>UG Student Clinic</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Quality Healthcare for Students</div>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/" style={{ fontSize: 14, color: "#4B5563", textDecoration: "none", fontWeight: 500 }}>Home</Link>
          <Link href="/about" style={{ fontSize: 14, color: "#4B5563", textDecoration: "none", fontWeight: 500 }}>About</Link>
          <Link href="/services" style={{ fontSize: 14, color: "#4B5563", textDecoration: "none", fontWeight: 500 }}>Services</Link>
          <Link href="/resources" style={{ fontSize: 14, color: "#4B5563", textDecoration: "none", fontWeight: 500 }}>Health Resources</Link>
          <Link href="/contact" style={{ fontSize: 14, color: "#4B5563", textDecoration: "none", fontWeight: 500 }}>Contact</Link>
          <Link href="/login">
            <button style={btnPrimary}>Book Appointment</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "#3B4FD8", padding: "40px 24px 60px", textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>Book an Appointment</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", maxWidth: 500, margin: "0 auto" }}>
          Schedule a visit with the University of Ghana, Legon Student Clinic in three quick steps. Free for all students.
        </p>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: 780, margin: "-24px auto 40px", padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {/* Card header */}
          <div style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "12px 28px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              COMPLETE THE FORM BELOW
            </span>
          </div>

          <div style={{ padding: "32px 28px" }}>
            {submitted ? (
              <SuccessScreen
                name={step1.studentName}
                service={step2.service}
                date={step2.preferredDate}
                time={step2.preferredTime}
                email={step1.studentEmail}
                onHome={handleHome}
              />
            ) : (
              <>
                <Stepper current={step} />
                {step === 1 && <Step1 data={step1} onChange={setStep1} onContinue={() => setStep(2)} />}
                {step === 2 && <Step2 data={step2} onChange={setStep2} onContinue={() => setStep(3)} onBack={() => setStep(1)} />}
                {step === 3 && <Step3 step1={step1} step2={step2} data={step3} onChange={setStep3} onConfirm={handleConfirm} onBack={() => setStep(2)} loading={loading} />}
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
