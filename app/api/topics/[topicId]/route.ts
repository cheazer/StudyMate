import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { loadTopicContext } from "@/lib/topic-context";
import type { TopicDetail } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;

  try {
    const context = await loadTopicContext(topicId);
    if (!context) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    const { data: note, error: noteError } = await supabaseServer()
      .from("notes")
      .select("content")
      .eq("topic_id", topicId)
      .maybeSingle();
    if (noteError) throw noteError;

    const detail: TopicDetail = {
      id: context.topic.id,
      courseId: context.topic.courseId,
      courseName: context.topic.courseName,
      title: context.topic.title,
      sourceText: context.sourceText,
      note: note?.content ?? "",
    };

    return NextResponse.json(detail);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load topic";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
