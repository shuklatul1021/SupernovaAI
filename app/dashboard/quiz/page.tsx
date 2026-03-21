"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, XCircle, BarChart3 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type QuizState = "intro" | "quiz" | "results";

type Question = {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type QuizResult = {
  id: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  date: string;
  topicBreakdown: Array<{
    topic: string;
    total: number;
    correct: number;
    percentage: number;
    strength: "strong" | "moderate" | "weak";
  }>;
};

export default function QuizPage() {
  const [state, setState] = useState<QuizState>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [meta, setMeta] = useState<{
    subject: string;
    exam: string;
    totalQuestions: number;
    estimatedTime: string;
  } | null>(null);
  const [previousResult, setPreviousResult] = useState<QuizResult | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await fetch("/api/quiz", { cache: "no-store" });
        if (response.ok) {
          const json = await response.json();
          setQuestions(json.data.questions as Question[]);
          setMeta(json.data.meta);
          setPreviousResult(
            (json.data.previousResult as QuizResult | null) ?? null,
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, []);

  const question = questions[currentQuestion];
  const isAnswered = question && selectedAnswers[question.id] !== undefined;
  const isCorrect =
    isAnswered && selectedAnswers[question.id] === question.correctAnswer;

  const handleAnswer = (optionIndex: number) => {
    if (isAnswered || !question) {
      return;
    }
    setSelectedAnswers((previous) => ({
      ...previous,
      [question.id]: optionIndex,
    }));
    setShowExplanation(true);
  };

  const handleNext = async () => {
    setShowExplanation(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
      return;
    }

    const response = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: selectedAnswers }),
    });

    if (response.ok) {
      const json = await response.json();
      setResult(json.data as QuizResult);
      setState("results");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] p-6 lg:p-10 max-w-[1200px] mx-auto flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-foreground/[0.04] border border-foreground/10 flex items-center justify-center mb-4">
            <Spinner className="size-8" />
        </div>
        <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
    </div>
    );
  }

  if (!questions.length || !meta) {
    return (
      <div className="p-6 lg:p-10 max-w-[800px] mx-auto">
        <p className="text-muted-foreground">No quiz available right now.</p>
      </div>
    );
  }

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
            Take an adaptive quiz to identify your strengths and weaknesses. The
            AI uses your results to adapt your study guidance.
          </p>
        </div>

        <div className="border border-foreground/10 p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-foreground/[0.02] border border-foreground/5">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium text-sm">
                  {meta.subject} — {meta.exam}
                </div>
                <div className="text-xs text-muted-foreground">
                  {meta.totalQuestions} questions · ~{meta.estimatedTime}
                </div>
              </div>
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

        {previousResult && (
          <div className="mt-8 border border-foreground/10 p-6">
            <h2 className="text-lg font-display mb-4">Previous Results</h2>
            <div className="flex items-center justify-between p-4 border border-foreground/5">
              <div>
                <div className="font-medium text-sm">
                  {previousResult.subject} Quiz
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(previousResult.date).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-display">
                  {Math.round(previousResult.score)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {previousResult.correctAnswers}/
                  {previousResult.totalQuestions} correct
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (state === "quiz") {
    return (
      <div className="p-6 lg:p-10 max-w-[800px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-mono text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-xs font-mono text-muted-foreground bg-foreground/5 px-2 py-1">
              {question.topic}
            </span>
          </div>
          <div className="relative w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-foreground rounded-full transition-all duration-500"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="border border-foreground/10 p-8 mb-6">
          <h2 className="text-xl lg:text-2xl font-display leading-relaxed mb-8">
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswers[question.id] === index;
              const isCorrectOption = question.correctAnswer === index;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
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
                  <span
                    className={`w-8 h-8 flex items-center justify-center border text-sm font-mono shrink-0 transition-all ${
                      isAnswered
                        ? isCorrectOption
                          ? "border-green-400 bg-green-400 text-white"
                          : isSelected
                            ? "border-red-400 bg-red-400 text-white"
                            : "border-foreground/10"
                        : "border-foreground/20 group-hover:border-foreground/40"
                    }`}
                  >
                    {isAnswered && isCorrectOption ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isAnswered && isSelected ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </span>
                  <span className="text-sm">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {showExplanation && (
          <div
            className={`border p-6 mb-6 ${isCorrect ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${isCorrect ? "text-green-700" : "text-red-700"}`}
              >
                {isCorrect ? "Correct!" : "Incorrect"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        )}

        {isAnswered && (
          <Button
            onClick={handleNext}
            className="w-full bg-foreground hover:bg-foreground/90 text-background h-12 text-base rounded-full group"
          >
            {currentQuestion < questions.length - 1
              ? "Next Question"
              : "See Results"}
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        )}
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="p-6 lg:p-10 max-w-[800px] mx-auto">
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-3 mx-auto">
          <span className="w-8 h-px bg-foreground/30" />
          Quiz Complete
          <span className="w-8 h-px bg-foreground/30" />
        </span>
        <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-4">
          {Math.round(result.score)}%
        </h1>
        <p className="text-muted-foreground">
          {result.correctAnswers} out of {result.totalQuestions} correct
        </p>
      </div>

      <div className="border border-foreground/10 p-6 mb-6">
        <h2 className="text-lg font-display mb-6">Topic Breakdown</h2>
        <div className="space-y-4">
          {result.topicBreakdown.map((topic) => (
            <div key={topic.topic}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{topic.topic}</span>
                <span className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 ${
                      topic.strength === "strong"
                        ? "bg-green-100 text-green-700"
                        : topic.strength === "moderate"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
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

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => {
            setState("intro");
            setCurrentQuestion(0);
            setSelectedAnswers({});
            setShowExplanation(false);
            setPreviousResult(result);
          }}
          className="flex-1 bg-foreground hover:bg-foreground/90 text-background h-12 text-base rounded-full"
        >
          Retake Quiz
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12 text-base rounded-full border-foreground/20 hover:bg-foreground/5"
          onClick={() => {
            window.location.href = "/dashboard/study-plan";
          }}
        >
          View Study Plan
        </Button>
      </div>
    </div>
  );
}
