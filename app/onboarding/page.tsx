"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AmbientBackground from "@/components/AmbientBackground";

type Answers = {
  courseName: string;
  weeklyGoalHours: number;
  biggestChallenge: string;
  preferredStudyTime: "morning" | "afternoon" | "evening" | "late-night";
  preferredFormat: "video" | "reading" | "practice" | "mixed";
};

const STEPS = [
  { key: "courseName", label: "Which course are you studying?", type: "text" },
  { key: "weeklyGoalHours", label: "What's your weekly study goal, in hours?", type: "number" },
  { key: "biggestChallenge", label: "What's your biggest study challenge or procrastination trigger?", type: "text" },
  {
    key: "preferredStudyTime",
    label: "When do you usually prefer to study?",
    type: "choice",
    options: ["morning", "afternoon", "evening", "late-night"],
  },
  {
    key: "preferredFormat",
    label: "How do you prefer to learn?",
    type: "choice",
    options: ["video", "reading", "practice", "mixed"],
  },
] as const;

function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [submitting, setSubmitting] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function next(overrideAnswers?: Partial<Answers>) {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideAnswers ?? answers),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  function setValue(value: string | number) {
    setAnswers((a) => ({ ...a, [current.key]: value }));
  }

  // Choice questions feel better as tap-and-go rather than tap-then-Next.
  function pickChoice(opt: string) {
    const updated = { ...answers, [current.key]: opt };
    setAnswers(updated);
    setTimeout(() => next(updated as Partial<Answers>), 220);
  }

  const value = answers[current.key as keyof Answers];

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 py-10">
      <AmbientBackground />

      <div className="relative">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-forest" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div key={step} className="animate-step-in">
          <h1 className="mt-8 font-display text-2xl font-bold">{current.label}</h1>

          <div className="mt-6">
            {current.type === "text" && (
              <input
                autoFocus
                type="text"
                value={(value as string) || ""}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-card border border-border bg-surface p-4 outline-none focus:border-forest"
              />
            )}

            {current.type === "number" && (
              <input
                autoFocus
                type="number"
                min={1}
                value={(value as number) || ""}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full rounded-card border border-border bg-surface p-4 outline-none focus:border-forest"
              />
            )}

            {current.type === "choice" && "options" in current && (
              <div className="flex flex-col gap-2">
                {current.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => pickChoice(opt)}
                    className={`rounded-card border p-4 text-left capitalize transition-all active:scale-[0.98] ${
                      value === opt
                        ? "border-forest bg-forest-light text-forest"
                        : "border-border bg-surface hover:border-forest/40"
                    }`}
                  >
                    {opt.replace("-", " ")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {current.type !== "choice" && (
        <button
          onClick={() => next()}
          disabled={!value || submitting}
          className="relative mt-8 rounded-card bg-forest p-4 font-medium text-white transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          {isLast ? (submitting ? "Saving…" : "Finish") : "Next"}
        </button>
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingFlow />
    </AuthGuard>
  );
}
