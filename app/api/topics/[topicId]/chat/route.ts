import { NextResponse } from "next/server";
import { z } from "zod";
import { loadTopicContext } from "@/lib/topic-context";
import { chatAboutMaterial } from "@/lib/gemma";

const ChatInput = z.object({
  message: z.string().trim().min(1),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() }))
    .optional()
    .default([]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;
  const body = await req.json();
  const parsed = ChatInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const context = await loadTopicContext(topicId);
    if (!context) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    const answer = await chatAboutMaterial({
      courseName: context.topic.courseName,
      topicTitle: context.topic.title,
      sourceText: context.sourceText,
      history: parsed.data.history,
      message: parsed.data.message,
    });

    return NextResponse.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get a response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
