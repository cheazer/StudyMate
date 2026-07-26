import AuthGuard from "@/components/AuthGuard";

export default function CoursesPage() {
  return (
    <AuthGuard>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-xl font-bold">Courses</p>
        <p className="mt-2 text-sm text-ink-muted">
          A per-course view of topics and mastery lands here next.
        </p>
      </main>
    </AuthGuard>
  );
}
