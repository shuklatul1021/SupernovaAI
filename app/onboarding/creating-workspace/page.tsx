"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function CreatingWorkspacePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const initialize = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/workspace/init", { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Failed to create workspace");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to create workspace";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 noise-overlay">
      <div className="w-full max-w-xl border border-foreground/10 p-8 md:p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-foreground/[0.04] border border-foreground/10 flex items-center justify-center mb-6">
            <Spinner className="size-10" />
          </div>

          <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-3">
            Creating your workspace
          </h1>
          <p className="text-muted-foreground max-w-md">
            We are generating your quiz workspace using your onboarding profile.
          </p>
        </div>

        {error && (
          <div className="mt-6 p-4 border border-red-200 bg-red-50 text-red-700 text-sm text-center space-y-3">
            <p>{error}</p>
            <Button
              onClick={initialize}
              disabled={isLoading}
              className="rounded-full"
            >
              {isLoading ? "Retrying..." : "Retry"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
