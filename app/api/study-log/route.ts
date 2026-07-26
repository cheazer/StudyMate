import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";

const StudyLogInput = z.object({
  courseName: z.string().min(1),
  topicId: z.string().optional(),
  minutesStudied: z.number().min(1),
  studiedAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = StudyLogInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { courseName, topicId, minutesStudied, studiedAt } = parsed.data;

  // For now, use a fixed user ID. In production, this would come from auth.
  // The app can be updated once Supabase auth is fully wired.
  const userId = "demo-user";
  const date = studiedAt
    ? new Date(studiedAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  try {
    // Log to streak_log table
    const { data, error } = await supabaseServer()
      .from("streak_log")
      .insert({ user_id: userId, date, minutes_studied: minutesStudied })
      .select()
      .single();

    if (error) throw error;

    // Update topic's last_touched if topicId provided
    if (topicId) {
      await supabaseServer()
        .from("topics")
        .update({ last_touched: new Date().toISOString() })
        .eq("id", topicId);
    }

    return NextResponse.json({
      success: true,
      message: `Logged ${minutesStudied} minutes for ${courseName}`,
      date,
      minutesStudied,
      entry: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to log study time";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseName = searchParams.get("courseName");

  if (!courseName) {
    return NextResponse.json(
      { error: "courseName parameter required" },
      { status: 400 }
    );
  }

  const userId = "demo-user";
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  try {
    // Get today's study log for the course
    const { data, error } = await supabaseServer()
      .from("streak_log")
      .select("*")
      .eq("user_id", userId)
      .eq("date", todayStr);

    if (error) throw error;

    const todayMinutes = data?.reduce((sum, entry) => sum + entry.minutes_studied, 0) || 0;

    return NextResponse.json({
      courseName,
      date: todayStr,
      todayMinutes,
      todayHours: parseFloat((todayMinutes / 60).toFixed(2)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch study log";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
