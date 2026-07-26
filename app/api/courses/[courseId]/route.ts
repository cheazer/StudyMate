import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { rowToTopic, rowToMilestones, rowToSuggestions } from "@/lib/mappers";
import { DEMO_USER_ID } from "@/lib/constants";
import type { CourseDetail } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const userId = DEMO_USER_ID;

  try {
    const [
      { data: course, error: courseError },
      { data: topics, error: topicsError },
      { data: materials, error: materialsError },
    ] = await Promise.all([
      supabaseServer().from("courses").select("*").eq("id", courseId).maybeSingle(),
      supabaseServer().from("topics").select("*").eq("course_id", courseId),
      supabaseServer().from("course_materials").select("id").eq("course_id", courseId),
    ]);

    if (courseError) throw courseError;
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (topicsError) throw topicsError;
    if (materialsError) throw materialsError;

    const today = new Date().toISOString().split("T")[0];
    const { data: todayLog, error: logError } = await supabaseServer()
      .from("streak_log")
      .select("minutes_studied")
      .eq("user_id", userId)
      .eq("date", today);
    if (logError) throw logError;

    const todayStudyMinutes = todayLog?.reduce((sum, entry) => sum + entry.minutes_studied, 0) || 0;

    const detail: CourseDetail = {
      id: course.id,
      name: course.name,
      materialCount: materials?.length ?? 0,
      analyzedAt: course.analyzed_at,
      suggestedSubtopics: rowToSuggestions(course.suggested_subtopics),
      roadmap: rowToMilestones(course.roadmap),
      topics: (topics ?? []).map(rowToTopic),
      todayStudyMinutes,
    };

    return NextResponse.json(detail);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch course";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
