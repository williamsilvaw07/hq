"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error?.message, error?.stack);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 font-sans">
      <h1 className="text-lg font-bold text-foreground mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        A client-side error occurred. Check the browser console (F12 → Console) for details.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-bold"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
