import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";

export default function CoursesPage() {
  return (
    <AuthGuard>
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="font-display text-xl font-bold">Courses</p>
        <p className="mt-2 text-sm text-ink-muted">
          A per-course view of topics and mastery lands here next.
        </p>
      </main>
      <BottomNav />
    </AuthGuard>
  );
}
