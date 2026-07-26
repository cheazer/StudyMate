import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";

const ProfileInput = z.object({
  courseName: z.string().min(1),
  weeklyGoalHours: z.number().min(1).max(80),
  biggestChallenge: z.string().min(1),
  preferredStudyTime: z.enum(["morning", "afternoon", "evening", "late-night"]),
  preferredFormat: z.enum(["video", "reading", "practice", "mixed"]),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ProfileInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // TODO: replace with the authenticated user's id once Supabase auth is wired up
  const { data, error } = await supabaseServer()
    .from("profiles")
    .insert({
      course_name: parsed.data.courseName,
      weekly_goal_hours: parsed.data.weeklyGoalHours,
      biggest_challenge: parsed.data.biggestChallenge,
      preferred_study_time: parsed.data.preferredStudyTime,
      preferred_format: parsed.data.preferredFormat,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
