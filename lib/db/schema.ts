import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ─── NextAuth Tables ───────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  onboardingCompleted: integer("onboarding_completed").default(0), // 0 for false, 1 for true
  workspaceInitialized: integer("workspace_initialized").default(0), // 0 for false, 1 for true
  educationLevel: text("education_level"), // "school" or "college"
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const userBackgrounds = pgTable("user_backgrounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  educationLevel: text("education_level").notNull(), // "school" or "college"
  grade: text("grade"), // e.g., "Class 10", "Class 12"
  course: text("course"), // e.g., "B.Tech", "B.Sc"
  branch: text("branch"), // e.g., "Computer Science", "Mechanical"
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ─── Application Tables ────────────────────────────────

export const studyPlans = pgTable("study_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  exam: text("exam"),
  totalDays: integer("total_days").notNull(),
  hoursPerDay: integer("hours_per_day").notNull(),
  planData: text("plan_data"), // JSON string of day-by-day plan
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const quizResults = pgTable("quiz_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  studyPlanId: uuid("study_plan_id").references(() => studyPlans.id),
  subject: text("subject").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  score: real("score").notNull(),
  topicBreakdown: text("topic_breakdown"), // JSON string
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  studyPlanId: uuid("study_plan_id").references(() => studyPlans.id, {
    onDelete: "cascade",
  }),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  question: text("question").notNull(),
  options: text("options").notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const userMetrics = pgTable("user_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  studyStreak: integer("study_streak").notNull().default(0),
  totalStudyHours: real("total_study_hours").notNull().default(0),
  topicsCompleted: integer("topics_completed").notNull().default(0),
  averageQuizScore: real("average_quiz_score").notNull().default(0),
  quizzesTaken: integer("quizzes_taken").notNull().default(0),
  lastStudyDate: timestamp("last_study_date", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  hours: real("hours").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  studyPlanId: uuid("study_plan_id")
    .notNull()
    .references(() => studyPlans.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  day: integer("day").notNull(),
  status: text("status").notNull().default("pending"),
  difficulty: text("difficulty"),
  resources: text("resources"), // JSON string
  notes: text("notes"),
});
