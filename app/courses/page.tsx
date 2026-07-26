"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import type { Course } from "@/lib/types";

const courseColors = [
  { bg: "bg-blue-light", border: "border-blue", accent: "bg-blue" },
  { bg: "bg-violet-light", border: "border-violet", accent: "bg-violet" },
  { bg: "bg-amber-light", border: "border-amber", accent: "bg-amber" },
  { bg: "bg-forest-light", border: "border-forest", accent: "bg-forest" },
];

function CoursesContent() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load courses");
        return res.json();
      })
      .then((data) => setCourses(data.courses))
      .catch((err) => {
        console.error("Failed to load courses:", err);
        setError("Couldn't load your courses. Try refreshing.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    const name = newName.trim();
    if (!name || creating) return;

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed to create course");
      const data = await res.json();
      router.push(`/courses/${data.course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course");
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Your courses</h1>
            <p className="text-sm text-ink-muted mt-1">
              Create a folder, upload lecture PDFs, and get a roadmap.
            </p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-card bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest/90"
          >
            + New course
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-card border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-2">
              Course name
            </p>
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Linear Algebra"
                className="flex-1 rounded-card border border-border bg-surface p-2 text-sm outline-none focus:border-forest"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="rounded-card bg-forest px-4 text-sm font-medium text-white disabled:opacity-40"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-ink-muted">Loading courses…</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-card border border-border bg-white p-6 text-center">
            <p className="text-sm text-ink-muted">
              No courses yet. Create one and upload a PDF to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {courses.map((course, idx) => {
              const color = courseColors[idx % courseColors.length];
              return (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <div
                    className={`rounded-card ${color.bg} border-2 ${color.border} p-4 transition-all hover:shadow-md active:scale-95 cursor-pointer`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="font-display font-bold text-ink">{course.name}</h2>
                        <p className="text-xs text-ink-muted mt-1">
                          {course.topicCount} topic{course.topicCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-ink-muted">
                          {course.analyzedAt ? "Analyzed" : "No material yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function CoursesPage() {
  return (
    <AuthGuard>
      <CoursesContent />
      <BottomNav />
    </AuthGuard>
  );
}
