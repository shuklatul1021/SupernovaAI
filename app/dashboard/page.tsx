"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  Flame,
  Target,
  Clock,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

type ProgressResponse = {
  user: {
    name: string;
    streak: number;
    totalStudyHours: number;
    plansCompleted: number;
  };
  progress: {
    overallStats: {
      totalTopics: number;
      completedTopics: number;
      averageScore: number;
    };
  };
  latestQuiz: {
    topicBreakdown: Array<{
      topic: string;
      percentage: number;
      strength: "strong" | "moderate" | "weak";
    }>;
  } | null;
  activePlan: {
    subject: string;
    exam: string;
    totalDays: number;
  } | null;
};

type StudyPlanResponse = {
  id: string;
  totalDays: number;
  currentDay: number;
  overallProgress: number;
  days: Array<{
    day: number;
    date: string | null;
    topics: Array<{
      id: string;
      name: string;
      status: "completed" | "in_progress" | "pending";
      difficulty: "easy" | "medium" | "hard";
      duration: string;
    }>;
  }>;
};

export default function DashboardPage() {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [progressRes, planRes] = await Promise.all([
          fetch("/api/progress", { cache: "no-store" }),
          fetch("/api/study-plan", { cache: "no-store" }),
        ]);

        if (progressRes.ok) {
          const progressJson = await progressRes.json();
          setProgress(progressJson.data as ProgressResponse);
        }

        if (planRes.ok) {
          const planJson = await planRes.json();
          setStudyPlan(planJson.data as StudyPlanResponse);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const weakTopics = useMemo(
    () =>
      progress?.latestQuiz?.topicBreakdown?.filter(
        (topic) => topic.strength === "weak",
      ) ?? [],
    [progress],
  );

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

  if (!progress) {
    return (
      <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
        <p className="text-muted-foreground">No workspace data found yet.</p>
      </div>
    );
  }

  const currentDay = studyPlan?.days.find(
    (day) => day.day === studyPlan.currentDay,
  );

  const statCards = [
    {
      label: "Study Streak",
      value: `${progress.user.streak} days`,
      icon: Flame,
      color: "text-orange-500",
    },
    {
      label: "Topics Completed",
      value: `${progress.progress.overallStats.completedTopics}/${progress.progress.overallStats.totalTopics}`,
      icon: Target,
      color: "text-green-500",
    },
    {
      label: "Avg Quiz Score",
      value: `${progress.progress.overallStats.averageScore}%`,
      icon: Brain,
      color: "text-blue-500",
    },
    {
      label: "Study Hours",
      value: `${Math.round(progress.user.totalStudyHours)}h`,
      icon: Clock,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      <div className="mb-10">
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-3">
          <span className="w-8 h-px bg-foreground/30" />
          Dashboard
        </span>
        <h1 className="text-3xl lg:text-4xl font-display tracking-tight">
          Welcome back, {progress.user.name.split(" ")[0]} 👋
        </h1>
        {studyPlan ? (
          <p className="text-muted-foreground mt-2">
            Day {studyPlan.currentDay} of {studyPlan.totalDays} ·{" "}
            {progress.activePlan?.exam ?? "Your Plan"}
          </p>
        ) : (
          <p className="text-muted-foreground mt-2">
            Quiz workspace is ready. Create your study plan when you are ready.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="border border-foreground/10 p-5 hover:border-foreground/20 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <TrendingUp className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl lg:text-3xl font-display">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-foreground/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-display">Today&apos;s Study Plan</h2>
              <p className="text-sm text-muted-foreground">
                {studyPlan ? `Day ${studyPlan.currentDay}` : "No plan yet"}
              </p>
            </div>
            <Link
              href="/dashboard/study-plan"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {studyPlan ? "View full plan" : "Create plan"}{" "}
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {studyPlan ? (
            <div className="space-y-4">
              {(currentDay?.topics ?? []).map((topic) => (
                <div
                  key={topic.id}
                  className={`flex items-center gap-4 p-4 border transition-all duration-300 ${
                    topic.status === "completed"
                      ? "border-green-200 bg-green-50/50"
                      : topic.status === "in_progress"
                        ? "border-blue-200 bg-blue-50/50"
                        : "border-foreground/10"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      topic.status === "completed"
                        ? "bg-green-500"
                        : topic.status === "in_progress"
                          ? "bg-blue-500 animate-pulse"
                          : "bg-foreground/20"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{topic.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3">
                      <span>{topic.duration}</span>
                      <span>·</span>
                      <span
                        className={`capitalize ${
                          topic.difficulty === "hard"
                            ? "text-red-500"
                            : topic.difficulty === "medium"
                              ? "text-yellow-600"
                              : "text-green-500"
                        }`}
                      >
                        {topic.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 border border-foreground/10 text-sm text-muted-foreground">
              No study plan available yet. Go to Study Plan and create one.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="border border-foreground/10 p-6">
            <h3 className="text-lg font-display mb-4">Overall Progress</h3>
            <div className="relative w-full h-3 bg-foreground/10 rounded-full overflow-hidden mb-3">
              <div
                className="absolute top-0 left-0 h-full bg-foreground rounded-full transition-all duration-1000"
                style={{ width: `${studyPlan?.overallProgress ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {studyPlan?.overallProgress ?? 0}% complete
              </span>
              <span className="font-mono text-muted-foreground">
                {studyPlan
                  ? `${studyPlan.totalDays - studyPlan.currentDay} days left`
                  : "No plan yet"}
              </span>
            </div>
          </div>

          <div className="border border-foreground/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display">Weak Areas</h3>
              <Link
                href="/dashboard/quiz"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Take quiz →
              </Link>
            </div>
            {weakTopics.length > 0 ? (
              <div className="space-y-3">
                {weakTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{topic.topic}</span>
                    <span className="text-xs font-mono text-red-500">
                      {topic.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No weak areas identified yet. Take a quiz!
              </p>
            )}
          </div>

          <div className="border border-foreground/10 p-6">
            <h3 className="text-lg font-display mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/quiz"
                className="flex items-center gap-3 px-4 py-3 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all duration-300 group"
              >
                <Brain className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm group-hover:translate-x-1 transition-transform">
                  Take a diagnostic quiz
                </span>
              </Link>
              <Link
                href="/dashboard/study-plan"
                className="flex items-center gap-3 px-4 py-3 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all duration-300 group"
              >
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm group-hover:translate-x-1 transition-transform">
                  View study roadmap
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
