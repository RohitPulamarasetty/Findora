"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="group relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border-default bg-bg-base px-5 text-[14px] font-semibold text-text-base shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-200 hover:border-border-strong hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-text-muted-fg/30 border-t-text-base" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span>{loading ? "Signing in…" : "Continue with Google"}</span>
    </button>
  );
}
