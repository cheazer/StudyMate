import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: { courseName: string } }
) {
  const courseName = decodeURIComponent(params.courseName);
  const userId = "demo-user";

  try {
    // Fetch all topics for this course
    const { data: topics, error: topicsError } = await supabaseServer()
      .from("topics")
      .select("*")
      .eq("course_name", courseName);

    if (topicsError) throw topicsError;

    // Fetch latest study packs for topics in this course
    const { data: studyPacks, error: studyPacksError } = await supabaseServer()
      .from("study_packs")
      .select("*")
      .in("topic_id", topics?.map((t) => t.id) || [])
      .order("created_at", { ascending: false })
      .limit(3);

    if (studyPacksError) throw studyPacksError;

    // Fetch recent attempts for this course's topics
    const { data: attempts, error: attemptsError } = await supabaseServer()
      .from("attempts")
      .select("*")
      .in("topic_id", topics?.map((t) => t.id) || [])
      .order("attempted_at", { ascending: false })
      .limit(5);

    if (attemptsError) throw attemptsError;

    // Get today's study minutes
    const today = new Date().toISOString().split("T")[0];
    const { data: todayLog, error: logError } = await supabaseServer()
      .from("streak_log")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today);

    if (logError) throw logError;

    const todayMinutes = todayLog?.reduce((sum, entry) => sum + entry.minutes_studied, 0) || 0;

    // Calculate progress
    const completedCount = topics?.filter((t) => (t.progress_percent || 0) >= 100).length || 0;
    const currentProgress = topics && topics.length > 0 
      ? Math.round((completedCount / topics.length) * 100)
      : 0;

    return NextResponse.json({
      courseName,
      topicCount: topics?.length || 0,
      currentProgress,
      topics: topics || [],
      recentStudyPacks: studyPacks || [],
      recentAttempts: attempts || [],
      todayStudyMinutes: todayMinutes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch course summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
