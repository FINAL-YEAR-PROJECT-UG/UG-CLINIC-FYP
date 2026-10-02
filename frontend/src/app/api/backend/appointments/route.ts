import { NextRequest, NextResponse } from "next/server.js";
import { mapAppointmentRow, type AppointmentRow } from "@/lib/appointmentMapper";
import { sendBookingConfirmationEmail } from "@/lib/appointmentNotifications";
import { getSessionIdentity, identityMatchFilter } from "@/lib/sessionIdentity";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const SERVICE_NAMES: Record<string, string> = {
  general: "General Consultation",
  mental: "Mental Health & Counseling",
  "eye-care": "Eye Care & Vision Services",
  dental: "Dental Checkup & Oral Health",
  hiv: "HIV/AIDS Testing & Support",
  nutrition: "Nutrition & Dietetics",
  screening: "Comprehensive Health Screening",
  vaccination: "Vaccinations & Immunizations",
  "family-planning": "Family Planning & Reproductive Health",
  prescription: "Prescription & Pharmacy Refill",
};

function missingConfigResponse() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Appointments database is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    },
    { status: 503 },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: "GET, POST, OPTIONS" },
  });
}

export async function GET(request: NextRequest) {
  const identity = await getSessionIdentity(request);
  if (!identity?.userId && !identity?.email) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  if (!isSupabaseConfigured()) {
    return missingConfigResponse();
  }

  try {
    const supabase = getSupabaseAdmin();
    const match = identityMatchFilter(identity);
    if (!match) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    let query = supabase.from("appointments").select("*").or(match);

    const { data, error } = await query
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.code === "PGRST205" ? 503 : 500 },
      );
    }

    const appointments = (data || []).map((row) =>
      mapAppointmentRow(row as AppointmentRow),
    );

    return NextResponse.json(
      { success: true, data: { appointments } },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching appointments",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { serviceId, date, timeSlot, time, reason, notes, doctorId, doctorName } =
      body as Record<string, string | undefined>;

    const resolvedTimeSlot = timeSlot || time;
    const resolvedServiceId = serviceId || "general";

    if (!date || !resolvedTimeSlot || !reason) {
      return NextResponse.json(
        { success: false, message: "Date, time slot, and reason are required" },
        { status: 400 },
      );
    }

    const identity = await getSessionIdentity(request);
    const patientEmail = identity?.email || null;
    if (!patientEmail) {
      return NextResponse.json(
        { success: false, message: "A verified patient email is required to book" },
        { status: 401 },
      );
    }

    if (!isSupabaseConfigured()) {
      return missingConfigResponse();
    }

    const supabase = getSupabaseAdmin();
    const patientName = [identity?.firstName, identity?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const insertPayload = {
      user_id: identity?.userId || null,
      student_id: identity?.studentId || null,
      patient_name: patientName || null,
      patient_email: patientEmail,
      service_id: resolvedServiceId,
      service_name: SERVICE_NAMES[resolvedServiceId] || resolvedServiceId,
      doctor_id: doctorId || null,
      doctor_name: doctorName || null,
      date,
      time_slot: resolvedTimeSlot,
      reason: String(reason).trim(),
      notes: notes || null,
      status: "PENDING",
      booking_email_sent: false,
      approval_email_sent: false,
    };

    const { data, error } = await supabase
      .from("appointments")
      .insert([insertPayload])
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          message: error?.message || "Database insert failed",
          code: error?.code,
        },
        { status: error?.code === "PGRST205" ? 503 : 500 },
      );
    }

    const appointment = mapAppointmentRow(data as AppointmentRow);

    try {
      await sendBookingConfirmationEmail({
        supabase,
        appointmentId: data.id,
        alreadySent: Boolean(data.booking_email_sent),
        to: patientEmail,
        patientName: patientName || "Student",
        serviceName: data.service_name || resolvedServiceId,
        date: data.date,
        timeSlot: data.time_slot,
      });
    } catch {
      console.info("[appointment-notification]", {
        kind: "booking",
        sent: false,
        error: "DISPATCH_FAILED",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Appointment booked successfully",
        data: { appointment },
        appointment,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while booking the appointment",
      },
      { status: 500 },
    );
  }
}
