"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Circle, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Resource = {
  type: "video" | "article" | "practice";
  title: string;
  url: string;
};

type StudyPlanData = {
  exam: string;
  subject: string;
  totalDays: number;
  currentDay: number;
  hoursPerDay: number;
  overallProgress: number;
  activeDay: {
    day: number;
    date: string | null;
    topics: Array<{
      id: string;
      name: string;
      status: "completed" | "in_progress" | "pending";
      difficulty: "easy" | "medium" | "hard";
      duration: string;
      content: string;
      resources: Resource[];
    }>;
  } | null;
  days: Array<{
    day: number;
    date: string | null;
    topics: Array<{
      id: string;
      name: string;
      status: "completed" | "in_progress" | "pending";
      difficulty: "easy" | "medium" | "hard";
      duration: string;
      content: string;
      resources: Resource[];
    }>;
  }>;
};

export default function StudyPlanPage() {
  const [studyPlan, setStudyPlan] = useState<StudyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isCompletingDay, setIsCompletingDay] = useState(false);

  const [subject, setSubject] = useState("");
  const [exam, setExam] = useState("");
  const [totalDays, setTotalDays] = useState(30);
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [learningGoals, setLearningGoals] = useState("");

  const loadPlan = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/study-plan", { cache: "no-store" });
      if (response.ok) {
        const json = await response.json();
        setStudyPlan((json.data as StudyPlanData | null) ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleGeneratePlan = async () => {
    if (!subject.trim() || !exam.trim() || totalDays <= 0 || hoursPerDay <= 0) {
      setError("Please fill all required fields.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/studyplan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          exam,
          totalDays,
          hoursPerDay,
          learningGoals,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error || "Failed to generate study plan.");
        return;
      }

      setShowCreateForm(false);
      await loadPlan();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteDay = async () => {
    setError("");
    setIsCompletingDay(true);

    try {
      const response = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_day" }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error || "Failed to complete day.");
        return;
      }

      await loadPlan();
    } finally {
      setIsCompletingDay(false);
    }
  };

  const handleStudyDay = (day: NonNullable<StudyPlanData["activeDay"]>) => {
    const firstResource = day.topics.flatMap((topic) => topic.resources)[0];
    if (firstResource?.url) {
      window.open(firstResource.url, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] p-6 lg:p-10 max-w-[1200px] mx-auto flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-foreground/[0.04] border border-foreground/10 flex items-center justify-center mb-4">
            <Spinner className="size-8" />
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!studyPlan) {
    return (
      <div className="p-6 lg:p-10 max-w-[900px] mx-auto">
        <div className="border border-foreground/10 p-8 md:p-10">
          <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-3">
            No study plan yet
          </h1>
          <p className="text-muted-foreground mb-6">
            Your workspace is quiz-first. Create your personalized study plan
            whenever you are ready.
          </p>

          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="rounded-full"
            >
              Create Study Plan
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full px-4 py-3 border border-foreground/10 bg-transparent focus:outline-none focus:border-foreground/30"
                  placeholder="e.g. Physics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Exam / Target
                </label>
                <input
                  value={exam}
                  onChange={(event) => setExam(event.target.value)}
                  className="w-full px-4 py-3 border border-foreground/10 bg-transparent focus:outline-none focus:border-foreground/30"
                  placeholder="e.g. JEE 2026 / Semester Finals"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Total Days
                  </label>
                  <input
                    type="number"
                    value={totalDays}
                    onChange={(event) =>
                      setTotalDays(Number(event.target.value))
                    }
                    className="w-full px-4 py-3 border border-foreground/10 bg-transparent focus:outline-none focus:border-foreground/30"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hours per Day
                  </label>
                  <input
                    type="number"
                    value={hoursPerDay}
                    onChange={(event) =>
                      setHoursPerDay(Number(event.target.value))
                    }
                    className="w-full px-4 py-3 border border-foreground/10 bg-transparent focus:outline-none focus:border-foreground/30"
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Learning Goals (optional)
                </label>
                <textarea
                  value={learningGoals}
                  onChange={(event) => setLearningGoals(event.target.value)}
                  className="w-full px-4 py-3 border border-foreground/10 bg-transparent focus:outline-none focus:border-foreground/30 min-h-28"
                  placeholder="Tell AI what to focus on"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <Button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  className="rounded-full"
                >
                  {isGenerating ? "Building Plan..." : "Build Plan"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError("");
                  }}
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      <div className="mb-10">
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-3">
          <span className="w-8 h-px bg-foreground/30" />
          Study Plan
        </span>
        <h1 className="text-3xl lg:text-4xl font-display tracking-tight">
          {studyPlan.exam} Roadmap
        </h1>
        <p className="text-muted-foreground mt-2">
          {studyPlan.subject} · {studyPlan.totalDays} days ·{" "}
          {studyPlan.hoursPerDay}h/day
        </p>
      </div>

      <div className="mb-10 border border-foreground/10 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-mono text-muted-foreground">
            {studyPlan.overallProgress}%
          </span>
        </div>
        <div className="relative w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-foreground rounded-full transition-all duration-1000"
            style={{ width: `${studyPlan.overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-muted-foreground font-mono">
          <span>
            Day {studyPlan.currentDay} of {studyPlan.totalDays}
          </span>
          <span>
            {studyPlan.totalDays - studyPlan.currentDay} days remaining
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {studyPlan.activeDay ? (
            <Button
              onClick={() =>
                handleStudyDay(
                  studyPlan.activeDay as NonNullable<
                    StudyPlanData["activeDay"]
                  >,
                )
              }
              className="rounded-full"
            >
              Study Day {studyPlan.activeDay.day}
            </Button>
          ) : null}

          <Button
            variant="outline"
            onClick={handleCompleteDay}
            disabled={isCompletingDay}
            className="rounded-full"
          >
            {isCompletingDay ? "Completing..." : "Complete Day"}
          </Button>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      </div>

      <div className="space-y-6">
        {studyPlan.days.map((day) => {
          const isCurrentDay = day.day === studyPlan.currentDay;
          const isPastDay = day.day < studyPlan.currentDay;
          const isLockedDay = day.day > studyPlan.currentDay;
          const allCompleted = day.topics.every(
            (topic) => topic.status === "completed",
          );

          return (
            <div
              key={day.day}
              className={`border transition-all duration-300 ${
                isCurrentDay
                  ? "border-foreground shadow-sm"
                  : isPastDay && allCompleted
                    ? "border-green-200"
                    : "border-foreground/10"
              }`}
            >
              <div
                className={`px-6 py-4 border-b flex items-center justify-between ${
                  isCurrentDay
                    ? "border-foreground/20 bg-foreground/[0.02]"
                    : isPastDay && allCompleted
                      ? "border-green-100 bg-green-50/30"
                      : "border-foreground/5"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-display text-2xl">
                    {String(day.day).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="font-medium text-sm">
                      Day {day.day}
                      {isCurrentDay && (
                        <span className="ml-2 text-xs font-mono bg-foreground text-background px-2 py-0.5">
                          TODAY
                        </span>
                      )}
                    </div>
                    {day.date && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {day.date}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {allCompleted ? (
                    <span className="text-xs font-mono text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Complete
                    </span>
                  ) : isLockedDay ? (
                    <span className="text-xs font-mono text-amber-600">
                      Locked
                    </span>
                  ) : isCurrentDay ? (
                    <span className="text-xs font-mono text-blue-600 flex items-center gap-1">
                      <Play className="w-3 h-3" /> In Progress
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground">
                      {day.topics.length} topics
                    </span>
                  )}
                </div>
              </div>

              <div className="divide-y divide-foreground/5">
                {day.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className={`px-6 py-4 flex items-start gap-4 ${isLockedDay ? "opacity-60" : ""}`}
                  >
                    <div className="mt-0.5">
                      {topic.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : topic.status === "in_progress" ? (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-foreground/20" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className={`font-medium ${topic.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                        >
                          {topic.name}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            topic.difficulty === "hard"
                              ? "bg-red-100 text-red-600"
                              : topic.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-600"
                          }`}
                        >
                          {topic.difficulty}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {topic.duration}
                      </div>

                      <div className="mb-3">
                        {isLockedDay ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full h-8 px-3 text-xs"
                            disabled
                          >
                            View Content
                          </Button>
                        ) : (
                          <Button
                            asChild
                            type="button"
                            variant="outline"
                            className="rounded-full h-8 px-3 text-xs"
                          >
                            <Link
                              href={`/dashboard/study-plan/module/${topic.id}`}
                            >
                              View Content
                            </Link>
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {topic.resources.map((resource, index) => (
                          <a
                            key={`${topic.id}-${index}`}
                            href={isLockedDay ? undefined : resource.url}
                            target={isLockedDay ? undefined : "_blank"}
                            rel={
                              isLockedDay ? undefined : "noopener noreferrer"
                            }
                            onClick={(event) => {
                              if (isLockedDay) {
                                event.preventDefault();
                              }
                            }}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 border transition-all duration-200 ${
                              isLockedDay
                                ? "border-foreground/10 text-muted-foreground cursor-not-allowed"
                                : "border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                resource.type === "video"
                                  ? "bg-red-400"
                                  : resource.type === "practice"
                                    ? "bg-blue-400"
                                    : "bg-green-400"
                              }`}
                            />
                            {resource.title}
                            <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
