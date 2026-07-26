import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { extractPdfText } from "@/lib/pdf";
import { analyzeCourseMaterial } from "@/lib/gemma";
import { rowToSuggestions, rowToMilestones } from "@/lib/mappers";

// PDF parsing needs the Node runtime (pdf-parse is not edge-compatible).
export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  const { data: course, error: courseError } = await supabaseServer()
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  let file: File | null;
  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with a 'file' field" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractPdfText(buffer);

    if (!extractedText) {
      return NextResponse.json(
        { error: "Couldn't extract any text from that PDF — is it a scanned image?" },
        { status: 422 }
      );
    }

    const { error: insertError } = await supabaseServer().from("course_materials").insert({
      course_id: courseId,
      filename: file.name,
      extracted_text: extractedText,
      char_count: extractedText.length,
    });
    if (insertError) throw insertError;

    const { data: materials, error: materialsError } = await supabaseServer()
      .from("course_materials")
      .select("filename, extracted_text")
      .eq("course_id", courseId);
    if (materialsError) throw materialsError;

    const combinedText = (materials ?? [])
      .map((m) => `# ${m.filename}\n${m.extracted_text}`)
      .join("\n\n");

    const analysis = await analyzeCourseMaterial(course.name, combinedText);

    const { data: existingTopics, error: existingTopicsError } = await supabaseServer()
      .from("topics")
      .select("title")
      .eq("course_id", courseId);
    if (existingTopicsError) throw existingTopicsError;

    const existingTitles = new Set((existingTopics ?? []).map((t) => t.title.toLowerCase().trim()));
    const freshSuggestions = analysis.subtopics.filter(
      (s) => !existingTitles.has(s.title.toLowerCase().trim())
    );

    const milestones = analysis.milestones.map((m) => ({
      id: crypto.randomUUID(),
      title: m.title,
      estimatedMinutes: m.estimatedMinutes,
      done: false,
    }));

    const { error: updateError } = await supabaseServer()
      .from("courses")
      .update({
        suggested_subtopics: freshSuggestions,
        roadmap: milestones,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", courseId);
    if (updateError) throw updateError;

    return NextResponse.json({
      suggestedSubtopics: rowToSuggestions(freshSuggestions),
      roadmap: rowToMilestones(milestones),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to analyze material";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
