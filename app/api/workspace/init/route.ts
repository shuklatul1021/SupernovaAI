import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureWorkspaceInitialized } from "@/lib/workspaceInit";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await ensureWorkspaceInitialized(session.user.id);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Workspace initialization failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to initialize workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
