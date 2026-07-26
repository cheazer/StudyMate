// Server-only helper shared by the topic detail and chat routes: loads a
// topic plus the combined extracted text of its parent course's uploaded
// material, which is what grounds both the study workspace and the chatbot.
import { supabaseServer } from "@/lib/supabase";

export interface TopicContext {
  topic: { id: string; title: string; courseId: string; courseName: string };
  sourceText: string;
}

export async function loadTopicContext(topicId: string): Promise<TopicContext | null> {
  const { data: topic, error: topicError } = await supabaseServer()
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .maybeSingle();
  if (topicError) throw topicError;
  if (!topic) return null;

  const { data: materials, error: materialsError } = await supabaseServer()
    .from("course_materials")
    .select("filename, extracted_text")
    .eq("course_id", topic.course_id);
  if (materialsError) throw materialsError;

  const sourceText = (materials ?? [])
    .map((m) => `# ${m.filename}\n${m.extracted_text}`)
    .join("\n\n");

  return {
    topic: {
      id: topic.id,
      title: topic.title,
      courseId: topic.course_id,
      courseName: topic.course_name,
    },
    sourceText,
  };
}
