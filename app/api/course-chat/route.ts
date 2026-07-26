import { NextResponse } from "next/server";
import { z } from "zod";
import { callGemmaJSON } from "@/lib/gemma";

const CourseChatInput = z.object({
  courseName: z.string().min(1),
  message: z.string().min(1),
  conversationContext: z.array(z.any()).optional(),
});

type ContentType = "notes" | "video" | "questions" | null;

/**
 * Detects what type of content the user wants to generate
 */
function detectContentType(message: string): ContentType {
  const lower = message.toLowerCase();

  if (
    lower.includes("note") ||
    lower.includes("summary") ||
    lower.includes("explain") ||
    lower.includes("teach")
  ) {
    return "notes";
  }

  if (lower.includes("video") || lower.includes("watch") || lower.includes("demonstrate")) {
    return "video";
  }

  if (
    lower.includes("question") ||
    lower.includes("quiz") ||
    lower.includes("practice") ||
    lower.includes("exercise")
  ) {
    return "questions";
  }

  return null;
}

/**
 * Generate guided notes using Gemma
 */
async function generateNotes(topic: string, courseName: string): Promise<string> {
  const response = await callGemmaJSON<{ notes: string }>({
    systemInstruction: `You are a study guide expert for ${courseName}. Create clear, structured study notes that are easy to understand and remember. Use examples where helpful.`,
    prompt: `Generate comprehensive study notes for: ${topic}`,
    responseSchema: {
      type: "object",
      properties: { notes: { type: "string" } },
      required: ["notes"],
    },
  });

  return response.notes;
}

/**
 * Generate practice questions using Gemma
 */
async function generateQuestions(topic: string, courseName: string): Promise<string> {
  const response = await callGemmaJSON<{ questions: string }>({
    systemInstruction: `You are a ${courseName} instructor. Create challenging practice questions that test deep understanding, not just memorization.`,
    prompt: `Generate 5 practice questions for: ${topic}`,
    responseSchema: {
      type: "object",
      properties: { questions: { type: "string" } },
      required: ["questions"],
    },
  });

  return response.questions;
}

/**
 * Generate video script using Gemma
 */
async function generateVideoScript(topic: string, courseName: string): Promise<string> {
  const response = await callGemmaJSON<{ script: string }>({
    systemInstruction: `You are a video script writer for ${courseName} educational videos. Write a clear, engaging script that explains concepts simply. The video will be 5-10 minutes. Include visual descriptions [like this] for animations or diagrams.`,
    prompt: `Write a video script for: ${topic}`,
    responseSchema: {
      type: "object",
      properties: { script: { type: "string" } },
      required: ["script"],
    },
  });

  return response.script;
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CourseChatInput.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { courseName, message } = parsed.data;

  try {
    // Detect what type of content user wants
    const contentType = detectContentType(message);

    // Extract the topic from the message
    const topicMatch = message.match(/(?:about|on|for)\s+(.+?)(?:\?|$)/i);
    const topic = topicMatch ? topicMatch[1] : message.replace(/^(create|generate|make|write).+?\s+/i, "");

    let content = "";
    let responseText = "";

    if (contentType === "notes") {
      content = await generateNotes(topic, courseName);
      responseText = `I've created comprehensive study notes on "${topic}". Here's what I included:

${content.substring(0, 300)}...

Click "📖 Read Notes" to view the full document.`;
    } else if (contentType === "video") {
      content = await generateVideoScript(topic, courseName);
      responseText = `I've created a video script for "${topic}" with visual descriptions and narration. The video will be generated with:
- Clear explanations with examples
- Animated diagrams and visualizations  
- Professional narration using text-to-speech
- Estimated length: 5-10 minutes

Click "▶ Watch Video" to generate and view the video.`;
    } else if (contentType === "questions") {
      content = await generateQuestions(topic, courseName);
      responseText = `I've created practice questions on "${topic}" to test your understanding:

${content.substring(0, 300)}...

Click "Start Quiz" to answer these questions and get feedback.`;
    } else {
      // General response
      const generalResponse = await callGemmaJSON<{ response: string }>({
        systemInstruction: `You are a helpful study assistant for ${courseName}. Provide concise, helpful responses.`,
        prompt: message,
        responseSchema: {
          type: "object",
          properties: { response: { type: "string" } },
          required: ["response"],
        },
      });

      return NextResponse.json({
        text: generalResponse.response,
        contentType: null,
      });
    }

    return NextResponse.json({
      text: responseText,
      contentType,
      content,
    });
  } catch (err) {
    console.error("Course chat error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate content" },
      { status: 500 }
    );
  }
}
