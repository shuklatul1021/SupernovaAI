import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userBackgrounds } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { educationLevel, grade, course, branch } = await request.json();

    if (!educationLevel || !["school", "college"].includes(educationLevel)) {
      return NextResponse.json({ error: "Invalid education level" }, { status: 400 });
    }

    // Insert detailed background
    await db.insert(userBackgrounds).values({
      userId: session.user.id,
      educationLevel,
      grade: grade || null,
      course: course || null,
      branch: branch || null,
    });

    // Update user record onboarding flag
    await db.update(users)
      .set({ 
        educationLevel,
        onboardingCompleted: 1 
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
