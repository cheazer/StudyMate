"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import type { TopicDetail, ChatMessage } from "@/lib/types";

const AUTOSAVE_DELAY_MS = 1000;

function StudyWorkspace() {
  const params = useParams<{ topicId: string }>();
  const topicId = params.topicId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [topic, setTopic] = useState<TopicDetail | null>(null);

  const [noteContent, setNoteContent] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keyed by the assistant message's index in `messages` — lets each answer
  // in the thread generate (and remember) its own video independently.
  const [videoByMessage, setVideoByMessage] = useState<
    Record<number, { status: "loading" | "done" | "error"; url?: string; error?: string }>
  >({});

  useEffect(() => {
    if (!topicId) return;
    fetch(`/api/topics/${topicId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load topic");
        const data: TopicDetail = await res.json();
        setTopic(data);
        setNoteContent(data.note);
        setMessages([
          {
            role: "assistant",
            text: `Hi! Ask me anything about "${data.title}" — I've read the material uploaded to ${data.courseName}.`,
          },
        ]);
      })
      .catch((err) => {
        console.error("Failed to load topic:", err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [topicId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleNoteChange(value: string) {
    setNoteContent(value);
    setSaveState("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await fetch(`/api/topics/${topicId}/notes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: value }),
        });
        setSaveState("saved");
      } catch (err) {
        console.error("Failed to save note:", err);
        setSaveState("idle");
      }
    }, AUTOSAVE_DELAY_MS);
  }

  async function handleSend() {
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    const history = messages;
    setMessages((m) => [...m, { role: "user", text: message }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`/api/topics/${topicId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed to get a response");
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Sorry, something went wrong: ${err instanceof Error ? err.message : "unknown error"}`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  // Renders the preceding user question as a short Manim animation — for
  // visual/video learners who'd rather watch the answer than read it.
  async function handleGenerateVideo(assistantIndex: number, question: string) {
    setVideoByMessage((v) => ({ ...v, [assistantIndex]: { status: "loading" } }));
    try {
      const res = await fetch(`/api/topics/${topicId}/video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to generate video");
      setVideoByMessage((v) => ({
        ...v,
        [assistantIndex]: { status: "done", url: data.videoUrl },
      }));
    } catch (err) {
      setVideoByMessage((v) => ({
        ...v,
        [assistantIndex]: {
          status: "error",
          error: err instanceof Error ? err.message : "Failed to generate video",
        },
      }));
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-muted">Loading…</p>
      </main>
    );
  }

  if (notFound || !topic) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-ink-muted">Topic not found.</p>
        <Link href="/study" className="text-forest hover:underline">
          ← Back to study
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface pb-8">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-border text-ink hover:bg-ink hover:text-surface"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{topic.title}</h1>
            <p className="text-xs text-ink-muted">{topic.courseName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Notes panel */}
          <div className="flex flex-col rounded-card border border-border bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Notes</p>
              <p className="text-xs text-ink-muted">
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
              </p>
            </div>
            <textarea
              value={noteContent}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Type your notes for this topic here — they autosave as you go."
              className="min-h-[420px] flex-1 resize-none rounded-card border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-forest"
            />
          </div>

          {/* Chatbot panel */}
          <div className="flex flex-col rounded-card border border-border bg-white p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
              Ask about this topic
            </p>
            <div className="flex h-[420px] flex-col overflow-y-auto rounded-card border border-border bg-surface p-3">
              {messages.map((msg, i) => {
                const video = videoByMessage[i];
                const precedingQuestion = i > 0 ? messages[i - 1]?.text : undefined;
                const canMakeVideo = msg.role === "assistant" && !!precedingQuestion;

                return (
                  <div
                    key={i}
                    className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-card p-3 text-sm ${
                        msg.role === "user"
                          ? "bg-forest text-white"
                          : "border border-border bg-white text-ink"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {canMakeVideo && (
                        <div className="mt-2">
                          {!video && (
                            <button
                              onClick={() => handleGenerateVideo(i, precedingQuestion!)}
                              className="rounded-card bg-forest-light px-2 py-1 text-xs font-medium text-forest hover:bg-forest hover:text-white"
                            >
                              🎬 Turn into a video
                            </button>
                          )}
                          {video?.status === "loading" && (
                            <p className="text-xs text-ink-muted">
                              Rendering with Manim… this can take a minute or two.
                            </p>
                          )}
                          {video?.status === "error" && (
                            <p className="text-xs text-red-600">{video.error}</p>
                          )}
                          {video?.status === "done" && video.url && (
                            <video
                              controls
                              autoPlay
                              className="mt-1 max-w-full rounded-card border border-border"
                              src={video.url}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-card border border-border bg-white px-3 py-2 text-sm text-ink-muted">
                    Thinking… Gemma can take up to ~30s on this model.
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask a question about this material…"
                disabled={chatLoading}
                className="flex-1 rounded-card border border-border bg-surface p-2.5 text-sm outline-none focus:border-forest disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={chatLoading || !chatInput.trim()}
                className="rounded-card bg-forest px-4 text-sm font-medium text-white disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function StudyTopicPage() {
  return (
    <AuthGuard>
      <StudyWorkspace />
    </AuthGuard>
  );
}
