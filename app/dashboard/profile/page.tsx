import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studySessions, userBackgrounds, users } from "@/lib/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Target, Mail, GraduationCap } from "lucide-react";
import ProfileClientActions from "./profile-client-actions";

export const metadata = {
  title: "Profile | Supernova",
  description: "View your profile and study activity",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  // Fetch user details and background
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const background = await db.query.userBackgrounds.findFirst({
    where: eq(userBackgrounds.userId, session.user.id),
    orderBy: [desc(userBackgrounds.createdAt)],
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 99);
  startDate.setHours(0, 0, 0, 0);

  const sessions = await db.query.studySessions.findMany({
    where: and(
      eq(studySessions.userId, session.user.id),
      gte(studySessions.date, startDate),
    ),
    orderBy: [studySessions.date],
  });

  const activityData = Array.from({ length: 100 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (99 - index));
    date.setHours(0, 0, 0, 0);

    const daySession = sessions.find(
      (entry) => new Date(entry.date).toDateString() === date.toDateString(),
    );
    const hours = Number(daySession?.hours ?? 0);

    const intensity =
      hours <= 0 ? 0 : hours < 1 ? 1 : hours < 2 ? 2 : hours < 3 ? 3 : 4;
    return { date, intensity };
  });

  // Helper for heatmap colors
  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return "bg-foreground/5";
      case 1:
        return "bg-foreground/30";
      case 2:
        return "bg-foreground/50";
      case 3:
        return "bg-foreground/75";
      case 4:
        return "bg-foreground";
      default:
        return "bg-foreground/5";
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-display tracking-tight mb-2">
          Your Profile
        </h1>
        <p className="text-muted-foreground">
          View your activity, profile details, and account status.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-background rounded-3xl border border-foreground/10 p-6 md:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
            <div className="w-24 h-24 rounded-2xl bg-foreground/10 border border-foreground/20 flex items-center justify-center text-3xl font-display shrink-0 overflow-hidden">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">{user?.name}</h2>
                <div className="text-muted-foreground text-sm flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Mail className="w-4 h-4" /> {user?.email}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-mono">
                {background?.educationLevel === "school" ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-foreground/5 border border-foreground/10">
                    <GraduationCap className="w-4 h-4" /> High School ·{" "}
                    {background.grade}
                  </span>
                ) : background?.educationLevel === "college" ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-foreground/5 border border-foreground/10">
                    <GraduationCap className="w-4 h-4" /> College ·{" "}
                    {background.course} in {background.branch}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-foreground/5 border border-foreground/10 text-muted-foreground">
                  <Target className="w-4 h-4" /> Goal: Complete Syllabus
                </span>
              </div>
            </div>
          </div>

          <ProfileClientActions />
        </div>
      </div>

      {/* GitHub-style Activity Heat Map */}
      <div className="space-y-4">
        <h3 className="text-xl font-display flex items-center gap-2">
          Study Streak
          <span className="text-xs font-mono text-muted-foreground font-normal ml-2">
            Last 100 days
          </span>
        </h3>

        <div className="bg-background rounded-3xl border border-foreground/10 p-6 md:p-8 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {/* Split data into columns of 7 days (weeks) */}
            {Array.from({ length: Math.ceil(activityData.length / 7) }).map(
              (_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {activityData
                    .slice(weekIndex * 7, (weekIndex + 1) * 7)
                    .map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        title={`${day.date.toDateString()}: ${day.intensity > 0 ? day.intensity + " study sessions" : "No activity"}`}
                        className={`w-4 h-4 rounded-sm transition-colors hover:ring-2 ring-foreground/30 ${getIntensityColor(day.intensity)}`}
                      />
                    ))}
                </div>
              ),
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>Learn everyday to build your streak.</span>
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${getIntensityColor(i)}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
