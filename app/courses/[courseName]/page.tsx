"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import { supabaseBrowser } from "@/lib/supabase";
import type { Topic, CourseSummary, RoadmapMilestone } from "@/lib/types";

interface CourseWorkspaceProps {
  params: { courseName: string };
}

type Tab = "overview" | "study-actions";
type Message = 
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string };

function CourseWorkspace({ params }: CourseWorkspaceProps) {
  const router = useRouter();
  const courseName = decodeURIComponent(params.courseName);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [courseSummary, setCourseSummary] = useState<CourseSummary | null>(null);
  
  // Study hours logging
  const [hoursInput, setHoursInput] = useState("");
  const [loggingHours, setLoggingHours] = useState(false);

  // Roadmap generation
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicInput, setTopicInput] = useState("");
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<RoadmapMilestone[]>([]);

  // Study assistant
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      text: `Hi! I'm your AI study guide for ${courseName}. I can help you with guided notes, practice questions, and lesson scripts. What would you like to learn?`,
    },
  ]);
  const [studyInput, setStudyInput] = useState("");
  const [studyLoading, setStudyLoading] = useState(false);

  // Load course summary
  useEffect(() => {
    async function loadCourseSummary() {
      try {
        const res = await fetch(`/api/courses/${encodeURIComponent(courseName)}`);
        if (!res.ok) throw new Error("Failed to load course");
        const data = await res.json();
        setCourseSummary(data);
      } catch (err) {
        console.error("Failed to load course summary:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourseSummary();
  }, [courseName]);

  async function handleLogHours() {
    if (!hoursInput || loggingHours) return;
    
    setLoggingHours(true);
    try {
      const minutes = Math.round(parseFloat(hoursInput) * 60);
      const res = await fetch("/api/study-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName,
          topicId: selectedTopic?.id,
          minutesStudied: minutes,
        }),
      });
      if (!res.ok) throw new Error("Failed to log hours");
      
      setHoursInput("");
      // Refresh course summary
      const summaryRes = await fetch(`/api/courses/${encodeURIComponent(courseName)}`);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setCourseSummary(data);
      }
    } catch (err) {
      console.error("Error logging hours:", err);
      alert("Failed to log study hours");
    } finally {
      setLoggingHours(false);
    }
  }

  async function handleGenerateRoadmap() {
    if (!topicInput || !selectedTopic || roadmapLoading) return;

    setRoadmapLoading(true);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          topic: topicInput,
          courseName,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate roadmap");
      const data = await res.json();
      setGeneratedRoadmap(data.milestones);
      setTopicInput("");
    } catch (err) {
      console.error("Error generating roadmap:", err);
      alert("Failed to generate roadmap");
    } finally {
      setRoadmapLoading(false);
    }
  }

  async function handleStudyAction(mode: "guided-notes" | "practice" | "quiz" | "video-script") {
    if (!topicInput || !selectedTopic || studyLoading) return;

    const userMsg: Message = { 
      id: crypto.randomUUID(), 
      role: "user", 
      text: `Generate ${mode === "guided-notes" ? "guided notes" : mode === "practice" ? "practice questions" : mode === "quiz" ? "a quiz" : "a video lesson script"} on ${topicInput}` 
    };
    setMessages((m) => [...m, userMsg]);
    setStudyLoading(true);

    try {
      const res = await fetch("/api/study-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          topic: topicInput,
          sourceText: topicInput, // In real app, would use lecture notes
          mode,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate content");
      const data = await res.json();

      let responseText = "";
      if (mode === "guided-notes") {
        responseText = `📖 Guided Notes on ${topicInput}\n\n${data.summary}\n\nKey Points: ${data.keyPoints?.join(", ")}`;
      } else if (mode === "practice") {
        responseText = `✍️ Practice Questions on ${topicInput}\n\n${data.questions?.map((q: any, i: number) => `${i + 1}. ${q.prompt}`).join("\n\n")}`;
      } else if (mode === "quiz") {
        responseText = `📝 Quiz on ${topicInput}\n\n${data.mcqs?.length || 0} MCQ questions ready for you.`;
      } else {
        responseText = `🎥 Video Script on ${topicInput}\n\nDuration: ${data.duration} minutes\n\nOutline:\n${data.outline?.map((s: any) => `- ${s.section} (${s.duration}m)`).join("\n")}`;
      }

      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: responseText }]);
      setStudyInput("");
    } catch (err) {
      console.error("Error generating content:", err);
      setMessages((m) => [...m, { 
        id: crypto.randomUUID(), 
        role: "assistant", 
        text: `Sorry, I couldn't generate that content. Please try again.` 
      }]);
    } finally {
      setStudyLoading(false);
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-surface">
          <div className="flex items-center justify-center py-12">
            <p className="text-ink-muted">Loading course…</p>
          </div>
        </main>
        <BottomNav />
      </AuthGuard>
    );
  }

  if (!courseSummary) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-surface">
          <div className="mx-auto max-w-2xl px-4 py-6">
            <p className="text-ink-muted">Course not found.</p>
            <Link href="/courses" className="text-forest hover:underline">
              ← Back to courses
            </Link>
          </div>
        </main>
        <BottomNav />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-surface pb-24">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-border text-ink hover:bg-ink hover:text-surface"
            >
              ←
            </button>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-ink">{courseName}</h1>
              <p className="text-xs text-ink-muted">{courseSummary.topicCount} topics</p>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="mb-6 rounded-card border border-border bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-ink">Progress</p>
              <p className="text-sm font-bold text-forest">{courseSummary.currentProgress}%</p>
            </div>
            <div className="h-2 w-full rounded-full bg-border">
              <div
                className="h-full rounded-full bg-forest transition-all"
                style={{ width: `${courseSummary.currentProgress}%` }}
              />
            </div>
          </div>

          {/* Today's Study Card */}
          <div className="mb-6 rounded-card border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-3">Log study time</p>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                placeholder="Hours (e.g. 1.5)"
                className="flex-1 rounded-card border border-border bg-surface p-2 text-sm outline-none focus:border-forest"
              />
              <button
                onClick={handleLogHours}
                disabled={loggingHours || !hoursInput}
                className="rounded-card bg-forest px-3 text-sm font-medium text-white disabled:opacity-40"
              >
                Log
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-muted">Today: {courseSummary.todayStudyMinutes} minutes</p>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "border-b-2 border-forest text-forest"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              📚 Overview
            </button>
            <button
              onClick={() => setActiveTab("study-actions")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "study-actions"
                  ? "border-b-2 border-forest text-forest"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              🤖 Study Actions
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Topics */}
              <div className="rounded-card border border-border bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-3">Topics</p>
                {courseSummary.topics.length === 0 ? (
                  <p className="text-sm text-ink-muted">No topics yet. Create one from the Roadmap tab.</p>
                ) : (
                  <div className="space-y-2">
                    {courseSummary.topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic)}
                        className={`w-full text-left rounded-card border-2 p-3 transition-all ${
                          selectedTopic?.id === topic.id
                            ? "border-forest bg-blue-50"
                            : "border-border hover:border-forest/40"
                        }`}
                      >
                        <p className="text-sm font-medium text-ink">{topic.title}</p>
                        <p className="text-xs text-ink-muted">{topic.progressPercent}% • {topic.category}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Roadmap for selected topic */}
              {selectedTopic && generatedRoadmap.length > 0 && (
                <div className="rounded-card border border-border bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-3">
                    Roadmap: {selectedTopic.title}
                  </p>
                  <div className="space-y-2">
                    {generatedRoadmap.map((milestone) => (
                      <label
                        key={milestone.id}
                        className="flex cursor-pointer items-start gap-3 rounded-card border border-border p-3 hover:border-forest/40"
                      >
                        <input
                          type="checkbox"
                          checked={milestone.done}
                          onChange={() => {}}
                          className="mt-0.5 h-4 w-4 accent-forest"
                        />
                        <span className={milestone.done ? "text-sm text-ink-muted line-through" : "text-sm text-ink"}>
                          {milestone.title}
                          <span className="ml-2 font-mono text-xs text-ink-muted">{milestone.estimatedMinutes}m</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Study Actions Tab */}
          {activeTab === "study-actions" && (
            <div className="space-y-4">
              {/* Topic Input */}
              <div className="rounded-card border border-border bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-3">What topic?</p>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. Eigenvalues and Eigenvectors"
                  className="w-full rounded-card border border-border bg-surface p-2 text-sm outline-none focus:border-forest"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStudyAction("guided-notes")}
                  disabled={!topicInput || !selectedTopic || studyLoading}
                  className="rounded-card bg-blue-100 px-3 py-2 text-xs font-medium text-blue-900 hover:bg-blue-200 disabled:opacity-40"
                >
                  📖 Guided Notes
                </button>
                <button
                  onClick={() => handleStudyAction("practice")}
                  disabled={!topicInput || !selectedTopic || studyLoading}
                  className="rounded-card bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-200 disabled:opacity-40"
                >
                  ✍️ Practice
                </button>
                <button
                  onClick={() => handleStudyAction("quiz")}
                  disabled={!topicInput || !selectedTopic || studyLoading}
                  className="rounded-card bg-purple-100 px-3 py-2 text-xs font-medium text-purple-900 hover:bg-purple-200 disabled:opacity-40"
                >
                  📝 Quiz
                </button>
                <button
                  onClick={() => handleStudyAction("video-script")}
                  disabled={!topicInput || !selectedTopic || studyLoading}
                  className="rounded-card bg-green-100 px-3 py-2 text-xs font-medium text-green-900 hover:bg-green-200 disabled:opacity-40"
                >
                  🎥 Lesson Script
                </button>
              </div>

              {/* Chat */}
              <div className="space-y-3">
                <div className="h-64 overflow-y-auto rounded-card border border-border bg-white p-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-card p-3 text-sm ${
                          msg.role === "user"
                            ? "bg-forest text-white"
                            : "border border-border bg-surface text-ink"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </AuthGuard>
  );
}

export default function CoursePage({ params }: CourseWorkspaceProps) {
  return <CourseWorkspace params={params} />;
}
