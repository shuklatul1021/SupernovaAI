import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createStudyPlanForUser } from "@/lib/workspaceInit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      subject?: string;
      exam?: string;
      totalDays?: number;
      hoursPerDay?: number;
      learningGoals?: string;
    };

    if (!body.subject || !body.exam || !body.totalDays || !body.hoursPerDay) {
      return NextResponse.json(
        { error: "subject, exam, totalDays and hoursPerDay are required" },
        { status: 400 },
      );
    }

    const result = await createStudyPlanForUser(session.user.id, {
      subject: body.subject,
      exam: body.exam,
      totalDays: Number(body.totalDays),
      hoursPerDay: Number(body.hoursPerDay),
      learningGoals: body.learningGoals,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Study plan generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate study plan. Please retry." },
      { status: 500 },
    );
  }
}
