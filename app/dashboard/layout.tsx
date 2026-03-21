import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import DashboardClientLayout from "./dashboard-client-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Check onboarding status
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { onboardingCompleted: true, workspaceInitialized: true },
  });

  if (!user?.onboardingCompleted) {
    redirect("/onboarding");
  }

  if (!user.workspaceInitialized) {
    redirect("/onboarding/creating-workspace");
  }

  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
