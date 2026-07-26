// Thin wrapper around the Gemma 4 REST endpoint (served via the Gemini API).
// Docs: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
//
// Verify field names against the current docs before the event in case
// anything shifted — this follows the documented pattern as of writing:
// POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
// auth via the `x-goog-api-key` header, JSON mode via generationConfig.

// Models available through the Gemini API as of July 2026 include
// gemma-4-26b-a4b-it and gemma-4-31b-it. Keep the default aligned with the
// sample environment file so an unset configuration still works.
const GEMMA_MODEL = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent`;

interface CallGemmaJSONOptions {
  systemInstruction: string;
  prompt: string;
  responseSchema: object; // JSON schema describing the expected output shape
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

export async function callGemmaJSON<T>({
  systemInstruction,
  prompt,
  responseSchema,
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
        responseSchema,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemma request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemma response had no text part");

  return parseGemmaJSON<T>(text);
}

// --- Feature-specific calls -------------------------------------------------

const ROADMAP_SCHEMA = {
  type: "object",
  properties: {
    milestones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          estimatedMinutes: { type: "number" },
        },
        required: ["title", "estimatedMinutes"],
      },
    },
  },
  required: ["milestones"],
};

export async function generateRoadmap(topic: string, courseName: string) {
  return callGemmaJSON<{ milestones: { title: string; estimatedMinutes: number }[] }>({
    systemInstruction:
      "You are a study planning assistant. Break a topic into a short, ordered " +
      "sequence of concrete study milestones a student can complete in single " +
      "sittings. Be specific, not generic — reference sub-concepts by name.",
    prompt: `Course: ${courseName}\nTopic: ${topic}\nGenerate a study roadmap.`,
    responseSchema: ROADMAP_SCHEMA,
  });
}

const STUDY_PACK_SCHEMA = {
  type: "object",
  properties: {
    notes: { type: "string" },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: { front: { type: "string" }, back: { type: "string" } },
        required: ["front", "back"],
      },
    },
    mcqs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          correctIndex: { type: "number" },
        },
        required: ["question", "choices", "correctIndex"],
      },
    },
  },
  required: ["notes", "flashcards", "mcqs"],
};

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
    prompt: `Topic: ${topic}\nSource notes:\n${sourceText}`,
    responseSchema: STUDY_PACK_SCHEMA,
  });
}
