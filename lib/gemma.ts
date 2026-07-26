// Thin wrapper around the Gemma 4 REST endpoint (served via the Gemini API).
// Docs: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
//
// Verify field names against the current docs before the event in case
// anything shifted — this follows the documented pattern as of writing:
// POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
// auth via the `x-goog-api-key` header, JSON mode via generationConfig.

const GEMMA_MODEL = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent`;

interface CallGemmaJSONOptions {
  systemInstruction: string;
  prompt: string;
  responseSchema: object; // JSON schema describing the expected output shape
}

export async function callGemmaJSON<T>({
  systemInstruction,
  prompt,
  responseSchema,
}: CallGemmaJSONOptions): Promise<T> {
  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) throw new Error("GEMMA_API_KEY is not set");

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

  return JSON.parse(text) as T;
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

// --- Extended generation modes for course workspace -----------------------

const GUIDED_NOTES_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
    deeperExplanation: { type: "string" },
  },
  required: ["summary", "keyPoints", "deeperExplanation"],
};

export async function generateGuidedNotes(topic: string, sourceText: string) {
  return callGemmaJSON<{
    summary: string;
    keyPoints: string[];
    deeperExplanation: string;
  }>({
    systemInstruction:
      "You are a tutor creating structured guided notes. Provide a clear summary, " +
      "bullet-pointed key concepts, and a deeper explanation that builds intuition.",
    prompt: `Topic: ${topic}\nSource material:\n${sourceText}\n\nCreate comprehensive guided notes.`,
    responseSchema: GUIDED_NOTES_SCHEMA,
  });
}

const PRACTICE_QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          guidance: { type: "string" },
        },
        required: ["prompt", "guidance"],
      },
    },
  },
  required: ["questions"],
};

export async function generatePracticeQuestions(topic: string, sourceText: string) {
  return callGemmaJSON<{
    questions: Array<{ prompt: string; guidance: string }>;
  }>({
    systemInstruction:
      "You create open-ended practice questions that require students to apply knowledge. " +
      "Each question includes guidance on how to approach it.",
    prompt: `Topic: ${topic}\nSource material:\n${sourceText}\n\nGenerate 3-5 practice questions.`,
    responseSchema: PRACTICE_QUESTIONS_SCHEMA,
  });
}

const VIDEO_SCRIPT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    duration: { type: "number" },
    outline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          section: { type: "string" },
          duration: { type: "number" },
          content: { type: "string" },
        },
        required: ["section", "duration", "content"],
      },
    },
  },
  required: ["title", "duration", "outline"],
};

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
    prompt: `Topic: ${topic}\nSource material:\n${sourceText}\n\nCreate a video lesson outline. Total duration: 5-10 minutes.`,
    responseSchema: VIDEO_SCRIPT_SCHEMA,
  });
}
