import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import {
  quizResults,
  studyPlans,
  userBackgrounds,
  users,
} from "@/lib/db/schema";

type ChatRequestBody = {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
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
          }
        : null,
      latestQuiz: latestQuiz
        ? {
            score: latestQuiz.score,
            totalQuestions: latestQuiz.totalQuestions,
          }
        : null,
    };

    const systemInstruction = `You are Supernova AI study assistant. Give concise, practical answers for students.
Use this profile context when relevant:\n${JSON.stringify(profile, null, 2)}
If plan data is missing, still help with general guidance.`;

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

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 },
    );
  }
}
