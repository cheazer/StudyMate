"use client";

import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import { supabaseBrowser } from "@/lib/supabase";
import type { RoadmapMilestone } from "@/lib/types";

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; kind: "text"; text: string }
  | { id: string; role: "assistant"; kind: "roadmap"; topic: string; milestones: RoadmapMilestone[] };

function RoadmapChat() {
  const [courseName, setCourseName] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      kind: "text",
      text: "Tell me a topic you want to study and I'll build you a roadmap for it. Set your course above first.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function send() {
    const topic = topicInput.trim();
    if (!topic || !courseName.trim() || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: topic };
    setMessages((m) => [...m, userMsg]);
    setTopicInput("");
    setLoading(true);

    try {
      // Create the topic row first — roadmaps are keyed to an existing topic.
      const { data: topicRow, error: topicError } = await supabaseBrowser()
        .from("topics")
        .insert({ course_name: courseName.trim(), title: topic, category: "other" })
        .select()
        .single();

      if (topicError || !topicRow) throw new Error(topicError?.message ?? "Could not create topic");

      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topicRow.id, topic, courseName: courseName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Roadmap generation failed");

      const data = await res.json();
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", kind: "roadmap", topic, milestones: data.milestones },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          kind: "text",
          text: `Something went wrong: ${err instanceof Error ? err.message : "unknown error"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function toggleMilestone(msgId: string, milestoneId: string) {
    setMessages((m) =>
      m.map((msg) =>
        msg.id === msgId && msg.role === "assistant" && msg.kind === "roadmap"
          ? {
              ...msg,
              milestones: msg.milestones.map((mi) =>
                mi.id === milestoneId ? { ...mi, done: !mi.done } : mi
              ),
            }
          : msg
      )
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-24 pt-6">
      <h1 className="font-display text-2xl font-bold">Roadmap</h1>

      <input
        value={courseName}
        onChange={(e) => setCourseName(e.target.value)}
        placeholder="Course (e.g. Linear Algebra)"
        className="mt-3 w-full rounded-card border border-border bg-surface p-3 text-sm outline-none focus:border-forest"
      />

      <div className="mt-4 flex flex-1 flex-col gap-3">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {m.role === "user" && (
              <div className="max-w-[80%] rounded-card bg-forest px-4 py-2.5 text-sm text-white">
                {m.text}
              </div>
            )}

            {m.role === "assistant" && m.kind === "text" && (
              <div className="max-w-[80%] rounded-card bg-surface border border-border px-4 py-2.5 text-sm text-ink">
                {m.text}
              </div>
            )}

            {m.role === "assistant" && m.kind === "roadmap" && (
              <div className="w-full rounded-card border border-border bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-forest">
                  Roadmap · {m.topic}
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {m.milestones.map((ms) => (
                    <label
                      key={ms.id}
                      className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-border p-3 transition-colors hover:border-forest/40"
                    >
                      <input
                        type="checkbox"
                        checked={ms.done}
                        onChange={() => toggleMilestone(m.id, ms.id)}
                        className="mt-0.5 h-4 w-4 accent-forest"
                      />
                      <span className={ms.done ? "text-sm text-ink-muted line-through" : "text-sm text-ink"}>
                        {ms.title}
                        <span className="ml-2 font-mono text-xs text-ink-muted">
                          {ms.estimatedMinutes}m
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-ink-muted">
              Building your roadmap…
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-14 mx-auto flex w-full max-w-md gap-2 bg-bg px-4 py-2">
        <input
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="What topic do you want to study?"
          className="flex-1 rounded-card border border-border bg-surface p-3 text-sm outline-none focus:border-forest"
        />
        <button
          onClick={send}
          disabled={loading || !topicInput.trim() || !courseName.trim()}
          className="rounded-card bg-forest px-4 text-sm font-medium text-white disabled:opacity-40"
        >
          Send
        </button>
      </div>

      <BottomNav />
    </main>
  );
}

export default function RoadmapPage() {
  return (
    <AuthGuard>
      <RoadmapChat />
    </AuthGuard>
  );
}
