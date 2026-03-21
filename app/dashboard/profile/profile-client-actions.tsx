"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ProfileClientActions() {
  return (
    <div className="mt-6 md:mt-0">
      <Button 
        variant="outline" 
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border-foreground/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors w-full md:w-auto"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Log out
      </Button>
    </div>
  );
}
