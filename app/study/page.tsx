"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import TopicCard from "@/components/TopicCard";
import type { Topic } from "@/lib/types";

function timeAgoLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function StudyIndex() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => setTopics(data.topics ?? []))
      .catch((err) => console.error("Failed to load topics:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6 pb-24">
      <h1 className="font-display text-2xl font-bold text-ink">Study</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Pick a topic to open notes and the Gemma chatbot for it.
      </p>

      {loading ? (
        <p className="mt-8 text-center text-ink-muted">Loading…</p>
      ) : topics.length === 0 ? (
        <div className="mt-8 rounded-card border border-border bg-white p-6 text-center">
          <p className="text-sm text-ink-muted">
            No topics yet.{" "}
            <Link href="/courses" className="text-forest hover:underline">
              Create a course and add a topic
            </Link>{" "}
            to start studying.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {topics.map((topic) => (
            <Link key={topic.id} href={`/study/${topic.id}`}>
              <TopicCard
                courseName={topic.courseName}
                title={topic.title}
                category={topic.category}
                progressPercent={topic.progressPercent}
                lastTouchedLabel={topic.lastTouched ? timeAgoLabel(topic.lastTouched) : ""}
              />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default function StudyPage() {
  return (
    <AuthGuard>
      <StudyIndex />
      <BottomNav />
    </AuthGuard>
  );
}
