// Small helpers to turn Supabase's snake_case rows into the camelCase shapes
// declared in lib/types.ts. Kept in one place so API routes stay consistent.
import type { Topic, RoadmapMilestone, CourseSubtopicSuggestion } from "@/lib/types";

interface TopicRow {
  id: string;
  course_id?: string | null;
  course_name: string;
  title: string;
  category: Topic["category"];
  progress_percent?: number | null;
  last_touched: string;
}

export function rowToTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    courseId: row.course_id ?? undefined,
    courseName: row.course_name,
    title: row.title,
    category: row.category,
    progressPercent: row.progress_percent ?? 0,
    lastTouched: row.last_touched,
  };
}

interface MilestoneRow {
  id?: string;
  title: string;
  estimatedMinutes?: number;
  estimated_minutes?: number;
  done?: boolean;
}

export function rowToMilestones(raw: unknown): RoadmapMilestone[] {
  if (!Array.isArray(raw)) return [];
  return (raw as MilestoneRow[]).map((m) => ({
    id: m.id ?? crypto.randomUUID(),
    title: m.title,
    estimatedMinutes: m.estimatedMinutes ?? m.estimated_minutes ?? 0,
    done: m.done ?? false,
  }));
}

export function rowToSuggestions(raw: unknown): CourseSubtopicSuggestion[] {
  if (!Array.isArray(raw)) return [];
  return (raw as CourseSubtopicSuggestion[]).map((s) => ({ title: s.title, summary: s.summary }));
}
