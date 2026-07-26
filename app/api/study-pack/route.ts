import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateStudyPack,
  generateGuidedNotes,
  generatePracticeQuestions,
  generateVideoScript,
} from "@/lib/gemma";
import { supabaseServer } from "@/lib/supabase";

const StudyPackInput = z.object({
  topicId: z.string(),
  topic: z.string().min(1),
  sourceText: z.string().min(1), // pasted lecture notes / transcript
  mode: z
    .enum(["study-pack", "guided-notes", "practice", "quiz", "video-script"])
    .default("study-pack"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = StudyPackInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { topicId, topic, sourceText, mode } = parsed.data;

  try {
    let result: any;

    switch (mode) {
      case "study-pack":
        result = await generateStudyPack(topic, sourceText);
        break;

      case "guided-notes":
        result = await generateGuidedNotes(topic, sourceText);
        break;

      case "practice":
        result = await generatePracticeQuestions(topic, sourceText);
        break;

      case "quiz":
        // Quiz mode returns MCQs from study pack
        const studyPackResult = await generateStudyPack(topic, sourceText);
        result = { mcqs: studyPackResult.mcqs };
        break;

      case "video-script":
        result = await generateVideoScript(topic, sourceText);
        break;

      default:
        return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
    }

    // Persist to study_packs table
    const { error } = await supabaseServer()
      .from("study_packs")
      .upsert({ topic_id: topicId, ...result });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ topicId, mode, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
