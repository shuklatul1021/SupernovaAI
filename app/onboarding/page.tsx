"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GraduationCap, School, ArrowRight, ChevronLeft } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [educationLevel, setEducationLevel] = useState<"school" | "college" | null>(null);
  const [grade, setGrade] = useState("");
  const [course, setCourse] = useState("");
  const [branch, setBranch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleContinueToStep2 = () => {
    if (educationLevel) setStep(2);
  };

  const handleSubmit = async () => {
    if (!educationLevel) return;
    
    // Validation
    if (educationLevel === "school" && !grade) return;
    if (educationLevel === "college" && (!course || !branch)) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          educationLevel,
          grade: educationLevel === "school" ? grade : null,
          course: educationLevel === "college" ? course : null,
          branch: educationLevel === "college" ? branch : null,
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 noise-overlay">
      <div className="w-full max-w-lg">
        {/* Progress header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {step === 2 && (
                <button 
                  onClick={() => setStep(1)} 
                  className="p-1 hover:bg-foreground/5 rounded-full transition-colors mr-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs font-mono text-muted-foreground">Welcome to Supernova</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Step {step} of 2</span>
          </div>
          <div className="w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-foreground rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: useMemo(() => `${(step / 2) * 100}%`, [step]) }}
            />
          </div>
        </div>

        {step === 1 ? (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl lg:text-4xl font-display tracking-tight mb-3">
                Tell us about yourself
              </h1>
              <p className="text-muted-foreground">
                This helps the AI generate a study plan tailored to your curriculum.
              </p>
            </div>

            <div className="space-y-4 mb-10">
              {/* School Option */}
              <button
                onClick={() => setEducationLevel("school")}
                className={`w-full flex items-center gap-6 p-6 border text-left transition-all duration-300 group ${
                  educationLevel === "school"
                    ? "border-foreground bg-foreground/[0.02] shadow-sm"
                    : "border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.01]"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${
                  educationLevel === "school" ? "bg-foreground text-background border-foreground" : "border-foreground/20 text-muted-foreground group-hover:text-foreground"
                }`}>
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-medium mb-1">High School Student</div>
                  <div className="text-sm text-muted-foreground">Preparing for boards, SAT, JEE, NEET, etc.</div>
                </div>
              </button>

              {/* College Option */}
              <button
                onClick={() => setEducationLevel("college")}
                className={`w-full flex items-center gap-6 p-6 border text-left transition-all duration-300 group ${
                  educationLevel === "college"
                    ? "border-foreground bg-foreground/[0.02] shadow-sm"
                    : "border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.01]"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${
                  educationLevel === "college" ? "bg-foreground text-background border-foreground" : "border-foreground/20 text-muted-foreground group-hover:text-foreground"
                }`}>
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-medium mb-1">College/University Student</div>
                  <div className="text-sm text-muted-foreground">Preparing for semesters, GRE, GMAT, placements.</div>
                </div>
              </button>
            </div>

            <Button
              onClick={handleContinueToStep2}
              disabled={!educationLevel}
              className="w-full h-14 text-base rounded-full bg-foreground hover:bg-foreground/90 text-background group disabled:opacity-50"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl lg:text-4xl font-display tracking-tight mb-3">
                A bit more detail
              </h1>
              <p className="text-muted-foreground">
                We use this to find the best resources for your specific branch or class.
              </p>
            </div>

            <div className="space-y-6 mb-10">
              {educationLevel === "school" ? (
                <div>
                  <label className="block font-medium mb-3">Which class are you in?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Class 9", "Class 10", "Class 11", "Class 12", "Dropper"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={`p-4 border text-center transition-all ${
                          grade === g
                            ? "border-foreground bg-foreground text-background"
                            : "border-foreground/10 hover:border-foreground/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="course" className="block text-sm font-medium mb-2">
                      Course
                    </label>
                    <input
                      id="course"
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-4 py-3 border border-foreground/10 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                      placeholder="e.g. B.Tech, B.Sc, BCA"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium mb-2">
                      Branch / Major
                    </label>
                    <input
                      id="branch"
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-4 py-3 border border-foreground/10 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                      placeholder="e.g. Computer Science, Mechanical"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                (educationLevel === "school" && !grade) ||
                (educationLevel === "college" && (!course || !branch))
              }
              className="w-full h-14 text-base rounded-full bg-foreground hover:bg-foreground/90 text-background flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Start Studying"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
