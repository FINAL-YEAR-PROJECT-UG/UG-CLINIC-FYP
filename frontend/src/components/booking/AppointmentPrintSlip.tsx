"use client";

import Image from "next/image";

type AppointmentPrintSlipProps = {
  reference: string;
  status: string;
  patientName: string;
  studentId?: string | null;
  email?: string | null;
  serviceName: string;
  dateLabel: string;
  timeSlot: string;
  doctorName: string;
};

export default function AppointmentPrintSlip({
  reference,
  status,
  patientName,
  studentId,
  email,
  serviceName,
  dateLabel,
  timeSlot,
  doctorName,
}: AppointmentPrintSlipProps) {
  const issued = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="appointment-print-slip hidden print:block">
      <div className="slip">
        <header className="slip-head">
          <div className="slip-brand">
            <Image src="/logo.svg" alt="University of Ghana" width={42} height={42} />
            <div>
              <p className="slip-org">University of Ghana Health Services</p>
              <p className="slip-sub">Student Clinic · Legon</p>
            </div>
          </div>
          <div className="slip-issued">
            <p>Appointment voucher</p>
            <p>Issued {issued}</p>
          </div>
        </header>

        <div className="slip-ref">
          <div>
            <span>Reference</span>
            <strong>{reference}</strong>
          </div>
          <em>{status}</em>
        </div>

        <div className="slip-grid">
          <dl>
            <div>
              <dt>Patient</dt>
              <dd>{patientName || "Registered student"}</dd>
            </div>
            <div>
              <dt>Student ID</dt>
              <dd>{studentId || "—"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{email || "—"}</dd>
            </div>
          </dl>
          <dl>
            <div>
              <dt>Service</dt>
              <dd>{serviceName}</dd>
            </div>
            <div>
              <dt>Date / time</dt>
              <dd>
                {dateLabel}
                <br />
                {timeSlot}
              </dd>
            </div>
            <div>
              <dt>Location / clinician</dt>
              <dd>
                Student Clinic, UG Legon
                <br />
                {doctorName}
              </dd>
            </div>
          </dl>
        </div>

        <ul className="slip-notes">
          <li>Bring your UG student ID.</li>
          <li>Arrive 10 minutes before your slot.</li>
        </ul>

        <footer className="slip-foot">
          <span>Electronic record · {reference}</span>
          <span className="stamp">Clinic authorization</span>
        </footer>
      </div>
    </div>
  );
}
