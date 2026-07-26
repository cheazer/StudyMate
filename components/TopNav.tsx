"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

interface TopNavProps {
  onSignOut?: () => void;
}

export default function TopNav({ onSignOut }: TopNavProps) {
  const router = useRouter();

  async function handleSignOut() {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-surface shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest">
                <span className="font-display text-xl font-bold text-surface">S</span>
              </div>
              <span className="font-display text-lg font-bold text-ink hidden sm:inline">StudyMate</span>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-ink hover:text-forest transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/courses"
                className="text-sm font-medium text-ink hover:text-forest transition-colors"
              >
                Courses
              </Link>
              <Link
                href="/study"
                className="text-sm font-medium text-ink hover:text-forest transition-colors"
              >
                Study
              </Link>
              <Link
                href="/roadmap"
                className="text-sm font-medium text-ink hover:text-forest transition-colors"
              >
                Roadmap
              </Link>
            </div>
          </div>

          {/* Right side: User menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-ink-muted hover:text-forest transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
