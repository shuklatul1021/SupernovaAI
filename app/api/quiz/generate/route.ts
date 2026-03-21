import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createQuizForUser } from "@/lib/workspaceInit";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      subject?: string;
      exam?: string;
      totalQuestions?: number;
    };

    if (!body.subject?.trim() || !body.exam?.trim()) {
      return NextResponse.json(
        { error: "Subject and exam are required" },
        { status: 400 },
      );
    }

    const result = await createQuizForUser(session.user.id, {
      subject: body.subject,
      exam: body.exam,
      totalQuestions: Number(body.totalQuestions ?? 10),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Quiz generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 },
    );
  }
}
