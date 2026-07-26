import { NextResponse } from "next/server";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { randomUUID } from "crypto";
import { loadTopicContext } from "@/lib/topic-context";
import { generateManimScene } from "@/lib/gemma";

const execFilePromise = promisify(execFile);

const VideoInput = z.object({
  question: z.string().trim().min(1),
});

// Gemma is told to only ever emit `from manim import *`, but it's an LLM
// writing code we then run as a real subprocess — mirror the same allowlist
// check scripts/generate_manim_video.py does, so an unsafe script never even
// reaches the point of being written to disk from this route either.
const ALLOWED_IMPORT_LINE = /^\s*from\s+manim\s+import\s+\*\s*$/;

const FORBIDDEN_PATTERNS = [
  /__import__/,
  /\bopen\s*\(/,
  /\beval\s*\(/,
  /\bexec\s*\(/,
  /\bos\./,
  /\bsys\./,
  /\bsubprocess\b/,
  /\bsocket\b/,
  /\bshutil\b/,
  /\brequests\b/,
  /\bTex\s*\(/,
  /\bMathTex\s*\(/,
];

// Every `import`/`from` line must be exactly `from manim import *` — a plain
// substring check can't distinguish "no other imports" from that one
// legitimate line, since it also contains the word "import".
function hasDisallowedImport(code: string): boolean {
  return code.split("\n").some((line) => line.includes("import") && !ALLOWED_IMPORT_LINE.test(line));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;
  const body = await req.json();
  const parsed = VideoInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const context = await loadTopicContext(topicId);
    if (!context) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    const scene = await generateManimScene({
      topicTitle: context.topic.title,
      sourceText: context.sourceText,
      question: parsed.data.question,
    });

    const violation =
      hasDisallowedImport(scene.code) || FORBIDDEN_PATTERNS.some((pattern) => pattern.test(scene.code));
    if (violation) {
      return NextResponse.json(
        { error: "The generated scene didn't pass our safety check — try rephrasing the question." },
        { status: 422 }
      );
    }

    const outputName = `manim-${randomUUID()}`;
    const pythonScript = path.join(process.cwd(), "scripts", "generate_manim_video.py");
    const inputData = { code: scene.code, className: scene.className, outputName };

    const { stdout } = await execFilePromise(
      process.env.MANIM_PYTHON || "python",
      [pythonScript, JSON.stringify(inputData)],
      { timeout: 200_000, maxBuffer: 10 * 1024 * 1024 }
    );

    const result = JSON.parse(stdout);
    if (!result.success) throw new Error(result.error || "Video generation failed");

    return NextResponse.json({
      videoUrl: `/${result.video_path}`,
      explanation: scene.explanation,
    });
  } catch (err) {
    console.error("[Manim video] Error:", err);

    const message = err instanceof Error ? err.message : "Failed to generate video";
    if (message.includes("No module named") || message.includes("ModuleNotFoundError")) {
      return NextResponse.json(
        { error: "Manim isn't installed on the server. Install it with: pip install manim" },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
