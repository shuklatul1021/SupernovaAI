import { NextResponse } from "next/server";
import { mockProgressData, mockUser } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      user: {
        name: mockUser.name,
        streak: mockUser.streak,
        totalStudyHours: mockUser.totalStudyHours,
        plansCompleted: mockUser.plansCompleted,
      },
      progress: mockProgressData,
    },
  });
}
