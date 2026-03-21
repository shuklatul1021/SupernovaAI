"use client";

import { mockStudyPlan } from "@/lib/mock-data";
import { CheckCircle, Circle, Play, ExternalLink } from "lucide-react";

export default function StudyPlanPage() {
  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-3">
          <span className="w-8 h-px bg-foreground/30" />
          Study Plan
        </span>
        <h1 className="text-3xl lg:text-4xl font-display tracking-tight">
          {mockStudyPlan.exam} Roadmap
        </h1>
        <p className="text-muted-foreground mt-2">
          {mockStudyPlan.subject} · {mockStudyPlan.totalDays} days · {mockStudyPlan.hoursPerDay}h/day
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-10 border border-foreground/10 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-mono text-muted-foreground">{mockStudyPlan.overallProgress}%</span>
        </div>
        <div className="relative w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-foreground rounded-full transition-all duration-1000"
            style={{ width: `${mockStudyPlan.overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-muted-foreground font-mono">
          <span>Day {mockStudyPlan.currentDay} of {mockStudyPlan.totalDays}</span>
          <span>{mockStudyPlan.totalDays - mockStudyPlan.currentDay} days remaining</span>
        </div>
      </div>

      {/* Day-by-Day Plan */}
      <div className="space-y-6">
        {mockStudyPlan.days.map((day) => {
          const isCurrentDay = day.day === mockStudyPlan.currentDay;
          const isPastDay = day.day < mockStudyPlan.currentDay;
          const allCompleted = day.topics.every(t => t.status === "completed");

          return (
            <div
              key={day.day}
              className={`border transition-all duration-300 ${
                isCurrentDay
                  ? "border-foreground shadow-sm"
                  : isPastDay && allCompleted
                  ? "border-green-200"
                  : "border-foreground/10"
              }`}
            >
              {/* Day Header */}
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                isCurrentDay
                  ? "border-foreground/20 bg-foreground/[0.02]"
                  : isPastDay && allCompleted
                  ? "border-green-100 bg-green-50/30"
                  : "border-foreground/5"
              }`}>
                <div className="flex items-center gap-4">
                  <span className="font-display text-2xl">
                    {String(day.day).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="font-medium text-sm">
                      Day {day.day}
                      {isCurrentDay && (
                        <span className="ml-2 text-xs font-mono bg-foreground text-background px-2 py-0.5">
                          TODAY
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{day.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {allCompleted ? (
                    <span className="text-xs font-mono text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Complete
                    </span>
                  ) : isCurrentDay ? (
                    <span className="text-xs font-mono text-blue-600 flex items-center gap-1">
                      <Play className="w-3 h-3" /> In Progress
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground">
                      {day.topics.length} topics
                    </span>
                  )}
                </div>
              </div>

              {/* Topics */}
              <div className="divide-y divide-foreground/5">
                {day.topics.map((topic, i) => (
                  <div key={i} className="px-6 py-4 flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="mt-0.5">
                      {topic.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : topic.status === "in_progress" ? (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-foreground/20" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`font-medium ${
                          topic.status === "completed" ? "line-through text-muted-foreground" : ""
                        }`}>
                          {topic.name}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          topic.difficulty === "hard"
                            ? "bg-red-100 text-red-600"
                            : topic.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-600"
                        }`}>
                          {topic.difficulty}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{topic.duration}</div>

                      {/* Resources */}
                      <div className="flex flex-wrap gap-2">
                        {topic.resources.map((resource, j) => (
                          <a
                            key={j}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all duration-200"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              resource.type === "video" ? "bg-red-400" : resource.type === "practice" ? "bg-blue-400" : "bg-green-400"
                            }`} />
                            {resource.title}
                            <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
