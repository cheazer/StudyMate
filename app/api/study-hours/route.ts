import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";
import { DEMO_USER_ID } from "@/lib/constants";

const StudyHoursInput = z.object({
  courseId: z.string(),
  hoursStudied: z.number().min(0).max(24),
  date: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = StudyHoursInput.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { courseId, hoursStudied, date } = parsed.data;
  const studyDate = date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

  try {
    // TODO: Replace with authenticated user's ID once Supabase auth is wired up
    const userId = DEMO_USER_ID;

    // Insert or update streak log
    const { error } = await supabaseServer()
      .from("streak_log")
      .upsert({
        user_id: userId,
        date: studyDate,
        minutes_studied: Math.round(hoursStudied * 60),
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Logged ${hoursStudied} hours on ${studyDate}`,
      hoursStudied,
      date: studyDate,
    });
  } catch (err) {
    console.error("Study hours logging error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to log study hours" },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve study hours for a user for the current week
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEMO_USER_ID;

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabaseServer()
      .from("streak_log")
      .select("*")
      .eq("user_id", userId)
      .gte("date", weekAgo.toISOString().split("T")[0])
      .lte("date", today.toISOString().split("T")[0]);

    if (error) throw error;

    // Calculate total minutes and format as hours
    const totalMinutes = (data || []).reduce((sum, record) => sum + record.minutes_studied, 0);
    const totalHours = totalMinutes / 60;

    return NextResponse.json({
      userId,
      weekStart: weekAgo.toISOString().split("T")[0],
      weekEnd: today.toISOString().split("T")[0],
      totalHours: parseFloat(totalHours.toFixed(1)),
      dailyBreakdown: data || [],
    });
  } catch (err) {
    console.error("Fetch study hours error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch study hours" },
      { status: 500 }
    );
  }
}
