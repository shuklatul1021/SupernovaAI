"use client";

import { useEffect, useState, useRef } from "react";

const regions = [
  { city: "India", region: "CBSE / JEE / NEET", latency: "12M+ students" },
  { city: "United States", region: "SAT / AP / GRE", latency: "8M+ students" },
  { city: "United Kingdom", region: "GCSE / A-Levels", latency: "3M+ students" },
  { city: "Australia", region: "HSC / ATAR", latency: "1.5M+ students" },
  { city: "Middle East", region: "IGCSE / IB", latency: "2M+ students" },
  { city: "Southeast Asia", region: "National Boards", latency: "4M+ students" },
];

export function InfrastructureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeLocation, setActiveLocation] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLocation((prev) => (prev + 1) % regions.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              Global Reach
            </span>
            <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-8">
              Every exam.
              <br />
              Every student.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-12">
              Supernova supports students across the globe — from JEE and NEET in India 
              to SAT and AP in the US, GCSE in the UK, and more. Study plans tailored to your exam board.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-4xl lg:text-5xl font-display mb-2">50+</div>
                <div className="text-sm text-muted-foreground">Exams supported</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-display mb-2">30+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-display mb-2">15+</div>
                <div className="text-sm text-muted-foreground">Languages</div>
              </div>
            </div>
          </div>

          {/* Right: Region list */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="border border-foreground/10">
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
                <span className="text-sm font-mono text-muted-foreground">Supported Regions</span>
                <span className="flex items-center gap-2 text-xs font-mono text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  All active
                </span>
              </div>

              {/* Regions */}
              <div>
                {regions.map((region, index) => (
                  <div
                    key={region.city}
                    className={`px-6 py-5 border-b border-foreground/5 last:border-b-0 flex items-center justify-between transition-all duration-300 ${
                      activeLocation === index ? "bg-foreground/[0.02]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span 
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          activeLocation === index ? "bg-foreground" : "bg-foreground/20"
                        }`}
                      />
                      <div>
                        <div className="font-medium">{region.city}</div>
                        <div className="text-sm text-muted-foreground">{region.region}</div>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">{region.latency}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
