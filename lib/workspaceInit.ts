import { and, desc, eq, gte, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/db";
import {
  quizQuestions,
  quizResults,
  studyPlans,
  studySessions,
  topics,
  userActivityLogs,
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

type QuizGenerationInput = {
  subject?: string;
  exam?: string;
  totalQuestions?: number;
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
  content: string;
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

type ActivityActionType =
  | "workspace_initialized"
  | "study_plan_generated"
  | "quiz_submitted"
  | "chat_message"
  | "topic_completed";

type TrackUserActivityInput = {
  actionType: ActivityActionType;
  entityType: "workspace" | "study_plan" | "quiz" | "chat" | "topic";
  entityId?: string | null;
  durationMinutes?: number;
  metadata?: Record<string, unknown>;
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

function buildFallbackResources(
  subject: string,
  topic: string,
): PlanResource[] {
  const query = `${subject} ${topic}`.trim();
  const encodedQuery = encodeURIComponent(query);
  const wikiTopic = encodeURIComponent(topic.trim().replace(/\s+/g, "_"));

  return [
    {
      type: "video",
      title: `${topic} - YouTube lessons`,
      url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
    },
    {
      type: "article",
      title: `${topic} - Documentation / Notes`,
      url: `https://en.wikipedia.org/wiki/${wikiTopic}`,
    },
  ];
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeResourceLinks(resources: PlanResource[]): PlanResource[] {
  const uniqueUrls = new Set<string>();

  return resources
    .filter((resource) => isValidHttpUrl(resource.url))
    .filter((resource) => {
      if (uniqueUrls.has(resource.url)) {
        return false;
      }
      uniqueUrls.add(resource.url);
      return true;
    })
    .slice(0, 2);
}

function dayKey(input: Date): string {
  return new Date(input).toISOString().slice(0, 10);
}

async function recomputeAndUpsertMetrics(userId: string) {
  const [quizzesAgg, topicsDoneCount, sessions] = await Promise.all([
    db
      .select({
        avgScore: sql<number>`coalesce(avg(${quizResults.score}), 0)`,
        quizzesTaken: sql<number>`count(*)`,
      })
      .from(quizResults)
      .where(eq(quizResults.userId, userId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(topics)
      .innerJoin(studyPlans, eq(topics.studyPlanId, studyPlans.id))
      .where(
        and(eq(studyPlans.userId, userId), eq(topics.status, "completed")),
      ),
    db.query.studySessions.findMany({
      where: eq(studySessions.userId, userId),
      orderBy: [desc(studySessions.date)],
    }),
  ]);

  const averageQuizScore = Number(quizzesAgg[0]?.avgScore ?? 0);
  const quizzesTaken = Number(quizzesAgg[0]?.quizzesTaken ?? 0);
  const topicsCompleted = Number(topicsDoneCount[0]?.count ?? 0);
  const totalStudyHours = sessions.reduce(
    (sum: number, session: { hours: number }) =>
      sum + Number(session.hours ?? 0),
    0,
  );

  const activeDays = new Set(
    sessions.map((session: { date: Date }) => dayKey(new Date(session.date))),
  );
  const today = getTodayAtMidnight();
  let cursor = new Date(today);
  let studyStreak = 0;

  while (activeDays.has(dayKey(cursor))) {
    studyStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  await db
    .insert(userMetrics)
    .values({
      userId,
      studyStreak,
      totalStudyHours,
      topicsCompleted,
      averageQuizScore,
      quizzesTaken,
      lastStudyDate: activeDays.has(dayKey(today)) ? today : null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userMetrics.userId,
      set: {
        studyStreak,
        totalStudyHours,
        topicsCompleted,
        averageQuizScore,
        quizzesTaken,
        lastStudyDate: activeDays.has(dayKey(today)) ? today : null,
        updatedAt: new Date(),
      },
    });
}

export async function trackUserActivity(
  userId: string,
  input: TrackUserActivityInput,
) {
  const durationMinutes = Math.max(0, Number(input.durationMinutes ?? 0));

  await db.insert(userActivityLogs).values({
    userId,
    actionType: input.actionType,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    durationMinutes,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });

  if (durationMinutes > 0) {
    const today = getTodayAtMidnight();
    const existingSession = await db.query.studySessions.findFirst({
      where: and(
        eq(studySessions.userId, userId),
        eq(studySessions.date, today),
      ),
    });

    const incrementHours = Number((durationMinutes / 60).toFixed(2));

    if (existingSession) {
      await db
        .update(studySessions)
        .set({ hours: Number(existingSession.hours ?? 0) + incrementHours })
        .where(eq(studySessions.id, existingSession.id));
    } else {
      await db.insert(studySessions).values({
        userId,
        date: today,
        hours: incrementHours,
      });
    }
  }

  await recomputeAndUpsertMetrics(userId);
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

          const safeResources = normalizeResourceLinks(
            resources.length
              ? resources
              : buildFallbackResources(fallbackInput.subject, topic.name),
          );

          const difficulty =
            topic.difficulty === "easy" || topic.difficulty === "hard"
              ? topic.difficulty
              : "medium";

          return {
            name: topic.name,
            difficulty,
            duration:
              typeof topic.duration === "string" ? topic.duration : "2h",
            content:
              typeof topic.content === "string" && topic.content.trim().length
                ? topic.content.trim()
                : `Module: ${topic.name}\n\n1) Core concepts:\n- Definition and key ideas\n- Why this topic matters\n\n2) Worked understanding:\n- One simple real example\n- One common mistake to avoid\n\n3) Revision notes:\n- Important formulas or rules\n- 3 quick recap points`,
            resources: safeResources,
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

  console.log("Gemini raw response:", response);

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

async function generateQuizForContext(
  profile: ProfileInput,
  input: QuizGenerationInput,
): Promise<QuizGeneration> {
  const desiredQuestions = Math.min(
    20,
    Math.max(5, Number(input.totalQuestions ?? 10)),
  );

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
- Return exactly ${desiredQuestions} questions.
- Focus on subject: ${input.subject ?? "General"}.
- Align exam context to: ${input.exam ?? "Diagnostic Quiz"}.
- Each question must have 4 options.
- correctAnswer must be a 0-based index.

Learner profile:
${JSON.stringify(profile, null, 2)}`;

  const raw = await callGemini(prompt);
  const normalized = normalizeQuizPayload(raw);

  return {
    subject: input.subject?.trim() || normalized.subject,
    exam: input.exam?.trim() || normalized.exam,
    quizQuestions: normalized.quizQuestions.slice(0, desiredQuestions),
  };
}

export async function createQuizForUser(
  userId: string,
  input: QuizGenerationInput,
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

  const generated = await generateQuizForContext(
    {
      name: user.name ?? "Student",
      educationLevel: latestBackground.educationLevel as "school" | "college",
      grade: latestBackground.grade,
      course: latestBackground.course,
      branch: latestBackground.branch,
    },
    input,
  );

  await db.delete(quizQuestions).where(eq(quizQuestions.userId, userId));

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

  await trackUserActivity(userId, {
    actionType: "quiz_submitted",
    entityType: "quiz",
    durationMinutes: 10,
    metadata: {
      generated: true,
      subject: generated.subject,
      exam: generated.exam,
      totalQuestions: questionRows.length,
    },
  });

  return {
    subject: generated.subject,
    exam: generated.exam,
    totalQuestions: questionRows.length,
  };
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
          "content": string,
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
- For every topic, return detailed AI learning content in "content" with:
  1) core concepts,
  2) worked understanding/example,
  3) revision notes,
  4) quick self-check questions.
- For every topic, return only 1 or 2 links in "resources".
- Prefer one YouTube link and one article/documentation link.
- Links must be real, valid HTTP/HTTPS URLs.

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

  await trackUserActivity(userId, {
    actionType: "workspace_initialized",
    entityType: "workspace",
    durationMinutes: 0,
    metadata: { quizCount: questionRows.length },
  });

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
      notes: topic.content,
    })),
  );

  if (topicRows.length) {
    await db.insert(topics).values(topicRows);
  }

  await trackUserActivity(userId, {
    actionType: "study_plan_generated",
    entityType: "study_plan",
    entityId: plan.id,
    durationMinutes: 20,
    metadata: {
      subject: generated.subject,
      exam: generated.exam,
      totalDays: generated.totalDays,
      hoursPerDay: generated.hoursPerDay,
    },
  });

  return {
    planId: plan.id,
    content: {
      subject: generated.subject,
      exam: generated.exam,
      totalDays: generated.totalDays,
      hoursPerDay: generated.hoursPerDay,
      days: generated.days,
    },
  };
}

export async function completeCurrentStudyDay(userId: string) {
  const plan = await db.query.studyPlans.findFirst({
    where: eq(studyPlans.userId, userId),
    orderBy: [desc(studyPlans.createdAt)],
  });

  if (!plan) {
    throw new Error("No study plan found");
  }

  const planTopics = await db.query.topics.findMany({
    where: eq(topics.studyPlanId, plan.id),
  });

  if (!planTopics.length) {
    throw new Error("No topics found for plan");
  }

  type PlanTopicRow = {
    id: string;
    day: number;
    name: string;
    status: string;
  };

  const typedPlanTopics = planTopics as PlanTopicRow[];

  const inProgressTopic = typedPlanTopics.find(
    (topic: PlanTopicRow) => topic.status === "in_progress",
  );
  const firstPendingTopic = typedPlanTopics.find(
    (topic: PlanTopicRow) => topic.status === "pending",
  );
  const currentDay =
    inProgressTopic?.day ??
    firstPendingTopic?.day ??
    typedPlanTopics
      .map((topic: PlanTopicRow) => topic.day)
      .sort((first: number, second: number) => first - second)[0];

  const currentDayTopics = typedPlanTopics.filter(
    (topic: PlanTopicRow) => topic.day === currentDay,
  );
  const nextDay =
    typedPlanTopics
      .map((topic: PlanTopicRow) => topic.day)
      .filter((day: number) => day > currentDay)
      .sort((first: number, second: number) => first - second)[0] ?? null;

  if (currentDayTopics.length) {
    await db
      .update(topics)
      .set({ status: "completed" })
      .where(and(eq(topics.studyPlanId, plan.id), eq(topics.day, currentDay)));
  }

  if (nextDay !== null) {
    const nextDayTopics = typedPlanTopics
      .filter((topic: PlanTopicRow) => topic.day === nextDay)
      .sort((first: PlanTopicRow, second: PlanTopicRow) =>
        first.name.localeCompare(second.name),
      );
    const nextTopic = nextDayTopics[0];

    if (nextTopic) {
      await db
        .update(topics)
        .set({ status: "in_progress" })
        .where(eq(topics.id, nextTopic.id));
    }
  }

  await trackUserActivity(userId, {
    actionType: "topic_completed",
    entityType: "topic",
    durationMinutes: Math.max(1, plan.hoursPerDay * 60),
    metadata: {
      studyPlanId: plan.id,
      completedDay: currentDay,
      completedTopics: currentDayTopics.length,
      nextDay,
    },
  });

  return {
    completedDay: currentDay,
    nextDay,
    completedTopics: currentDayTopics.length,
  };
}

export async function updateMetricsAfterQuiz(userId: string, score: number) {
  await trackUserActivity(userId, {
    actionType: "quiz_submitted",
    entityType: "quiz",
    durationMinutes: 60,
    metadata: { score },
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

  const weeklyActivities = await db.query.userActivityLogs.findMany({
    where: and(
      eq(userActivityLogs.userId, userId),
      gte(userActivityLogs.createdAt, getLast7DaysStart()),
    ),
    orderBy: [userActivityLogs.createdAt],
  });

  const recentActivities = await db.query.userActivityLogs.findMany({
    where: eq(userActivityLogs.userId, userId),
    orderBy: [desc(userActivityLogs.createdAt)],
    limit: 20,
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
      activities: weeklyActivities.filter(
        (activity: { createdAt: Date }) =>
          new Date(activity.createdAt).toDateString() === date.toDateString(),
      ).length,
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
    recentActivity: recentActivities.map(
      (activity: {
        id: string;
        actionType: string;
        entityType: string;
        durationMinutes: number;
        createdAt: Date;
        metadata: string | null;
      }) => ({
        id: activity.id,
        actionType: activity.actionType,
        entityType: activity.entityType,
        durationMinutes: activity.durationMinutes,
        createdAt: activity.createdAt,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
      }),
    ),
  };
}
