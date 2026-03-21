import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userBackgrounds } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Lock, 
  User, 
  GraduationCap, 
  ShieldAlert,
  LogOut
} from "lucide-react";

export const metadata = {
  title: "Settings | Supernova",
  description: "Manage your account and preferences",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  // Fetch user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const background = await db.query.userBackgrounds.findFirst({
    where: eq(userBackgrounds.userId, session.user.id),
    orderBy: [desc(userBackgrounds.createdAt)],
  });

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-display tracking-tight mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12 items-start">
        
        {/* Navigation Sidebar */}
        <nav className="flex flex-col gap-1 sticky top-20 hidden md:flex">
          {[
            { id: "education", label: "Education Details", icon: GraduationCap },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "security", label: "Security", icon: Lock },
          ].map((item) => (
            <a 
              key={item.id} 
              href={`#${item.id}`} 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </nav>

        {/* Settings Sections */}
        <div className="space-y-12">
          
          {/* Education Details Section */}
          <section id="education" className="space-y-6 scroll-mt-24">
            <h2 className="text-xl font-display flex items-center gap-2 border-b border-foreground/10 pb-4">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
              Education Background
            </h2>
            
            <div className="bg-foreground/5 rounded-2xl p-6 border border-foreground/10 space-y-4">
              <div className="grid gap-1">
                <span className="text-sm font-medium text-muted-foreground">Level</span>
                <span className="capitalize font-medium">{background?.educationLevel || 'Not set'}</span>
              </div>
              
              {background?.educationLevel === 'school' ? (
                <div className="grid gap-1 border-t border-foreground/10 pt-4 mt-2">
                  <span className="text-sm font-medium text-muted-foreground">Class / Grade</span>
                  <span className="font-medium">{background?.grade || 'Not set'}</span>
                </div>
              ) : background?.educationLevel === 'college' ? (
                <div className="grid grid-cols-2 gap-4 border-t border-foreground/10 pt-4 mt-2">
                  <div className="grid gap-1">
                    <span className="text-sm font-medium text-muted-foreground">Course</span>
                    <span className="font-medium">{background?.course || 'Not set'}</span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-sm font-medium text-muted-foreground">Branch / Major</span>
                    <span className="font-medium">{background?.branch || 'Not set'}</span>
                  </div>
                </div>
              ) : null}

              <div className="pt-4">
                <Button variant="outline" size="sm" className="rounded-full">Update Details</Button>
                <p className="text-xs text-muted-foreground mt-2 font-mono">Updating your background will reset ongoing AI study plans.</p>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section id="security" className="space-y-6 scroll-mt-24 pt-8">
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-4">
              <h2 className="text-xl font-display flex items-center gap-2 text-red-500">
                <ShieldAlert className="w-5 h-5" />
                Danger Zone
              </h2>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all of your content. This action is not reversible, so please continue with caution.
              </p>
              <Button variant="destructive" className="rounded-full">Delete Account</Button>
            </div>
          </section>

        </div>
      </div>
      
    </div>
  );
}
