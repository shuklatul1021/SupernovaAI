"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but couldn't sign in. Please try signing in manually.");
      } else {
        router.push("/onboarding");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex noise-overlay">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background relative overflow-hidden">
        {/* Diagonal pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              currentColor 40px,
              currentColor 41px
            )`
          }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-2xl font-display">Supernova</span>
              <span className="text-xs text-background/50 font-mono">AI</span>
            </Link>
          </div>
          
          <div>
            <h1 className="text-5xl lg:text-6xl font-display leading-[1.1] mb-8">
              Start your
              <br />
              journey.
            </h1>
            <p className="text-xl text-background/60 max-w-md leading-relaxed">
              Join thousands of students studying smarter with AI-powered personalized study plans.
            </p>
            
            {/* Feature highlights */}
            <div className="mt-12 space-y-4">
              {[
                "AI-generated adaptive quizzes",
                "Personalized day-by-day study roadmap",
                "Curated free learning resources",
                "Track progress & adapt in real-time",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-background/70">
                  <span className="w-1.5 h-1.5 bg-background/40 rounded-full" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-background/40 font-mono">
            <span>100% free for students</span>
            <span>·</span>
            <span>No credit card</span>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-2xl font-display">Supernova</span>
              <span className="text-xs text-muted-foreground font-mono">AI</span>
            </Link>
          </div>

          <div className="mb-10">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />
              Create account
            </span>
            <h2 className="text-3xl lg:text-4xl font-display tracking-tight">
              Get started for free
            </h2>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-foreground/10 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-foreground/10 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-foreground/10 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors pr-12"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-foreground hover:bg-foreground/90 text-background h-12 text-base rounded-full group"
            >
              {isLoading ? "Creating account..." : "Create free account"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-foreground/10" />
            <span className="text-xs text-muted-foreground font-mono">or</span>
            <div className="flex-1 h-px bg-foreground/10" />
          </div>

          {/* Google Sign Up */}
          <Button
            variant="outline"
            className="w-full h-12 text-base rounded-full border-foreground/10 hover:bg-foreground/5"
            onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-foreground hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground/60">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
