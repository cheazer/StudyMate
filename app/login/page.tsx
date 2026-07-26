"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import AmbientBackground from "@/components/AmbientBackground";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = supabaseBrowser();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/onboarding");
      return;
    }

    // signup
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push("/onboarding");
    } else {
      // Email confirmation is on for this project — see the README note
      // about turning it off for faster hackathon-day demos.
      setNotice("Account created — check your email to confirm, then sign in.");
      setMode("signin");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <AmbientBackground />

      <div className="relative w-full max-w-sm">
        <h1 className="font-display text-3xl font-bold">StudyMate</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {mode === "signin" ? "Welcome back." : "Let's get you set up."}
        </p>

        <div className="mt-6 flex rounded-card border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-[10px] py-2 text-sm font-medium transition-colors ${
              mode === "signin" ? "bg-forest text-white" : "text-ink-muted"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-[10px] py-2 text-sm font-medium transition-colors ${
              mode === "signup" ? "bg-forest text-white" : "text-ink-muted"
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-card border border-border bg-surface p-4 outline-none focus:border-forest"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-card border border-border bg-surface p-4 outline-none focus:border-forest"
          />

          {error && <p className="text-sm text-amber">{error}</p>}
          {notice && <p className="text-sm text-forest">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-card bg-forest p-4 font-medium text-white disabled:opacity-40"
          >
            {loading ? "One sec…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
