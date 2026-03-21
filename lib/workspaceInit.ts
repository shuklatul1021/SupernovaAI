import { and, desc, eq, gte, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/db";
import {
  quizQuestions,
  quizResults,
  studyPlans,
  studySessions,
  topics,
  userBackgrounds,
  userMetrics,
  users,
} from "@/lib/db/schema";

type ProfileInput = {
  name: string;
  educationLevel: "school" | "college";
  grade?: string | null;
  course?: string | null;
  branch?: string | null;
};

type QuizQuestionPlan = {
  topic: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type QuizGeneration = {
  subject: string;
  exam: string;
  quizQuestions: QuizQuestionPlan[];
};

type PlanResource = {
  type: "video" | "article" | "practice";
  title: string;
  url: string;
};

type PlanTopic = {
  name: string;
  difficulty: "easy" | "medium" | "hard";
  duration: string;
  resources: PlanResource[];
};

type PlanDay = {
  day: number;
  date?: string;
  topics: PlanTopic[];
};

type StudyPlanGeneration = {
  subject: string;
  exam: string;
  totalDays: number;
  hoursPerDay: number;
  days: PlanDay[];
};

type StudyPlanInput = {
  subject: string;
  exam: string;
  totalDays: number;
  hoursPerDay: number;
  learningGoals?: string;
};

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

function getTodayAtMidnight(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getLast7DaysStart(): Date {
  const date = getTodayAtMidnight();
  date.setDate(date.getDate() - 6);
  return date;
}

function normalizeQuizPayload(raw: unknown): QuizGeneration {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid Gemini quiz payload");
  }

  const payload = raw as Record<string, unknown>;
  const questionsRaw = payload.quizQuestions;

  if (!Array.isArray(questionsRaw) || !questionsRaw.length) {
    throw new Error("Quiz generation returned no questions");
  }

  const quizQuestionsSafe = questionsRaw
    .map((entry) => {
      const question = entry as Record<string, unknown>;
      if (
        typeof question.topic !== "string" ||
        typeof question.question !== "string" ||
        !Array.isArray(question.options)
      ) {
        return null;
      }

      const options = question.options.filter(
        (value): value is string => typeof value === "string",
      );
      if (options.length < 2) {
        return null;
      }

      const correctAnswer =
        typeof question.correctAnswer === "number" &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < options.length
          ? question.correctAnswer
          : 0;

      return {
        topic: question.topic,
        question: question.question,
        options,
        correctAnswer,
        explanation:
          typeof question.explanation === "string"
            ? question.explanation
            : "Review this concept and try again.",
      } as QuizQuestionPlan;
    })
    .filter((entry): entry is QuizQuestionPlan => Boolean(entry));

  if (!quizQuestionsSafe.length) {
    throw new Error("Quiz generation payload could not be normalized");
  }

  return {
    subject: typeof payload.subject === "string" ? payload.subject : "General",
    exam: typeof payload.exam === "string" ? payload.exam : "Diagnostic Quiz",
    quizQuestions: quizQuestionsSafe,
  };
}

function normalizeStudyPlanPayload(
  raw: unknown,
  fallbackInput: StudyPlanInput,
): StudyPlanGeneration {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid Gemini study-plan payload");
  }

  const payload = raw as Record<string, unknown>;
  const daysRaw = payload.days;

  if (!Array.isArray(daysRaw) || !daysRaw.length) {
    throw new Error("Study plan generation returned no days");
  }

  const days = daysRaw
    .map((dayEntry, index) => {
      const day = dayEntry as Record<string, unknown>;
      const topicsRaw = day.topics;
      if (!Array.isArray(topicsRaw) || !topicsRaw.length) {
        return null;
      }

      const topicsSafe = topicsRaw
        .map((topicEntry) => {
          const topic = topicEntry as Record<string, unknown>;
          const resourcesRaw = Array.isArray(topic.resources)
            ? topic.resources
            : [];
          if (typeof topic.name !== "string") {
            return null;
          }

          const resources = resourcesRaw
            .map((resourceEntry) => {
              const resource = resourceEntry as Record<string, unknown>;
              if (
                typeof resource.title !== "string" ||
                typeof resource.url !== "string"
              ) {
                return null;
              }
              const type =
                resource.type === "article" || resource.type === "practice"
                  ? resource.type
                  : "video";
              return {
                type,
                title: resource.title,
                url: resource.url,
              } as PlanResource;
            })
            .filter((resource): resource is PlanResource => Boolean(resource));

          const difficulty =
            topic.difficulty === "easy" || topic.difficulty === "hard"
              ? topic.difficulty
              : "medium";

          return {
            name: topic.name,
            difficulty,
            duration:
              typeof topic.duration === "string" ? topic.duration : "2h",
            resources,
          } as PlanTopic;
        })
        .filter((topic): topic is PlanTopic => Boolean(topic));

      if (!topicsSafe.length) {
        return null;
      }

      return {
        day: typeof day.day === "number" && day.day > 0 ? day.day : index + 1,
        date: typeof day.date === "string" ? day.date : undefined,
        topics: topicsSafe,
      } as PlanDay;
    })
    .filter((day): day is PlanDay => Boolean(day));

  if (!days.length) {
    throw new Error("Study plan payload could not be normalized");
  }

  return {
    subject:
      typeof payload.subject === "string"
        ? payload.subject
        : fallbackInput.subject,
    exam: typeof payload.exam === "string" ? payload.exam : fallbackInput.exam,
    totalDays:
      typeof payload.totalDays === "number" && payload.totalDays > 0
        ? Math.floor(payload.totalDays)
        : fallbackInput.totalDays,
    hoursPerDay:
      typeof payload.hoursPerDay === "number" && payload.hoursPerDay > 0
        ? Math.floor(payload.hoursPerDay)
        : fallbackInput.hoursPerDay,
    days,
  };
}

async function callGemini(prompt: string) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is missing");
  }

  const genAI = new GoogleGenAI({ apiKey });

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.5,
      responseMimeType: "application/json",
    },
  });

  const text = typeof response.text === "string" ? response.text : "";

  if (!text) {
    throw new Error("Gemini response was empty");
  }

  return JSON.parse(text) as unknown;
}

async function generateQuizOnly(
  profile: ProfileInput,
): Promise<QuizGeneration> {
  const prompt = `Generate ONLY a personalized quiz question set as valid JSON.

Return exactly this shape:
{
  "subject": string,
  "exam": string,
  "quizQuestions": [
    {
      "topic": string,
      "question": string,
      "options": string[],
      "correctAnswer": number,
      "explanation": string
    }
  ]
}

Rules:
- Return 10-15 questions.
- Keep questions aligned with the learner profile.
- Each question must have 4 options.
- correctAnswer must be a 0-based index.

Learner profile:
${JSON.stringify(profile, null, 2)}`;

  const raw = await callGemini(prompt);
  return normalizeQuizPayload(raw);
}

async function generateStudyPlan(
  profile: ProfileInput,
  input: StudyPlanInput,
): Promise<StudyPlanGeneration> {
  const prompt = `Generate ONLY a personalized study plan as valid JSON.

Return exactly this shape:
{
  "subject": string,
  "exam": string,
  "totalDays": number,
  "hoursPerDay": number,
  "days": [
    {
      "day": number,
      "date": string,
      "topics": [
        {
          "name": string,
          "difficulty": "easy" | "medium" | "hard",
          "duration": string,
          "resources": [
            { "type": "video" | "article" | "practice", "title": string, "url": string }
          ]
        }
      ]
    }
  ]
}

Rules:
- Use user-provided subject/exam/days/hours as primary constraints.
- Keep total days near requested days.
- Keep 2-5 topics per day.
- Include date only when meaningful.

Learner profile:
${JSON.stringify(profile, null, 2)}

Study plan request:
${JSON.stringify(input, null, 2)}`;

  const raw = await callGemini(prompt);
  return normalizeStudyPlanPayload(raw, input);
}

export async function ensureWorkspaceInitialized(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    throw new Error("User not found");
  }

  if (user.workspaceInitialized) {
    return { initializedNow: false };
  }

  const latestBackground = await db.query.userBackgrounds.findFirst({
    where: eq(userBackgrounds.userId, userId),
    orderBy: [desc(userBackgrounds.createdAt)],
  });

  if (!latestBackground) {
    throw new Error("Onboarding details not found");
  }

  const existingQuestions = await db.query.quizQuestions.findMany({
    where: eq(quizQuestions.userId, userId),
  });

  if (existingQuestions.length) {
    await db
      .update(users)
      .set({ workspaceInitialized: 1 })
      .where(eq(users.id, userId));
    await db
      .insert(userMetrics)
      .values({
        userId,
        studyStreak: 0,
        totalStudyHours: 0,
        topicsCompleted: 0,
        averageQuizScore: 0,
        quizzesTaken: 0,
      })
      .onConflictDoNothing();
    return { initializedNow: false, quizCount: existingQuestions.length };
  }

  const generated = await generateQuizOnly({
    name: user.name ?? "Student",
    educationLevel: latestBackground.educationLevel as "school" | "college",
    grade: latestBackground.grade,
    course: latestBackground.course,
    branch: latestBackground.branch,
  });

  const questionRows = generated.quizQuestions.map((question) => ({
    userId,
    studyPlanId: null,
    subject: generated.subject,
    topic: question.topic,
    question: question.question,
    options: JSON.stringify(question.options),
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  }));

  if (!questionRows.length) {
    throw new Error("Quiz generation returned no savable questions");
  }

  await db.insert(quizQuestions).values(questionRows);
  await db
    .insert(userMetrics)
    .values({
      userId,
      studyStreak: 0,
      totalStudyHours: 0,
      topicsCompleted: 0,
      averageQuizScore: 0,
      quizzesTaken: 0,
    })
    .onConflictDoNothing();

  await db
    .update(users)
    .set({ workspaceInitialized: 1 })
    .where(eq(users.id, userId));

  return { initializedNow: true, quizCount: questionRows.length };
}

export async function createStudyPlanForUser(
  userId: string,
  input: StudyPlanInput,
) {
  const [user, latestBackground] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.userBackgrounds.findFirst({
      where: eq(userBackgrounds.userId, userId),
      orderBy: [desc(userBackgrounds.createdAt)],
    }),
  ]);

  if (!user || !latestBackground) {
    throw new Error("User onboarding profile not found");
  }

  const generated = await generateStudyPlan(
    {
      name: user.name ?? "Student",
      educationLevel: latestBackground.educationLevel as "school" | "college",
      grade: latestBackground.grade,
      course: latestBackground.course,
      branch: latestBackground.branch,
    },
    input,
  );

  const [plan] = await db
    .insert(studyPlans)
    .values({
      userId,
      subject: generated.subject,
      exam: generated.exam,
      totalDays: generated.totalDays,
      hoursPerDay: generated.hoursPerDay,
      planData: JSON.stringify(generated.days),
      status: "active",
    })
    .returning();

  const topicRows = generated.days.flatMap((day, dayIndex) =>
    day.topics.map((topic, topicIndex) => ({
      studyPlanId: plan.id,
      name: topic.name,
      day: day.day,
      status: dayIndex === 0 && topicIndex === 0 ? "in_progress" : "pending",
      difficulty: topic.difficulty,
      resources: JSON.stringify(topic.resources),
      notes: null,
    })),
  );

  if (topicRows.length) {
    await db.insert(topics).values(topicRows);
  }

  return { planId: plan.id };
}

export async function updateMetricsAfterQuiz(userId: string, score: number) {
  const current = await db.query.userMetrics.findFirst({
    where: eq(userMetrics.userId, userId),
  });

  const topicsDoneCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(topics)
    .innerJoin(studyPlans, eq(topics.studyPlanId, studyPlans.id))
    .where(and(eq(studyPlans.userId, userId), eq(topics.status, "completed")));

  const topicsCompleted = Number(topicsDoneCount[0]?.count ?? 0);
  const quizzesTaken = (current?.quizzesTaken ?? 0) + 1;
  const averageQuizScore =
    current && current.quizzesTaken > 0
      ? (current.averageQuizScore * current.quizzesTaken + score) / quizzesTaken
      : score;

  const today = getTodayAtMidnight();
  const existingSession = await db.query.studySessions.findFirst({
    where: and(eq(studySessions.userId, userId), eq(studySessions.date, today)),
  });

  if (existingSession) {
    await db
      .update(studySessions)
      .set({ hours: existingSession.hours + 1 })
      .where(eq(studySessions.id, existingSession.id));
  } else {
    await db.insert(studySessions).values({ userId, date: today, hours: 1 });
  }

  const lastDate = current?.lastStudyDate;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = lastDate
    ? new Date(lastDate).toDateString() === yesterday.toDateString()
    : false;
  const isToday = lastDate
    ? new Date(lastDate).toDateString() === today.toDateString()
    : false;

  const studyStreak = isToday
    ? (current?.studyStreak ?? 1)
    : isYesterday
      ? (current?.studyStreak ?? 0) + 1
      : 1;

  await db
    .insert(userMetrics)
    .values({
      userId,
      studyStreak,
      totalStudyHours: (current?.totalStudyHours ?? 0) + 1,
      topicsCompleted,
      averageQuizScore,
      quizzesTaken,
      lastStudyDate: today,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userMetrics.userId,
      set: {
        studyStreak,
        totalStudyHours: (current?.totalStudyHours ?? 0) + 1,
        topicsCompleted,
        averageQuizScore,
        quizzesTaken,
        lastStudyDate: today,
        updatedAt: new Date(),
      },
    });
}

export async function getProgressSnapshot(userId: string) {
  const [user, metrics, plan, latestQuiz] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.userMetrics.findFirst({ where: eq(userMetrics.userId, userId) }),
    db.query.studyPlans.findFirst({
      where: eq(studyPlans.userId, userId),
      orderBy: [desc(studyPlans.createdAt)],
    }),
    db.query.quizResults.findFirst({
      where: eq(quizResults.userId, userId),
      orderBy: [desc(quizResults.createdAt)],
    }),
  ]);

  const planTopics = plan
    ? await db.query.topics.findMany({ where: eq(topics.studyPlanId, plan.id) })
    : [];

  const completedTopics = planTopics.filter(
    (topic: { status: string }) => topic.status === "completed",
  ).length;
  const inProgressTopics = planTopics.filter(
    (topic: { status: string }) => topic.status === "in_progress",
  ).length;
  const pendingTopics = planTopics.filter(
    (topic: { status: string }) => topic.status === "pending",
  ).length;

  const sessions = await db.query.studySessions.findMany({
    where: and(
      eq(studySessions.userId, userId),
      gte(studySessions.date, getLast7DaysStart()),
    ),
    orderBy: [studySessions.date],
  });

  const weeklyStudyHours = Array.from({ length: 7 }, (_, index) => {
    const date = getTodayAtMidnight();
    date.setDate(date.getDate() - (6 - index));
    const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
    const sameDay = sessions.find(
      (session: { date: Date }) =>
        new Date(session.date).toDateString() === date.toDateString(),
    );

    return {
      day: dayLabel,
      hours: Number(sameDay?.hours ?? 0),
    };
  });

  const topicProgress = planTopics.map(
    (topic: { name: string; status: string }) => ({
      topic: topic.name,
      progress:
        topic.status === "completed"
          ? 100
          : topic.status === "in_progress"
            ? 50
            : 0,
    }),
  );

  return {
    user: {
      name: user?.name ?? "Student",
      streak: metrics?.studyStreak ?? 0,
      totalStudyHours: metrics?.totalStudyHours ?? 0,
      plansCompleted: 0,
    },
    progress: {
      weeklyStudyHours,
      topicProgress,
      overallStats: {
        totalTopics: planTopics.length,
        completedTopics,
        inProgressTopics,
        pendingTopics,
        averageScore: Math.round(metrics?.averageQuizScore ?? 0),
        studyStreak: metrics?.studyStreak ?? 0,
      },
    },
    latestQuiz: latestQuiz
      ? {
          score: latestQuiz.score,
          totalQuestions: latestQuiz.totalQuestions,
          correctAnswers: latestQuiz.correctAnswers,
          topicBreakdown: latestQuiz.topicBreakdown
            ? JSON.parse(latestQuiz.topicBreakdown)
            : [],
          date: latestQuiz.createdAt,
        }
      : null,
    activePlan: plan,
    planTopics,
  };
}
