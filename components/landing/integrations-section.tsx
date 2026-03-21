"use client";

import { useEffect, useState, useRef } from "react";

const subjects = [
  { name: "Physics", category: "Science" },
  { name: "Chemistry", category: "Science" },
  { name: "Mathematics", category: "Core" },
  { name: "Biology", category: "Science" },
  { name: "Computer Science", category: "Tech" },
  { name: "English", category: "Language" },
  { name: "JEE Mains", category: "Exam" },
  { name: "NEET", category: "Exam" },
  { name: "SAT", category: "Exam" },
  { name: "GRE", category: "Exam" },
  { name: "AP Calculus", category: "AP" },
  { name: "GCSE Science", category: "UK Exam" },
];

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="integrations" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 lg:mb-24 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Subjects & Exams
            <span className="w-8 h-px bg-foreground/30" />
          </span>
          <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-6">
            Every subject.
            <br />
            Every exam board.
          </h2>
          <p className="text-xl text-muted-foreground">
            50+ subjects and exams covered. From school boards to competitive exams, we&apos;ve got you covered.
          </p>
        </div>

      </div>
      
      {/* Full-width marquees outside container */}
      <div className="w-full mb-6">
        <div className="flex gap-6 marquee">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-6 shrink-0">
              {subjects.map((subject) => (
                <div
                  key={`${subject.name}-${setIndex}`}
                  className="shrink-0 px-8 py-6 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all duration-300 group"
                >
                  <div className="text-lg font-medium group-hover:translate-x-1 transition-transform">
                    {subject.name}
                  </div>
                  <div className="text-sm text-muted-foreground">{subject.category}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Reverse marquee */}
      <div className="w-full">
        <div className="flex gap-6 marquee-reverse">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-6 shrink-0">
              {[...subjects].reverse().map((subject) => (
                <div
                  key={`${subject.name}-reverse-${setIndex}`}
                  className="shrink-0 px-8 py-6 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all duration-300 group"
                >
                  <div className="text-lg font-medium group-hover:translate-x-1 transition-transform">
                    {subject.name}
                  </div>
                  <div className="text-sm text-muted-foreground">{subject.category}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
