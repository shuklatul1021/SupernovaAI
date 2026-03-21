import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userBackgrounds } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Award, BookOpen, Flame, Target, Trophy } from "lucide-react";
import { ProgressGraph } from "./progress-graph";
import { getProgressSnapshot } from "@/lib/workspaceInit";

export const metadata = {
  title: "Progress | Supernova",
  description: "Track your learning journey",
};

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  const [user, background, snapshot] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
    db.query.userBackgrounds.findFirst({
      where: eq(userBackgrounds.userId, session.user.id),
      orderBy: [desc(userBackgrounds.createdAt)],
    }),
    getProgressSnapshot(session.user.id),
  ]);

  const graphData = snapshot.progress.weeklyStudyHours.map(
    (day: { day: string; hours: number }) => ({
      date: day.day,
      hours: day.hours,
    }),
  );

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display tracking-tight mb-2">
            Your Progress
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Keep up the good work, {user?.name?.split(" ")[0] || "Student"}!
          </p>
        </div>

        <div className="hidden md:flex items-center gap-6 px-6 py-3 bg-foreground/5 rounded-2xl border border-foreground/10">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-display flex items-center gap-1">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />{" "}
              {snapshot.progress.overallStats.studyStreak}
            </span>
            <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
              Day Streak
            </span>
          </div>
          <div className="w-px h-8 bg-foreground/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-display flex items-center gap-1">
              <BookOpen className="w-5 h-5 text-blue-500" />{" "}
              {snapshot.progress.overallStats.completedTopics}
            </span>
            <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
              Topics Done
            </span>
          </div>
        </div>
      </div>

      <div className="bg-background rounded-3xl border border-foreground/10 p-6 md:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-24 h-24 rounded-2xl bg-foreground/10 border border-foreground/20 flex items-center justify-center text-3xl font-display shrink-0">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-semibold">{user?.name}</h2>
            <div className="text-muted-foreground text-sm flex flex-wrap gap-4 font-mono">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Goal: Complete Syllabus
              </span>
              {background?.educationLevel === "school" ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-foreground/5 border border-foreground/10">
                  High School · {background.grade}
                </span>
              ) : background?.educationLevel === "college" ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-foreground/5 border border-foreground/10">
                  College · {background.course} in {background.branch}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-display flex items-center gap-2">
          Study Activity{" "}
          <span className="text-xs font-mono text-muted-foreground font-normal ml-2">
            This Week
          </span>
        </h3>
        <div className="bg-background rounded-3xl border border-foreground/10 p-6 md:p-8">
          <ProgressGraph data={graphData} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-display">Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              title: "Quiz Champion",
              desc: `Average score ${snapshot.progress.overallStats.averageScore}%`,
              icon: Trophy,
              color: "text-yellow-500",
              bg: "bg-yellow-500/10",
              border: "border-yellow-500/20",
            },
            {
              title: "Consistency Streak",
              desc: `${snapshot.progress.overallStats.studyStreak} day streak`,
              icon: Flame,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
              border: "border-orange-500/20",
            },
            {
              title: "Topic Finisher",
              desc: `${snapshot.progress.overallStats.completedTopics} topics completed`,
              icon: Award,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
              border: "border-purple-500/20",
            },
          ].map((achievement, index) => (
            <div
              key={index}
              className={`p-5 rounded-2xl border ${achievement.border} flex flex-col gap-4 bg-background transition-transform hover:-translate-y-1`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${achievement.bg} ${achievement.color}`}
              >
                <achievement.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">{achievement.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {achievement.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
