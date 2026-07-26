import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";
import { rowToTopic, rowToSuggestions } from "@/lib/mappers";

const AddTopicInput = z.union([
  z.object({ fromSuggestionIndex: z.number().int().min(0) }),
  z.object({ title: z.string().trim().min(1) }),
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const body = await req.json();
  const parsed = AddTopicInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: course, error: courseError } = await supabaseServer()
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  let title: string;
  let remainingSuggestions = course.suggested_subtopics ?? [];

  if ("fromSuggestionIndex" in parsed.data) {
    const index = parsed.data.fromSuggestionIndex;
    const suggestions = (course.suggested_subtopics ?? []) as { title: string; summary: string }[];
    const suggestion = suggestions[index];
    if (!suggestion) {
      return NextResponse.json({ error: "That suggestion no longer exists" }, { status: 400 });
    }
    title = suggestion.title;
    remainingSuggestions = suggestions.filter((_, i) => i !== index);
  } else {
    title = parsed.data.title;
  }

  const { data: topic, error: insertError } = await supabaseServer()
    .from("topics")
    .insert({ course_id: courseId, course_name: course.name, title, category: "other" })
    .select()
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const { error: updateError } = await supabaseServer()
    .from("courses")
    .update({ suggested_subtopics: remainingSuggestions })
    .eq("id", courseId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    topic: rowToTopic(topic),
    suggestedSubtopics: rowToSuggestions(remainingSuggestions),
  });
}
