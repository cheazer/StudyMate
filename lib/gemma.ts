// Thin wrapper around the Gemma 4 REST endpoint (served via the Gemini API).
// Docs: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
//
// Verify field names against the current docs before the event in case
// anything shifted — this follows the documented pattern as of writing:
// POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
// auth via the `x-goog-api-key` header, JSON mode via generationConfig.
//
// IMPORTANT, learned by hitting the live endpoint directly:
// - This is a "thinking" model. Every response's `parts` array can contain
//   multiple entries, and the reasoning trace comes back as its own part(s)
//   marked `thought: true` *before* the real answer part. Reading parts[0]
//   blindly gets you the internal monologue, not the answer.
// - `generationConfig.responseSchema` (grammar-constrained decoding) is
//   unreliable on this model: reproduced both a >90s hang and a degenerate
//   infinite-repetition response. Do not use it. `responseMimeType:
//   "application/json"` plus describing the exact shape in the prompt text
//   is reliable instead — verified clean, parseable JSON on repeated tries.
// - `generationConfig.thinkingConfig` is rejected outright for this model
//   ("Thinking budget is not supported for this model"), so the ~15-30s
//   thinking latency is a fixed cost, not something to configure away.
//   Callers should combine what would otherwise be multiple round trips
//   into one call, and UI should set expectations for the wait.

// Models available through the Gemini API as of July 2026 include
// gemma-4-26b-a4b-it and gemma-4-31b-it. Keep the default aligned with the
// sample environment file so an unset configuration still works.
const GEMMA_MODEL = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent`;

// Bounds how much raw source text (PDF extracts, lecture notes, etc.) gets
// interpolated into a single prompt. Keeps latency/cost predictable on a
// model that already spends a lot of tokens thinking before it answers.
const MAX_SOURCE_CHARS = 12_000;

export function truncateSource(text: string): string {
  if (text.length <= MAX_SOURCE_CHARS) return text;
  return text.slice(0, MAX_SOURCE_CHARS) + "\n...[truncated]";
}

interface GemmaPart {
  text?: string;
  thought?: boolean;
}

interface CallGemmaJSONOptions {
  systemInstruction: string;
  prompt: string;
}

/**
 * JSON mode is a strong hint, but models can still append a second JSON value
 * or wrap the response in a Markdown fence. Parse the first complete JSON
 * value rather than letting that extra text take down the request.
 */
function parseGemmaJSON<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned) as T;
  } catch (initialError) {
    const start = cleaned.search(/[\[{]/);
    if (start === -1) throw initialError;

    const opening = cleaned[start];
    const closing = opening === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < cleaned.length; index += 1) {
      const character = cleaned[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }

      if (character === '"') inString = true;
      else if (character === opening) depth += 1;
      else if (character === closing && --depth === 0) {
        return JSON.parse(cleaned.slice(start, index + 1)) as T;
      }
    }

    throw initialError;
  }
}

/**
 * Pulls the real answer out of a Gemma response, skipping thinking-trace
 * parts. Falls back to every part's text if nothing is explicitly marked
 * `thought` (e.g. non-thinking models), so this stays safe either way.
 */
function extractAnswerText(parts: GemmaPart[]): string {
  const answerParts = parts.filter((p) => !p.thought && p.text);
  const source = answerParts.length > 0 ? answerParts : parts;
  return source.map((p) => p.text ?? "").join("");
}

export async function callGemmaJSON<T>({
  systemInstruction,
  prompt,
}: CallGemmaJSONOptions): Promise<T> {
  // GEMINI_API_KEY is the standard name used by Google AI Studio. Keep the
  // older GEMMA_API_KEY name working so existing deployments do not break.
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GEMMA_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemma request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const parts: GemmaPart[] = data.candidates?.[0]?.content?.parts ?? [];
  const text = extractAnswerText(parts);
  if (!text) throw new Error("Gemma response had no text part");

  return parseGemmaJSON<T>(text);
}

// --- Feature-specific calls -------------------------------------------------

const JSON_ONLY_INSTRUCTION =
  "Respond with ONLY valid JSON, no markdown fences, no commentary — just the JSON value.";

export async function generateRoadmap(topic: string, courseName: string) {
  return callGemmaJSON<{ milestones: { title: string; estimatedMinutes: number }[] }>({
    systemInstruction:
      "You are a study planning assistant. Break a topic into a short, ordered " +
      "sequence of concrete study milestones a student can complete in single " +
      "sittings. Be specific, not generic — reference sub-concepts by name.",
    prompt:
      `Course: ${courseName}\nTopic: ${topic}\nGenerate a study roadmap.\n\n` +
      `${JSON_ONLY_INSTRUCTION} Shape: {"milestones": [{"title": string, "estimatedMinutes": number}]}`,
  });
}

export async function generateStudyPack(topic: string, sourceText: string) {
  return callGemmaJSON<{
    notes: string;
    flashcards: { front: string; back: string }[];
    mcqs: { question: string; choices: string[]; correctIndex: number }[];
  }>({
    systemInstruction:
      "You turn raw lecture notes into a compact study pack: a short summary, " +
      "flashcards for key facts/definitions, and multiple-choice questions that " +
      "test understanding, not just recall.",
    prompt:
      `Topic: ${topic}\nSource notes:\n${truncateSource(sourceText)}\n\n` +
      `${JSON_ONLY_INSTRUCTION} Shape: {"notes": string, ` +
      `"flashcards": [{"front": string, "back": string}], ` +
      `"mcqs": [{"question": string, "choices": string[], "correctIndex": number}]}`,
  });
}

// --- Extended generation modes for course workspace -----------------------

export async function generateGuidedNotes(topic: string, sourceText: string) {
  return callGemmaJSON<{
    summary: string;
    keyPoints: string[];
    deeperExplanation: string;
  }>({
    systemInstruction:
      "You are a tutor creating structured guided notes. Provide a clear summary, " +
      "bullet-pointed key concepts, and a deeper explanation that builds intuition.",
    prompt:
      `Topic: ${topic}\nSource material:\n${truncateSource(sourceText)}\n\n` +
      `Create comprehensive guided notes.\n\n${JSON_ONLY_INSTRUCTION} Shape: ` +
      `{"summary": string, "keyPoints": string[], "deeperExplanation": string}`,
  });
}

export async function generatePracticeQuestions(topic: string, sourceText: string) {
  return callGemmaJSON<{
    questions: Array<{ prompt: string; guidance: string }>;
  }>({
    systemInstruction:
      "You create open-ended practice questions that require students to apply knowledge. " +
      "Each question includes guidance on how to approach it.",
    prompt:
      `Topic: ${topic}\nSource material:\n${truncateSource(sourceText)}\n\n` +
      `Generate 3-5 practice questions.\n\n${JSON_ONLY_INSTRUCTION} Shape: ` +
      `{"questions": [{"prompt": string, "guidance": string}]}`,
  });
}

export async function generateVideoScript(topic: string, sourceText: string) {
  return callGemmaJSON<{
    title: string;
    duration: number;
    outline: Array<{ section: string; duration: number; content: string }>;
  }>({
    systemInstruction:
      "You create lesson scripts and outlines for educational videos. Structure them into " +
      "clear sections with estimated durations and detailed content points. " +
      "Total video should be 5-10 minutes.",
    prompt:
      `Topic: ${topic}\nSource material:\n${truncateSource(sourceText)}\n\n` +
      `Create a video lesson outline. Total duration: 5-10 minutes.\n\n${JSON_ONLY_INSTRUCTION} Shape: ` +
      `{"title": string, "duration": number, "outline": [{"section": string, "duration": number, "content": string}]}`,
  });
}

// --- Course material analysis (PDF upload -> roadmap/mindmap) -------------

export async function analyzeCourseMaterial(courseName: string, combinedText: string) {
  return callGemmaJSON<{
    subtopics: { title: string; summary: string }[];
    milestones: { title: string; estimatedMinutes: number }[];
  }>({
    systemInstruction:
      "You analyze uploaded course material (lecture notes, slides) and extract " +
      "structured study content. Be specific to the material provided, not generic " +
      "— reference the actual concepts, names, and terms that appear in the text.",
    prompt:
      `Course: ${courseName}\n\nSource material:\n${truncateSource(combinedText)}\n\n` +
      `Identify the main subtopics covered and produce a short study roadmap.\n\n` +
      `${JSON_ONLY_INSTRUCTION} Shape: {"subtopics": [{"title": string, "summary": string}], ` +
      `"milestones": [{"title": string, "estimatedMinutes": number}]}`,
  });
}

// --- Per-topic study chatbot ------------------------------------------------

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export async function chatAboutMaterial({
  courseName,
  topicTitle,
  sourceText,
  history,
  message,
}: {
  courseName: string;
  topicTitle: string;
  sourceText: string;
  history: ChatTurn[];
  message: string;
}) {
  // Cap history so the prompt doesn't grow unbounded across a long chat —
  // recent turns carry almost all the useful context anyway.
  const recentHistory = history.slice(-6);
  const historyText = recentHistory
    .map((t) => `${t.role === "user" ? "Student" : "Tutor"}: ${t.text}`)
    .join("\n");

  const response = await callGemmaJSON<{ answer: string }>({
    systemInstruction:
      `You are a patient study tutor for the course "${courseName}", helping with the ` +
      `topic "${topicTitle}". Answer using the source material below when it's relevant; ` +
      "if the material doesn't cover something, say so plainly rather than guessing.",
    prompt:
      `Source material:\n${truncateSource(sourceText)}\n\n` +
      (historyText ? `Conversation so far:\n${historyText}\n\n` : "") +
      `Student: ${message}\n\n` +
      `${JSON_ONLY_INSTRUCTION} Shape: {"answer": string}`,
  });

  return response.answer;
}

// --- Manim video generation for visual/video learners ----------------------

/**
 * Asks Gemma for a self-contained Manim scene that visually answers a
 * student's question. Constrained hard against Tex/MathTex (requires a local
 * LaTeX install we can't assume is present) and against anything beyond
 * `from manim import *` — the generated code runs as a real Python subprocess
 * (see scripts/generate_manim_video.py), so the prompt (and a second
 * allowlist check in that script) both need to keep it to drawing primitives
 * only, no filesystem/network/process access.
 */
export async function generateManimScene({
  topicTitle,
  sourceText,
  question,
}: {
  topicTitle: string;
  sourceText: string;
  question: string;
}) {
  return callGemmaJSON<{ className: string; explanation: string; code: string }>({
    systemInstruction:
      "You are a Manim Community Edition expert who creates short (15-30 second) " +
      "educational animations that visually answer a student's question. Rules, no exceptions:\n" +
      "1. Output ONE Python class that subclasses `Scene`, named in PascalCase.\n" +
      "2. The only import allowed is `from manim import *` — no other imports of any kind.\n" +
      "3. Never use Tex(...) or MathTex(...) (no local LaTeX install can be assumed). " +
      "Use Text(...) and MathTex-free shapes (Circle, Square, Line, Arrow, Axes, Dot, " +
      "NumberPlane, etc.) to represent math instead — e.g. spell expressions out with Text.\n" +
      "4. Never reference files, the network, environment variables, or subprocesses.\n" +
      "5. Keep it simple and renderable: a handful of mobjects and animations (Create, " +
      "Write, Transform, FadeIn/FadeOut, self.play, self.wait) — this must render in " +
      "well under a minute.",
    prompt:
      `Topic: ${topicTitle}\nSource material (may or may not be relevant):\n` +
      `${truncateSource(sourceText)}\n\nStudent's question: ${question}\n\n` +
      `Write a Manim scene that visually explains the answer.\n\n${JSON_ONLY_INSTRUCTION} Shape: ` +
      `{"className": string, "explanation": string, "code": string}\n` +
      `"code" is the complete Python source (the class definition and its imports, as one string ` +
      `with real newlines escaped as \\n). "explanation" is a one-paragraph plain-text answer to ` +
      `show alongside the video.`,
  });
}
