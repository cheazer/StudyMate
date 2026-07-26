import { NextResponse } from "next/server";
import { z } from "zod";
import { generateRoadmap } from "@/lib/gemma";
import { supabaseServer } from "@/lib/supabase";

const RoadmapInput = z.object({
  topicId: z.string(),
  topic: z.string().min(1),
  courseName: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = RoadmapInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { topicId, topic, courseName } = parsed.data;

  let result: Awaited<ReturnType<typeof generateRoadmap>>;
  try {
    result = await generateRoadmap(topic, courseName);
  } catch (error) {
    console.error("Roadmap generation failed", error);
    return NextResponse.json(
      { error: "Unable to generate a roadmap right now. Please try again." },
      { status: 502 }
    );
  }

  const milestones = result.milestones.map((m) => ({
    id: crypto.randomUUID(),
    title: m.title,
    estimatedMinutes: m.estimatedMinutes,
    done: false,
  }));

  // TODO: persist to the `roadmaps` table (see supabase/schema.sql)
  const { error } = await supabaseServer()
    .from("roadmaps")
    .upsert({ topic_id: topicId, milestones });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topicId, milestones });
}
