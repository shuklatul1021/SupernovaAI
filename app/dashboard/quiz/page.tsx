"use client";

import { useState } from "react";
import { mockQuizQuestions, mockQuizResult } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, XCircle, BarChart3 } from "lucide-react";

type QuizState = "intro" | "quiz" | "results";

export default function QuizPage() {
  const [state, setState] = useState<QuizState>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);

  const question = mockQuizQuestions[currentQuestion];
  const isAnswered = question && selectedAnswers[question.id] !== undefined;
  const isCorrect = isAnswered && selectedAnswers[question.id] === question.correctAnswer;

  const handleAnswer = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswers(prev => ({ ...prev, [question.id]: optionIndex }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestion < mockQuizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setState("results");
    }
  };

  if (state === "intro") {
    return (
      <div className="p-6 lg:p-10 max-w-[800px] mx-auto">
        <div className="mb-10">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-3">
            <span className="w-8 h-px bg-foreground/30" />
            Diagnostic Quiz
          </span>
          <h1 className="text-3xl lg:text-4xl font-display tracking-tight">
            Test your knowledge
          </h1>
          <p className="text-muted-foreground mt-2">
            Take an adaptive quiz to identify your strengths and weaknesses. The AI will use your results to build a personalized study plan.
          </p>
        </div>

        <div className="border border-foreground/10 p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-foreground/[0.02] border border-foreground/5">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium text-sm">Physics — JEE Mains</div>
                <div className="text-xs text-muted-foreground">{mockQuizQuestions.length} questions · ~15 mins</div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>This quiz covers key topics in Physics to assess your preparation level:</p>
              <ul className="space-y-2 ml-4">
                {["Kinematics", "Newton's Laws", "Work & Energy", "Thermodynamics", "Circular Motion"].map((topic) => (
                  <li key={topic} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => setState("quiz")}
              className="w-full bg-foreground hover:bg-foreground/90 text-background h-12 text-base rounded-full group"
            >
              Start Quiz
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Previous Results */}
        <div className="mt-8 border border-foreground/10 p-6">
          <h2 className="text-lg font-display mb-4">Previous Results</h2>
          <div className="flex items-center justify-between p-4 border border-foreground/5">
            <div>
              <div className="font-medium text-sm">Physics Quiz</div>
              <div className="text-xs text-muted-foreground">{mockQuizResult.date} · {mockQuizResult.timeTaken}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-display">{mockQuizResult.score}%</div>
              <div className="text-xs text-muted-foreground">{mockQuizResult.correctAnswers}/{mockQuizResult.totalQuestions} correct</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "quiz") {
    return (
      <div className="p-6 lg:p-10 max-w-[800px] mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-mono text-muted-foreground">
              Question {currentQuestion + 1} of {mockQuizQuestions.length}
            </span>
            <span className="text-xs font-mono text-muted-foreground bg-foreground/5 px-2 py-1">
              {question.topic}
            </span>
          </div>
          <div className="relative w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-foreground rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestion + 1) / mockQuizQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="border border-foreground/10 p-8 mb-6">
          <h2 className="text-xl lg:text-2xl font-display leading-relaxed mb-8">
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, i) => {
              const isSelected = selectedAnswers[question.id] === i;
              const isCorrectOption = question.correctAnswer === i;

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={isAnswered}
                  className={`w-full text-left px-5 py-4 border transition-all duration-300 flex items-center gap-4 group ${
                    isAnswered
                      ? isCorrectOption
                        ? "border-green-400 bg-green-50/50"
                        : isSelected
                        ? "border-red-400 bg-red-50/50"
                        : "border-foreground/5 opacity-50"
                      : "border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02]"
                  }`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center border text-sm font-mono shrink-0 transition-all ${
                    isAnswered
                      ? isCorrectOption
                        ? "border-green-400 bg-green-400 text-white"
                        : isSelected
                        ? "border-red-400 bg-red-400 text-white"
                        : "border-foreground/10"
                      : "border-foreground/20 group-hover:border-foreground/40"
                  }`}>
                    {isAnswered && isCorrectOption ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isAnswered && isSelected ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="text-sm">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className={`border p-6 mb-6 ${isCorrect ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                {isCorrect ? "Correct!" : "Incorrect"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}

        {/* Next Button */}
        {isAnswered && (
          <Button
            onClick={handleNext}
            className="w-full bg-foreground hover:bg-foreground/90 text-background h-12 text-base rounded-full group"
          >
            {currentQuestion < mockQuizQuestions.length - 1 ? "Next Question" : "See Results"}
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        )}
      </div>
    );
  }

  // Results
  return (
    <div className="p-6 lg:p-10 max-w-[800px] mx-auto">
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-3 mx-auto">
          <span className="w-8 h-px bg-foreground/30" />
          Quiz Complete
          <span className="w-8 h-px bg-foreground/30" />
        </span>
        <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-4">
          {mockQuizResult.score}%
        </h1>
        <p className="text-muted-foreground">
          {mockQuizResult.correctAnswers} out of {mockQuizResult.totalQuestions} correct
        </p>
      </div>

      {/* Topic Breakdown */}
      <div className="border border-foreground/10 p-6 mb-6">
        <h2 className="text-lg font-display mb-6">Topic Breakdown</h2>
        <div className="space-y-4">
          {mockQuizResult.topicBreakdown.map((topic) => (
            <div key={topic.topic}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{topic.topic}</span>
                <span className="flex items-center gap-2">
                  <span className={`text-xs font-mono px-2 py-0.5 ${
                    topic.strength === "strong"
                      ? "bg-green-100 text-green-700"
                      : topic.strength === "moderate"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {topic.strength}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {topic.correct}/{topic.total}
                  </span>
                </span>
              </div>
              <div className="relative w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                    topic.strength === "strong"
                      ? "bg-green-500"
                      : topic.strength === "moderate"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${topic.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => {
            setState("intro");
            setCurrentQuestion(0);
            setSelectedAnswers({});
            setShowExplanation(false);
          }}
          className="flex-1 bg-foreground hover:bg-foreground/90 text-background h-12 text-base rounded-full"
        >
          Retake Quiz
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12 text-base rounded-full border-foreground/20 hover:bg-foreground/5"
          onClick={() => window.location.href = "/dashboard/study-plan"}
        >
          View Study Plan
        </Button>
      </div>
    </div>
  );
}
