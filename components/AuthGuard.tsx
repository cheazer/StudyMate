"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    supabaseBrowser()
      .auth.getUser()
      .then(({ data }) => {
        if (!active) return;
        if (!data.user) {
          router.replace("/login");
        } else {
          setChecked(true);
        }
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
