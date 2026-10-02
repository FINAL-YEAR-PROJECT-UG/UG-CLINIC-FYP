export type AppointmentRow = {
  id: string;
  user_id?: string | null;
  student_id?: string | null;
  patient_name?: string | null;
  patient_email: string;
  service_id: string;
  service_name?: string | null;
  doctor_id?: string | null;
  doctor_name?: string | null;
  date: string;
  time_slot: string;
  reason: string;
  notes?: string | null;
  status: string;
  created_at?: string;
  booking_email_sent?: boolean;
  approval_email_sent?: boolean;
};

export function mapAppointmentRow(row: AppointmentRow) {
  const doctorName = row.doctor_name?.trim() || "";
  const [firstName, ...rest] = doctorName.split(" ").filter(Boolean);

  return {
    id: String(row.id),
    userId: row.user_id || "",
    serviceId: row.service_id,
    date: row.date,
    timeSlot: row.time_slot,
    status: String(row.status || "PENDING").toUpperCase(),
    reason: row.reason,
    notes: row.notes || null,
    createdAt: row.created_at || new Date().toISOString(),
    service: row.service_name
      ? {
          id: row.service_id,
          name: row.service_name,
          category: undefined,
          duration: undefined,
        }
      : null,
    doctor: doctorName
      ? {
          firstName: firstName || doctorName,
          lastName: rest.join(" "),
        }
      : null,
  };
}
