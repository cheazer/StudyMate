import { NextResponse } from "next/server";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execPromise = promisify(exec);

const GenerateVideoInput = z.object({
  title: z.string().min(1),
  script: z.string().min(1),
  outputName: z.string().optional(),
});

/**
 * POST: Generate a video from a script with TTS
 * 
 * Uses Python backend (scripts/video_generator.py) with:
 * - MoviePy for video composition
 * - Google Cloud Text-to-Speech for narration
 * - MoviePy for video rendering
 */
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = GenerateVideoInput.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, script, outputName } = parsed.data;

  try {
    console.log(`[Video Generation] Starting: ${title}`);

    // Prepare Python script path
    const pythonScript = path.join(process.cwd(), "scripts", "video_generator.py");

    // Prepare input JSON for Python script
    const inputData = {
      title,
      script,
      output_name: outputName || `${title.replace(/\s+/g, "_")}.mp4`,
    };

    // Call Python script
    const command = `python "${pythonScript}" '${JSON.stringify(inputData).replace(/'/g, "'\\''")}'`;

    console.log(`[Video Generation] Executing: ${command}`);

    const { stdout, stderr } = await execPromise(command, {
      timeout: 600000, // 10 minute timeout for video generation
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (stderr && !stderr.includes("UserWarning")) {
      console.error("[Video Generation] stderr:", stderr);
    }

    // Parse Python output
    const result = JSON.parse(stdout);

    if (!result.success) {
      throw new Error(result.error || "Video generation failed");
    }

    console.log(`[Video Generation] Success: ${result.video_path}`);

    return NextResponse.json({
      success: true,
      title,
      videoPath: result.video_path,
      message: "Video generated successfully with TTS narration",
    });
  } catch (err) {
    console.error("[Video Generation] Error:", err);

    // Check if it's a Python dependency issue
    if (
      err instanceof Error &&
      (err.message.includes("No module named") || err.message.includes("ModuleNotFoundError"))
    ) {
      return NextResponse.json(
        {
          error: "Missing Python dependencies. Install with: pip install moviepy google-cloud-text-to-speech",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate video" },
      { status: 500 }
    );
  }
}

/**
 * Alternative: Lightweight version that just returns a video URL
 * (for demo purposes without waiting for full video generation)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Study Video";

  return NextResponse.json({
    message: "Video generation started",
    videoUrl: `/videos/${title.replace(/\s+/g, "_")}.mp4`,
    estimatedTime: "5-10 minutes for most videos",
  });
}
