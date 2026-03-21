import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studyPlans, topics } from "@/lib/db/schema";

type Resource = {
  type: "video" | "article" | "practice";
  title: string;
  url: string;
};

function isValidResource(value: unknown): value is Resource {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.type === "video" ||
      candidate.type === "article" ||
      candidate.type === "practice") &&
    typeof candidate.title === "string" &&
    typeof candidate.url === "string"
  );
}

export default async function ModuleContentPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { topicId } = await params;

  const plan = await db.query.studyPlans.findFirst({
    where: eq(studyPlans.userId, session.user.id),
    orderBy: [desc(studyPlans.createdAt)],
  });

  if (!plan) {
    notFound();
  }

  const [topic, planTopics] = await Promise.all([
    db.query.topics.findFirst({
      where: eq(topics.id, topicId),
    }),
    db.query.topics.findMany({
      where: eq(topics.studyPlanId, plan.id),
    }),
  ]);

  if (!topic || topic.studyPlanId !== plan.id) {
    notFound();
  }

  type PlanTopicRow = {
    day: number;
    status: string;
  };

  const typedPlanTopics = planTopics as PlanTopicRow[];

  const inProgressTopic = typedPlanTopics.find(
    (entry: PlanTopicRow) => entry.status === "in_progress",
  );
  const firstPendingTopic = typedPlanTopics.find(
    (entry: PlanTopicRow) => entry.status === "pending",
  );
  const currentDay =
    inProgressTopic?.day ??
    firstPendingTopic?.day ??
    typedPlanTopics
      .map((entry: PlanTopicRow) => entry.day)
      .sort((first: number, second: number) => first - second)[0];

  if (topic.day > currentDay) {
    redirect("/dashboard/study-plan");
  }

  const parsedResources = (() => {
    if (!topic.resources) {
      return [] as Resource[];
    }

    try {
      const raw = JSON.parse(topic.resources) as unknown;
      if (!Array.isArray(raw)) {
        return [] as Resource[];
      }
      return raw.filter(isValidResource).slice(0, 2);
    } catch {
      return [] as Resource[];
    }
  })();

  const content =
    topic.notes && topic.notes.trim().length
      ? topic.notes
      : `Study ${topic.name} in detail with examples, formulas, and revision notes.`;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/dashboard/study-plan"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Study Plan
        </Link>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-mono text-muted-foreground">
          Day {topic.day} • {plan.subject}
        </p>
        <h1 className="text-3xl lg:text-4xl font-display tracking-tight">
          {topic.name}
        </h1>
      </div>

      <div className="border border-foreground/10 p-6 lg:p-8 bg-foreground/[0.02]">
        <h2 className="text-lg font-semibold mb-4">Module Content</h2>
        <div className="whitespace-pre-wrap leading-7 text-sm lg:text-base">
          {content}
        </div>
      </div>

      {parsedResources.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Learning Links</h3>
          <div className="flex flex-wrap gap-2">
            {parsedResources.map((resource, index) => (
              <a
                key={`${resource.url}-${index}`}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all"
              >
                {resource.title}
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
