import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";
import type { Course } from "@/lib/types";

export async function GET() {
  try {
    const [{ data: courses, error: coursesError }, { data: topics, error: topicsError }] =
      await Promise.all([
        supabaseServer().from("courses").select("*").order("created_at", { ascending: false }),
        supabaseServer().from("topics").select("id, course_id"),
      ]);

    if (coursesError) throw coursesError;
    if (topicsError) throw topicsError;

    const topicCounts = new Map<string, number>();
    for (const t of topics ?? []) {
      if (!t.course_id) continue;
      topicCounts.set(t.course_id, (topicCounts.get(t.course_id) ?? 0) + 1);
    }

    const result: Course[] = (courses ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      topicCount: topicCounts.get(c.id) ?? 0,
      createdAt: c.created_at,
      analyzedAt: c.analyzed_at,
    }));

    return NextResponse.json({ courses: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load courses";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const CreateCourseInput = z.object({ name: z.string().trim().min(1) });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateCourseInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabaseServer()
    .from("courses")
    .insert({ name: parsed.data.name })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const course: Course = {
    id: data.id,
    name: data.name,
    topicCount: 0,
    createdAt: data.created_at,
    analyzedAt: data.analyzed_at,
  };
  return NextResponse.json({ course });
}
