import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProgressSnapshot } from "@/lib/workspaceInit";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getProgressSnapshot(session.user.id);

  return NextResponse.json({
    success: true,
    data: {
      user: snapshot.user,
      progress: snapshot.progress,
      latestQuiz: snapshot.latestQuiz,
      activePlan: snapshot.activePlan
        ? {
            id: snapshot.activePlan.id,
            subject: snapshot.activePlan.subject,
            exam: snapshot.activePlan.exam,
            totalDays: snapshot.activePlan.totalDays,
            hoursPerDay: snapshot.activePlan.hoursPerDay,
          }
        : null,
    },
  });
}
