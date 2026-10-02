import { NextRequest, NextResponse } from "next/server.js";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY;

    let bookedSlots: string[] = [];

    if (supabaseUrl && supabaseKey && date) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const query = supabase
          .from("appointments")
          .select("time_slot")
          .eq("date", date)
          .not("status", "in", '("CANCELLED","NO_SHOW")');

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          bookedSlots = data.map((d: any) => d.time_slot).filter(Boolean);
        }
      } catch {
        // Table may not exist yet
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          bookedSlots,
          hasExistingBooking: false,
          existingTimeSlot: null,
          existingAppointmentId: null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch appointment availability",
      },
      { status: 500 }
    );
  }
}
