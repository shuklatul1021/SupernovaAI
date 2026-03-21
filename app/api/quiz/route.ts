import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quizQuestions, quizResults, studyPlans } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { updateMetricsAfterQuiz } from "@/lib/workspaceInit";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [plan, questions, latestResult] = await Promise.all([
    db.query.studyPlans.findFirst({
      where: eq(studyPlans.userId, session.user.id),
      orderBy: [desc(studyPlans.createdAt)],
    }),
    db.query.quizQuestions.findMany({
      where: eq(quizQuestions.userId, session.user.id),
      orderBy: [quizQuestions.createdAt],
    }),
    db.query.quizResults.findFirst({
      where: eq(quizResults.userId, session.user.id),
      orderBy: [desc(quizResults.createdAt)],
    }),
  ]);

  const serializedQuestions = questions.map((question) => ({
    id: question.id,
    topic: question.topic,
    question: question.question,
    options: JSON.parse(question.options) as string[],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? "Review this topic and try again.",
  }));

  const inferredSubject = questions[0]?.subject ?? "General";

  return NextResponse.json({
    success: true,
    data: {
      questions: serializedQuestions,
      meta: {
        subject: plan?.subject ?? inferredSubject,
        exam: plan?.exam ?? "Diagnostic Quiz",
        totalQuestions: serializedQuestions.length,
        estimatedTime: "15 min",
      },
      previousResult: latestResult
        ? {
            id: latestResult.id,
            subject: latestResult.subject,
            totalQuestions: latestResult.totalQuestions,
            correctAnswers: latestResult.correctAnswers,
            score: latestResult.score,
            date: latestResult.createdAt,
            topicBreakdown: latestResult.topicBreakdown
              ? JSON.parse(latestResult.topicBreakdown)
              : [],
          }
        : null,
    },
  });
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answers } = (await request.json()) as {
      answers: Record<string, number>;
    };
    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const [plan, questions] = await Promise.all([
      db.query.studyPlans.findFirst({
        where: eq(studyPlans.userId, session.user.id),
        orderBy: [desc(studyPlans.createdAt)],
      }),
      db.query.quizQuestions.findMany({
        where: eq(quizQuestions.userId, session.user.id),
      }),
    ]);

    if (!questions.length) {
      return NextResponse.json(
        { success: false, error: "No quiz questions found for this user" },
        { status: 404 },
      );
    }

    let correctAnswers = 0;
    const topicMap: Record<string, { total: number; correct: number }> = {};

    for (const question of questions) {
      const selected = answers[question.id];
      const isCorrect = selected === question.correctAnswer;
      if (isCorrect) {
        correctAnswers += 1;
      }

      const current = topicMap[question.topic] ?? { total: 0, correct: 0 };
      current.total += 1;
      if (isCorrect) {
        current.correct += 1;
      }
      topicMap[question.topic] = current;
    }

    const totalQuestions = questions.length;
    const score = Number(((correctAnswers / totalQuestions) * 100).toFixed(2));
    const topicBreakdown = Object.entries(topicMap).map(([topic, value]) => {
      const percentage = Math.round((value.correct / value.total) * 100);
      return {
        topic,
        total: value.total,
        correct: value.correct,
        percentage,
        strength:
          percentage >= 75 ? "strong" : percentage >= 50 ? "moderate" : "weak",
      };
    });

    const [result] = await db
      .insert(quizResults)
      .values({
        userId: session.user.id,
        studyPlanId: plan?.id ?? null,
        subject: plan?.subject ?? "General",
        totalQuestions,
        correctAnswers,
        score,
        topicBreakdown: JSON.stringify(topicBreakdown),
      })
      .returning();

    await updateMetricsAfterQuiz(session.user.id, score);

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        subject: result.subject,
        totalQuestions,
        correctAnswers,
        score,
        topicBreakdown,
        date: result.createdAt,
        submittedAnswers: answers,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
