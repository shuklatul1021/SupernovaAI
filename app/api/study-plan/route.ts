import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studyPlans, topics } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await db.query.studyPlans.findFirst({
    where: eq(studyPlans.userId, session.user.id),
    orderBy: [desc(studyPlans.createdAt)],
  });

  if (!plan) {
    return NextResponse.json({ success: true, data: null });
  }

  const allTopics = await db.query.topics.findMany({
    where: eq(topics.studyPlanId, plan.id),
  });

  type TopicRow = {
    id: string;
    day: number;
    name: string;
    status: string;
    difficulty: string | null;
    resources: string | null;
  };

  const typedTopics = allTopics as TopicRow[];

  const daysFromPlanData = (() => {
    if (!plan.planData) {
      return [] as Array<{ day: number; date?: string }>;
    }

    try {
      const parsed = JSON.parse(plan.planData) as Array<{
        day?: number;
        date?: string;
      }>;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((entry) => typeof entry.day === "number")
        .map((entry) => ({
          day: entry.day as number,
          date: typeof entry.date === "string" ? entry.date : undefined,
        }));
    } catch {
      return [];
    }
  })();

  const dayDateMap = new Map(
    daysFromPlanData.map((entry) => [entry.day, entry.date]),
  );

  const groupedByDay: Record<number, TopicRow[]> = {};
  for (const topic of typedTopics) {
    const current = groupedByDay[topic.day] ?? [];
    current.push(topic);
    groupedByDay[topic.day] = current;
  }

  const days = Object.entries(groupedByDay)
    .map(([day, dayTopics]) => ({
      day: Number(day),
      date: dayDateMap.get(Number(day)) ?? null,
      topics: dayTopics.map((topic: TopicRow) => {
        const parsedResources = topic.resources
          ? JSON.parse(topic.resources)
          : [];
        return {
          id: topic.id,
          name: topic.name,
          status: topic.status,
          difficulty: topic.difficulty ?? "medium",
          duration: "2h",
          resources: Array.isArray(parsedResources) ? parsedResources : [],
        };
      }),
    }))
    .sort((first, second) => first.day - second.day);

  const completedTopics = typedTopics.filter(
    (topic: TopicRow) => topic.status === "completed",
  ).length;
  const inProgressDay = days.find((day) =>
    day.topics.some(
      (topic: { status: string }) => topic.status === "in_progress",
    ),
  );
  const currentDay =
    inProgressDay?.day ??
    days.find((day) =>
      day.topics.some(
        (topic: { status: string }) => topic.status !== "completed",
      ),
    )?.day ??
    1;
  const overallProgress = typedTopics.length
    ? Math.round((completedTopics / allTopics.length) * 100)
    : 0;

  return NextResponse.json({
    success: true,
    data: {
      id: plan.id,
      subject: plan.subject,
      exam: plan.exam,
      totalDays: plan.totalDays,
      currentDay,
      hoursPerDay: plan.hoursPerDay,
      status: plan.status,
      overallProgress,
      days,
    },
  });
}
