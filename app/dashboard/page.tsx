"use client";

import { useRouter } from "next/navigation";
import StreakStrip from "@/components/StreakStrip";
import WeekHoursChart from "@/components/WeekHoursChart";
import NudgeBanner from "@/components/NudgeBanner";
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

// Colorful course card colors (Google Classroom inspired)
const courseColors = [
  { bg: "bg-blue-light", border: "border-blue", accent: "bg-blue" },
  { bg: "bg-violet-light", border: "border-violet", accent: "bg-violet" },
  { bg: "bg-amber-light", border: "border-amber", accent: "bg-amber" },
  { bg: "bg-forest-light", border: "border-forest", accent: "bg-forest" },
];

function DashboardContent() {
  const router = useRouter();
  const d = MOCK;
  const totalHours = d.weekHoursByDay.reduce((sum, x) => sum + x.hours, 0);
  const activeDaysThisWeek = d.weekHoursByDay.map((x) => x.hours > 0);

  return (
    <main className="min-h-screen bg-bg py-8">
      {/* Welcome Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <p className="text-sm font-medium text-ink-muted">{todayLabel()}</p>
        <h1 className="font-display text-4xl font-bold text-ink mt-1">Good morning.</h1>
      </div>

      {/* Stats & Nudge Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        {d.nudge && (
          <div className="mb-6">
            <NudgeBanner topicTitle={d.nudge.topicTitle} message={d.nudge.message} />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StreakStrip streakDays={d.currentStreakDays} activeDaysThisWeek={activeDaysThisWeek} />
          <WeekHoursChart hoursByDay={d.weekHoursByDay} totalHours={totalHours} />
        </div>
      </div>

      {/* Courses/Topics Section - Google Classroom Style */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold text-ink">Your courses</h2>
          <p className="text-sm text-ink-muted mt-1">Continue where you left off</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {d.activeTopics.map((topic, idx) => {
            const colors = courseColors[idx % courseColors.length];
            const progressWidth = (topic.progressPercent / 100) * 100;
            
            return (
              <div
                key={topic.id}
                className={`${colors.bg} rounded-card overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${colors.border}`}
              >
                {/* Header with accent color */}
                <div className={`${colors.accent} h-20 relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-surface rounded-full -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-surface rounded-full -ml-8 -mb-8"></div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg text-ink">{topic.title}</h3>
                  <p className="text-sm text-ink-muted mt-1">{topic.courseName}</p>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 bg-white rounded-full h-2 overflow-hidden">
                    <div
                      className={`${colors.accent} h-full transition-all duration-300`}
                      style={{ width: `${progressWidth}%` }}
                    ></div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-medium text-ink-muted">{topic.progressPercent}% complete</span>
                    <span className="text-xs text-ink-muted">Last touched: {topic.lastTouched}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "📚", label: "View All Courses", href: "/courses" },
            { icon: "🗺️", label: "Roadmap", href: "/roadmap" },
            { icon: "✏️", label: "Study Now", href: "/study" },
            { icon: "🎯", label: "Continue Last", href: "#" },
          ].map((action, idx) => (
            <a
              key={idx}
              href={action.href}
              className="flex flex-col items-center justify-center p-4 bg-surface rounded-card border border-border hover:border-forest hover:shadow-md transition-all text-center"
            >
              <span className="text-2xl mb-2">{action.icon}</span>
              <span className="text-xs font-medium text-ink">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
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
