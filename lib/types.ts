// Shared data contract. Lock this before splitting up work — the UI and the
// API routes both build against these shapes, so changing one means telling
// your teammate before you change it, not after.

export type StudyCategory = "math" | "programming" | "science" | "other";

export interface Profile {
  id: string;
  courseName: string;
  weeklyGoalHours: number;
  biggestChallenge: string;
  preferredStudyTime: "morning" | "afternoon" | "evening" | "late-night";
  preferredFormat: "video" | "reading" | "practice" | "mixed";
}

export interface Topic {
  id: string;
  courseName: string;
  title: string;
  category: StudyCategory;
  progressPercent: number; // 0-100, derived from roadmap milestone completion
  lastTouched: string; // ISO date
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  estimatedMinutes: number;
  done: boolean;
}

export interface Roadmap {
  topicId: string;
  milestones: RoadmapMilestone[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
}

export interface WorkedExample {
  id: string;
  prompt: string;
  steps: string[];
}

export interface StudyPack {
  topicId: string;
  notes: string;
  flashcards: Flashcard[];
  mcqs: MCQQuestion[];
  workedExamples: WorkedExample[];
}

export interface Attempt {
  id: string;
  topicId: string;
  mcqId: string;
  correct: boolean;
  attemptedAt: string; // ISO date
}

export interface StreakLogEntry {
  date: string; // ISO date, one row per active day
  minutesStudied: number;
}

export interface DashboardSummary {
  currentStreakDays: number;
  weekHoursByDay: { day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"; hours: number }[];
  nudge: { topicTitle: string; message: string } | null;
  activeTopics: Topic[];
}

// Study content generation
export interface GuidedNotes {
  summary: string;
  keyPoints: string[];
  deeperExplanation: string;
}

export interface PracticeQuestions {
  questions: Array<{
    prompt: string;
    guidance: string;
  }>;
}

export interface VideoScript {
  title: string;
  duration: number; // estimated minutes
  outline: Array<{
    section: string;
    duration: number;
    content: string;
  }>;
}

// Course summary for workspace
export interface CourseSummary {
  courseName: string;
  topicCount: number;
  currentProgress: number; // 0-100
  topics: Topic[];
  recentStudyPacks: StudyPack[];
  recentAttempts: Attempt[];
  todayStudyMinutes: number;
}
