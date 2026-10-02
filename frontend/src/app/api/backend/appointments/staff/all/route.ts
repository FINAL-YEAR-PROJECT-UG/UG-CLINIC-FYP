import { NextRequest, NextResponse } from "next/server.js";
import { mapAppointmentRow, type AppointmentRow } from "@/lib/appointmentMapper";
import { getSessionIdentity, isStaffRole } from "@/lib/sessionIdentity";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const identity = await getSessionIdentity(request);
  if (!identity || !isStaffRole(identity.role)) {
    return NextResponse.json(
      { success: false, message: "Forbidden: staff access only" },
      { status: 403 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Appointments database is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10) || 25),
  );
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("appointments")
    .select("*", { count: "exact" })
    .order("date", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status && status !== "all") {
    query = query.eq("status", status.toUpperCase());
  }
  if (search) {
    query = query.or(
      `patient_name.ilike.%${search}%,patient_email.ilike.%${search}%,reason.ilike.%${search}%,student_id.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { success: false, message: error.message, code: error.code },
      { status: 500 },
    );
  }

  const appointments = (data || []).map((row) => {
    const mapped = mapAppointmentRow(row as AppointmentRow);
    return {
      ...mapped,
      user: {
        id: row.user_id,
        firstName: String(row.patient_name || "").split(" ")[0] || "Student",
        lastName: String(row.patient_name || "").split(" ").slice(1).join(" "),
        studentId: row.student_id,
        email: row.patient_email,
      },
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      appointments,
      total: count ?? appointments.length,
      page,
      pageSize,
    },
  });
}
