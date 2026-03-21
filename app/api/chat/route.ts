import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import {
  chatMessages,
  quizQuestions,
  quizResults,
  studyPlans,
  topics,
  userBackgrounds,
  users,
} from "@/lib/db/schema";
import { trackUserActivity } from "@/lib/workspaceInit";

type ChatRequestBody = {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recentMessages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.userId, session.user.id),
      orderBy: [desc(chatMessages.createdAt)],
      limit: 100,
    });

    const messages = [...recentMessages].reverse().map((entry) => ({
      role: entry.role as "user" | "assistant",
      content: entry.content,
    }));

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Chat history API error:", error);
    return NextResponse.json(
      { error: "Failed to load chat history" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ChatRequestBody;
    const message = body?.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    await db.insert(chatMessages).values({
      userId: session.user.id,
      role: "user",
      content: message,
    });

    await trackUserActivity(session.user.id, {
      actionType: "chat_message",
      entityType: "chat",
      durationMinutes: 2,
      metadata: { role: "user" },
    });

    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    const [user, background, plan, latestQuiz] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
      db.query.userBackgrounds.findFirst({
        where: eq(userBackgrounds.userId, session.user.id),
        orderBy: [desc(userBackgrounds.createdAt)],
      }),
      db.query.studyPlans.findFirst({
        where: eq(studyPlans.userId, session.user.id),
        orderBy: [desc(studyPlans.createdAt)],
      }),
      db.query.quizResults.findFirst({
        where: eq(quizResults.userId, session.user.id),
        orderBy: [desc(quizResults.createdAt)],
      }),
    ]);

    const [planTopics, currentQuizQuestions] = await Promise.all([
      plan
        ? db.query.topics.findMany({ where: eq(topics.studyPlanId, plan.id) })
        : Promise.resolve([]),
      db.query.quizQuestions.findMany({
        where: eq(quizQuestions.userId, session.user.id),
        orderBy: [quizQuestions.createdAt],
      }),
    ]);

    type PlanTopicRow = {
      day: number;
      name: string;
      status: string;
      difficulty: string | null;
    };

    type QuizQuestionRow = {
      topic: string;
    };

    const typedPlanTopics = planTopics as PlanTopicRow[];
    const typedQuizQuestions = currentQuizQuestions as QuizQuestionRow[];

    type QuizTopicBreakdown = {
      topic: string;
      total: number;
      correct: number;
      percentage: number;
      strength: "strong" | "moderate" | "weak";
    };

    const parsedTopicBreakdown = (() => {
      if (!latestQuiz?.topicBreakdown) {
        return [] as QuizTopicBreakdown[];
      }

      try {
        const parsed = JSON.parse(
          latestQuiz.topicBreakdown,
        ) as QuizTopicBreakdown[];
        if (!Array.isArray(parsed)) {
          return [] as QuizTopicBreakdown[];
        }
        return parsed;
      } catch {
        return [] as QuizTopicBreakdown[];
      }
    })();

    const currentDay = (() => {
      if (!typedPlanTopics.length) {
        return null;
      }

      const inProgress = typedPlanTopics.find(
        (topic: PlanTopicRow) => topic.status === "in_progress",
      );
      if (inProgress) {
        return inProgress.day;
      }

      const pending = typedPlanTopics.find(
        (topic: PlanTopicRow) => topic.status === "pending",
      );
      if (pending) {
        return pending.day;
      }

      return (
        typedPlanTopics
          .map((topic: PlanTopicRow) => topic.day)
          .sort((first: number, second: number) => first - second)[0] ?? null
      );
    })();

    const activeDayTopics =
      currentDay === null
        ? []
        : typedPlanTopics
            .filter((topic: PlanTopicRow) => topic.day === currentDay)
            .map((topic: PlanTopicRow) => ({
              name: topic.name,
              status: topic.status,
              difficulty: topic.difficulty ?? "medium",
            }));

    const quizTopicCounts = typedQuizQuestions.reduce(
      (accumulator: Record<string, number>, question: QuizQuestionRow) => {
        const current = accumulator[question.topic] ?? 0;
        accumulator[question.topic] = current + 1;
        return accumulator;
      },
      {},
    );

    const weakTopics = parsedTopicBreakdown
      .filter((entry) => entry.strength === "weak")
      .map((entry) => entry.topic);

    const strongTopics = parsedTopicBreakdown
      .filter((entry) => entry.strength === "strong")
      .map((entry) => entry.topic);

    const historyText = (body.history ?? [])
      .slice(-8)
      .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
      .join("\n");

    const profile = {
      name: user?.name ?? "Student",
      educationLevel: background?.educationLevel ?? null,
      grade: background?.grade ?? null,
      course: background?.course ?? null,
      branch: background?.branch ?? null,
      activePlan: plan
        ? {
            subject: plan.subject,
            exam: plan.exam,
            totalDays: plan.totalDays,
            hoursPerDay: plan.hoursPerDay,
            currentDay,
            activeDayTopics,
          }
        : null,
      currentQuiz: {
        totalQuestions: currentQuizQuestions.length,
        topicDistribution: quizTopicCounts,
      },
      latestQuiz: latestQuiz
        ? {
            score: latestQuiz.score,
            totalQuestions: latestQuiz.totalQuestions,
            weakTopics,
            strongTopics,
            topicBreakdown: parsedTopicBreakdown,
          }
        : null,
    };

    const systemInstruction = `You are Supernova AI study assistant. Give concise, practical answers for students.
Use this profile context when relevant:\n${JSON.stringify(profile, null, 2)}
Priority behavior:
- If currentDay and activeDayTopics exist, anchor recommendations to today's topics first.
- If weakTopics exist, include targeted improvement steps for those topics.
- Keep guidance personalized to current quiz distribution and latest quiz performance.
- If plan data is missing, still help with general guidance.`;

    const prompt = [
      historyText ? `Conversation so far:\n${historyText}` : "",
      `User message:\n${message}`,
      "Respond with clear steps and short actionable advice.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const genAI = new GoogleGenAI({ apiKey });
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const reply = typeof response.text === "string" ? response.text.trim() : "";

    if (!reply) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    await db.insert(chatMessages).values({
      userId: session.user.id,
      role: "assistant",
      content: reply,
    });

    await trackUserActivity(session.user.id, {
      actionType: "chat_message",
      entityType: "chat",
      durationMinutes: 1,
      metadata: { role: "assistant" },
    });

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 },
    );
  }
}
