import AuthGuard from "@/components/AuthGuard";

export default function StudyPage() {
  return (
    <AuthGuard>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-xl font-bold">Study packs</p>
        <p className="mt-2 text-sm text-ink-muted">
          Notes, flashcards, and quizzes per topic land here next — generate a
          roadmap first from the Roadmap tab.
        </p>
      </main>
    </AuthGuard>
  );
}
