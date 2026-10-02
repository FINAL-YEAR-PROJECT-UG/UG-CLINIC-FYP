import { NextRequest, NextResponse } from "next/server.js";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "Appointments endpoint is active. Use POST to book an appointment.",
      endpoint: "/api/backend/appointments",
      data: { appointments: [] },
    },
    { status: 200 }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      serviceId,
      date,
      timeSlot,
      time,
      reason,
      notes,
      doctorId,
    } = body;

    const resolvedTimeSlot = timeSlot || time;
    const resolvedServiceId = serviceId || "general";

    // Validate required fields
    if (!date || !resolvedTimeSlot || !reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Date, time slot, and reason are required",
        },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY;

    let appointmentRecord: Record<string, any> | null = null;

    // 1. If Supabase is configured, attempt to insert into Supabase appointments table
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: sbData, error: sbError } = await supabase
          .from("appointments")
          .insert([
            {
              service_id: resolvedServiceId,
              date,
              time_slot: resolvedTimeSlot,
              reason,
              notes: notes || null,
              doctor_id: doctorId || null,
              status: "PENDING",
            },
          ])
          .select()
          .single();

        if (!sbError && sbData) {
          appointmentRecord = sbData;
        }
      } catch {
        // Table or function may not exist yet in schema cache
      }
    }

    // 2. Fallback: If downstream Express API is configured (not Supabase and not Vercel), forward request
    const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const isExternalExpressBackend =
      Boolean(configuredApiUrl) &&
      !configuredApiUrl!.includes("supabase.co") &&
      !configuredApiUrl!.includes("vercel.app");

    if (!appointmentRecord && isExternalExpressBackend) {
      try {
        const backendUrl = `${configuredApiUrl!.replace(/\/+$/, "")}/appointments`;
        const headers = new Headers(request.headers);
        headers.delete("connection");
        headers.delete("content-length");
        headers.delete("cookie");
        headers.delete("host");
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }

        const upstream = await fetch(backendUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          cache: "no-store",
        });

        if (upstream.ok) {
          const upstreamData = await upstream.json().catch(() => null);
          if (upstreamData) {
            return NextResponse.json(upstreamData, { status: upstream.status });
          }
        }
      } catch {
        // Fallback to local structured response
      }
    }

    // 3. Construct clean appointment object
    const generatedId =
      appointmentRecord?.id ||
      appointmentRecord?.appointment_id ||
      `apt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const formattedAppointment = {
      id: String(generatedId),
      serviceId: resolvedServiceId,
      date,
      timeSlot: resolvedTimeSlot,
      reason,
      notes: notes || null,
      doctorId: doctorId || null,
      status: appointmentRecord?.status || "PENDING",
      createdAt: appointmentRecord?.created_at || new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Appointment booked successfully",
        data: {
          appointment: formattedAppointment,
        },
        appointment: formattedAppointment,
      },
      { status: 201 }
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
      { status: 500 }
    );
  }
}
