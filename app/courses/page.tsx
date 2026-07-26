"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import { supabaseBrowser } from "@/lib/supabase";
import type { Topic } from "@/lib/types";

interface CourseCard {
  name: string;
  topicCount: number;
  progress: number;
  lastTouched: string | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const { data, error } = await supabaseBrowser()
          .from("topics")
          .select("course_name, progress_percent, last_touched")
          .order("course_name");

        if (error) throw error;

        // Group topics by course and calculate stats
        const courseMap: Record<string, CourseCard> = {};
        (data || []).forEach((topic: any) => {
          const courseName = topic.course_name;
          if (!courseMap[courseName]) {
            courseMap[courseName] = {
              name: courseName,
              topicCount: 0,
              progress: 0,
              lastTouched: null,
            };
          }
          courseMap[courseName].topicCount += 1;
          courseMap[courseName].progress += (topic.progress_percent || 0) / 100;
          if (
            !courseMap[courseName].lastTouched ||
            (topic.last_touched && topic.last_touched > courseMap[courseName].lastTouched)
          ) {
            courseMap[courseName].lastTouched = topic.last_touched;
          }
        });

        // Convert to array and calculate average progress
        const courseList = Object.values(courseMap).map((course) => ({
          ...course,
          progress: Math.round((course.progress / course.topicCount) * 100) || 0,
        }));

        setCourses(courseList);
      } catch (err) {
        console.error("Failed to load courses:", err);
        // Fallback: show a few example courses
        setCourses([
          { name: "Linear Algebra", topicCount: 3, progress: 45, lastTouched: null },
          { name: "Machine Learning", topicCount: 5, progress: 62, lastTouched: null },
          { name: "Statistics", topicCount: 4, progress: 78, lastTouched: null },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  const courseColors = [
    { bg: "bg-blue-100", border: "border-blue-300", accent: "bg-blue-500" },
    { bg: "bg-purple-100", border: "border-purple-300", accent: "bg-purple-500" },
    { bg: "bg-amber-100", border: "border-amber-300", accent: "bg-amber-600" },
    { bg: "bg-green-100", border: "border-green-300", accent: "bg-green-600" },
  ];

  return (
    <AuthGuard>
      <main className="min-h-screen bg-surface pb-24">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <h1 className="font-display text-2xl font-bold text-ink mb-1">Your courses</h1>
          <p className="text-sm text-ink-muted mb-6">Click any course to dive into the workspace</p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-ink-muted">Loading courses…</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-card border border-border bg-white p-6 text-center">
              <p className="text-sm text-ink-muted">No courses yet. Create topics from the Roadmap tab first.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {courses.map((course, idx) => {
                const color = courseColors[idx % courseColors.length];
                const courseNameEncoded = encodeURIComponent(course.name);

                return (
                  <Link key={course.name} href={`/courses/${courseNameEncoded}`}>
                    <div className={`rounded-card ${color.bg} border-2 ${color.border} p-4 transition-all hover:shadow-md active:scale-95 cursor-pointer`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="font-display font-bold text-ink">{course.name}</h2>
                          <p className="text-xs text-ink-muted mt-1">
                            {course.topicCount} topic{course.topicCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-ink">{course.progress}%</p>
                          {course.lastTouched && (
                            <p className="text-xs text-ink-muted mt-1">Active today</p>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-2 w-full rounded-full bg-white/50">
                        <div
                          className={`h-full rounded-full transition-all ${color.accent}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </AuthGuard>
  );
}
