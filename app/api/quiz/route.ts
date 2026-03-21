import { NextResponse } from "next/server";
import { mockQuizQuestions, mockQuizResult } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      questions: mockQuizQuestions,
      meta: {
        subject: "Physics",
        exam: "JEE Mains",
        totalQuestions: mockQuizQuestions.length,
        estimatedTime: "15 min",
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const { answers } = await request.json();

    // In a real app, this would analyze the answers and generate results
    // For now, return mock results
    return NextResponse.json({
      success: true,
      data: {
        ...mockQuizResult,
        submittedAnswers: answers,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
