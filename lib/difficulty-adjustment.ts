/**
 * Difficulty Adjustment Logic
 * Tracks student performance on MCQs and adjusts future roadmap pacing
 * 
 * Algorithm:
 * - Track accuracy per topic (correct attempts / total attempts)
 * - If accuracy > 80%: speed up next roadmap (shorter milestones)
 * - If accuracy < 50%: slow down next roadmap (more detailed steps)
 * - Adjust individual milestone estimates based on mastery
 */

import { supabaseServer } from "./supabase";

interface AttemptRecord {
  topicId: string;
  mcqId: string;
  correct: boolean;
  attemptedAt: string;
}

interface MasteryMetrics {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number; // 0-1
  difficulty: "too-easy" | "just-right" | "too-hard";
  suggestedPacingMultiplier: number; // 0.5 = 2x faster, 2.0 = 2x slower
}

export async function calculateMastery(topicId: string): Promise<MasteryMetrics> {
  const { data: attempts, error } = await supabaseServer()
    .from("attempts")
    .select("*")
    .eq("topic_id", topicId);

  if (error || !attempts || attempts.length === 0) {
    return {
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      difficulty: "just-right",
      suggestedPacingMultiplier: 1.0,
    };
  }

  const correctAttempts = attempts.filter((a) => a.correct).length;
  const totalAttempts = attempts.length;
  const accuracy = correctAttempts / totalAttempts;

  // Determine difficulty level and pacing adjustment
  let difficulty: "too-easy" | "just-right" | "too-hard";
  let suggestedPacingMultiplier: number;

  if (accuracy > 0.8) {
    difficulty = "too-easy";
    suggestedPacingMultiplier = 0.6; // 40% faster (shorter, combined milestones)
  } else if (accuracy < 0.5) {
    difficulty = "too-hard";
    suggestedPacingMultiplier = 1.8; // 80% slower (more detailed, broken-down milestones)
  } else {
    difficulty = "just-right";
    suggestedPacingMultiplier = 1.0; // keep same pace
  }

  return {
    totalAttempts,
    correctAttempts,
    accuracy,
    difficulty,
    suggestedPacingMultiplier,
  };
}

/**
 * Given old roadmap milestones and mastery metrics, 
 * adjust time estimates for next roadmap generation
 */
export function adjustMilestoneEstimates(
  currentMilestones: { title: string; estimatedMinutes: number }[],
  mastery: MasteryMetrics
): { title: string; estimatedMinutes: number }[] {
  return currentMilestones.map((milestone) => ({
    title: milestone.title,
    estimatedMinutes: Math.round(milestone.estimatedMinutes * mastery.suggestedPacingMultiplier),
  }));
}

/**
 * Generate adjusted system instruction for Gemma based on mastery
 * This influences how detailed/fast-paced the next roadmap should be
 */
export function getAdjustedSystemInstruction(mastery: MasteryMetrics): string {
  const base =
    "You are a study planning assistant. Break a topic into a short, ordered " +
    "sequence of concrete study milestones a student can complete in single sittings. " +
    "Be specific, not generic — reference sub-concepts by name.";

  if (mastery.difficulty === "too-easy") {
    return (
      base +
      "\n\nThe student has been mastering this material easily (accuracy: " +
      (mastery.accuracy * 100).toFixed(0) +
      "%). " +
      "Create fewer, more combined milestones that cover more ground per session. " +
      "Reduce the number of steps significantly."
    );
  }

  if (mastery.difficulty === "too-hard") {
    return (
      base +
      "\n\nThe student has been struggling with this material (accuracy: " +
      (mastery.accuracy * 100).toFixed(0) +
      "%). " +
      "Break it down into many smaller, more granular milestones. " +
      "Each milestone should be a tiny, achievable step. " +
      "Increase the number of steps substantially."
    );
  }

  return base;
}

/**
 * Track an MCQ attempt and return updated mastery
 */
export async function recordAttempt(
  userId: string,
  topicId: string,
  mcqId: string,
  correct: boolean
): Promise<MasteryMetrics> {
  const { error } = await supabaseServer()
    .from("attempts")
    .insert({
      user_id: userId,
      topic_id: topicId,
      mcq_id: mcqId,
      correct,
      attempted_at: new Date().toISOString(),
    });

  if (error) throw new Error(`Failed to record attempt: ${error.message}`);

  // Recalculate mastery after recording
  return calculateMastery(topicId);
}

/**
 * Helper: format mastery for display
 */
export function formatMasteryDisplay(mastery: MasteryMetrics): string {
  if (mastery.totalAttempts === 0) {
    return "No attempts yet";
  }

  const percent = (mastery.accuracy * 100).toFixed(0);
  const emoji =
    mastery.difficulty === "too-easy"
      ? "🚀"
      : mastery.difficulty === "too-hard"
        ? "🤔"
        : "✨";

  return `${emoji} ${percent}% (${mastery.correctAttempts}/${mastery.totalAttempts}) - ${mastery.difficulty}`;
}
