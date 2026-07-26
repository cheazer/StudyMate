"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import type { CourseDetail } from "@/lib/types";

function CourseWorkspace() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [customTopic, setCustomTopic] = useState("");
  const [addingTopic, setAddingTopic] = useState<string | null>(null); // title being added

  const [hoursInput, setHoursInput] = useState("");
  const [loggingHours, setLoggingHours] = useState(false);

  // Fetches the course and applies it to state; reused after mutations
  // (upload, add topic, log hours) to refresh the view.
  async function refreshCourse() {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to load course");
      const data = await res.json();
      setCourse(data);
    } catch (err) {
      console.error("Failed to load course:", err);
      setNotFound(true);
    }
  }

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/courses/${courseId}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load course");
        return res.json();
      })
      .then((data) => {
        if (data) setCourse(data);
      })
      .catch((err) => {
        console.error("Failed to load course:", err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/courses/${courseId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed to analyze material");
      await refreshCourse();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to analyze material");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAddSuggestion(index: number, title: string) {
    setAddingTopic(title);
    try {
      const res = await fetch(`/api/courses/${courseId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromSuggestionIndex: index }),
      });
      if (!res.ok) throw new Error("Failed to add topic");
      await refreshCourse();
    } catch (err) {
      console.error(err);
      alert("Failed to add that topic");
    } finally {
      setAddingTopic(null);
    }
  }

  async function handleAddCustomTopic() {
    const title = customTopic.trim();
    if (!title) return;
    setAddingTopic(title);
    try {
      const res = await fetch(`/api/courses/${courseId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to add topic");
      setCustomTopic("");
      await refreshCourse();
    } catch (err) {
      console.error(err);
      alert("Failed to add that topic");
    } finally {
      setAddingTopic(null);
    }
  }

  async function handleLogHours() {
    if (!hoursInput || loggingHours) return;
    setLoggingHours(true);
    try {
      const minutes = Math.round(parseFloat(hoursInput) * 60);
      const res = await fetch("/api/study-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseName: course?.name, minutesStudied: minutes }),
      });
      if (!res.ok) throw new Error("Failed to log hours");
      setHoursInput("");
      await refreshCourse();
    } catch (err) {
      console.error("Error logging hours:", err);
      alert("Failed to log study hours");
    } finally {
      setLoggingHours(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface">
        <div className="flex items-center justify-center py-12">
          <p className="text-ink-muted">Loading…</p>
        </div>
      </main>
    );
  }

  if (notFound || !course) {
    return (
      <main className="min-h-screen bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <p className="text-ink-muted">Course not found.</p>
          <Link href="/courses" className="text-forest hover:underline">
            ← Back to courses
          </Link>
        </div>
      </main>
    );
  }

  const hasMaterial = course.materialCount > 0;

  return (
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
            <h1 className="font-display text-2xl font-bold text-ink">{course.name}</h1>
            <p className="text-xs text-ink-muted">
              {course.materialCount} file{course.materialCount !== 1 ? "s" : ""} uploaded ·{" "}
              {course.topics.length} topic{course.topics.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Upload card — always available so more material can be added later */}
        <div className="mb-6 rounded-card border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-3">
            {hasMaterial ? "Upload more material" : "Upload your first PDF"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-card file:border-0 file:bg-forest file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-forest/90"
          />
          {uploading && (
            <p className="mt-3 text-xs text-ink-muted">
              Reading your material and building a roadmap — this can take 20-30s on this model,
              hang tight…
            </p>
          )}
          {uploadError && <p className="mt-3 text-xs text-red-600">{uploadError}</p>}
        </div>

        {/* Log study time */}
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
          <p className="mt-2 text-xs text-ink-muted">Today: {course.todayStudyMinutes} minutes</p>
        </div>

        {!hasMaterial ? (
          <div className="rounded-card border border-dashed border-border bg-white p-6 text-center">
            <p className="text-sm text-ink-muted">
              Upload a lecture PDF above and Gemma will suggest subtopics and a roadmap for this
              course.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Suggested subtopics */}
            {course.suggestedSubtopics.length > 0 && (
              <div className="rounded-card border border-border bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-3">
                  Suggested subtopics
                </p>
                <div className="space-y-2">
                  {course.suggestedSubtopics.map((s, idx) => (
                    <div
                      key={`${s.title}-${idx}`}
                      className="flex items-start justify-between gap-3 rounded-card border border-border p-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{s.title}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{s.summary}</p>
                      </div>
                      <button
                        onClick={() => handleAddSuggestion(idx, s.title)}
                        disabled={addingTopic === s.title}
                        className="shrink-0 rounded-card bg-forest-light px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest hover:text-white disabled:opacity-40"
                      >
                        {addingTopic === s.title ? "Adding…" : "+ Add"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add a custom topic */}
            <div className="rounded-card border border-border bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-3">
                Add a custom topic
              </p>
              <div className="flex gap-2">
                <input
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomTopic()}
                  placeholder="e.g. Singular Value Decomposition"
                  className="flex-1 rounded-card border border-border bg-surface p-2 text-sm outline-none focus:border-forest"
                />
                <button
                  onClick={handleAddCustomTopic}
                  disabled={!customTopic.trim() || addingTopic !== null}
                  className="rounded-card bg-forest px-4 text-sm font-medium text-white disabled:opacity-40"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Your topics */}
            <div className="rounded-card border border-border bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-3">
                Your topics
              </p>
              {course.topics.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No topics yet — add a suggested subtopic above or type your own.
                </p>
              ) : (
                <div className="space-y-2">
                  {course.topics.map((topic) => (
                    <Link key={topic.id} href={`/study/${topic.id}`}>
                      <div className="rounded-card border-2 border-border p-3 hover:border-forest/40 transition-all">
                        <p className="text-sm font-medium text-ink">{topic.title}</p>
                        <p className="text-xs text-ink-muted mt-1">
                          {topic.progressPercent}% · Open study workspace →
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CoursePage() {
  return (
    <AuthGuard>
      <CourseWorkspace />
      <BottomNav />
    </AuthGuard>
  );
}
