import { NextResponse } from "next/server";
import { z } from "zod";
import { generateStudyPack } from "@/lib/gemma";
import { supabaseServer } from "@/lib/supabase";

const StudyPackInput = z.object({
  topicId: z.string(),
  topic: z.string().min(1),
  sourceText: z.string().min(1), // pasted lecture notes / transcript
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = StudyPackInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { topicId, topic, sourceText } = parsed.data;

  const result = await generateStudyPack(topic, sourceText);

  // TODO: persist to the `study_packs` table (see supabase/schema.sql)
  const { error } = await supabaseServer()
    .from("study_packs")
    .upsert({ topic_id: topicId, ...result });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topicId, ...result });
}
