"use client";

import { useRouter } from "next/navigation";
import StreakStrip from "@/components/StreakStrip";
import WeekHoursChart from "@/components/WeekHoursChart";
import NudgeBanner from "@/components/NudgeBanner";
import TopicCard from "@/components/TopicCard";
import BottomNav from "@/components/BottomNav";
import AuthGuard from "@/components/AuthGuard";
import { supabaseBrowser } from "@/lib/supabase";
import type { DashboardSummary } from "@/lib/types";

// TODO: replace with a real fetch from Supabase (profiles + topics + streak_log
// for the current user) once auth is wired up. Shape matches DashboardSummary
// in lib/types.ts so swapping this out shouldn't touch the components below.
const MOCK: DashboardSummary = {
  currentStreakDays: 7,
  weekHoursByDay: [
    { day: "Mon", hours: 1.5 },
    { day: "Tue", hours: 1 },
    { day: "Wed", hours: 2 },
    { day: "Thu", hours: 0 },
    { day: "Fri", hours: 1.5 },
    { day: "Sat", hours: 3 },
    { day: "Sun", hours: 5 },
  ],
  nudge: {
    topicTitle: "Eigenvalues & Eigenvectors",
    message: "hasn't been touched in 3 days. A focused 25-minute session today will lock in your progress.",
  },
  activeTopics: [
    {
      id: "1",
      courseName: "Linear Algebra",
      title: "Eigenvalues & Eigenvectors",
      category: "math",
      progressPercent: 45,
      lastTouched: "Yesterday",
    },
    {
      id: "2",
      courseName: "Machine Learning",
      title: "Neural Networks",
      category: "programming",
      progressPercent: 62,
      lastTouched: "2 days ago",
    },
    {
      id: "3",
      courseName: "Statistics",
      title: "Probability Distributions",
      category: "other",
      progressPercent: 78,
      lastTouched: "Today",
    },
  ],
};

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function DashboardContent() {
  const router = useRouter();
  const d = MOCK;
  const totalHours = d.weekHoursByDay.reduce((sum, x) => sum + x.hours, 0);
  const activeDaysThisWeek = d.weekHoursByDay.map((x) => x.hours > 0);

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-muted">{todayLabel()}</p>
          <h1 className="font-display text-2xl font-bold">Good morning.</h1>
        </div>
        <button onClick={signOut} className="text-xs text-ink-muted hover:text-forest">
          Sign out
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <StreakStrip streakDays={d.currentStreakDays} activeDaysThisWeek={activeDaysThisWeek} />
        <WeekHoursChart hoursByDay={d.weekHoursByDay} totalHours={totalHours} />
      </div>

      {d.nudge && (
        <div className="mt-4">
          <NudgeBanner topicTitle={d.nudge.topicTitle} message={d.nudge.message} />
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Active topics</h2>
          <span className="text-sm text-forest">View all</span>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {d.activeTopics.map((t) => (
            <TopicCard
              key={t.id}
              courseName={t.courseName}
              title={t.title}
              category={t.category}
              progressPercent={t.progressPercent}
              lastTouchedLabel={t.lastTouched}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
