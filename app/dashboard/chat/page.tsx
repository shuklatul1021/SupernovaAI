"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState("");

  const canSend = useMemo(
    () => message.trim().length > 0 && !isLoading,
    [message, isLoading],
  );

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/chat", { method: "GET" });
        const data = (await response.json()) as {
          success?: boolean;
          messages?: ChatMessage[];
          error?: string;
        };

        if (!response.ok || !Array.isArray(data.messages)) {
          throw new Error(data.error || "Failed to load chat history");
        }

        setMessages(data.messages);
      } catch (caughtError) {
        const messageText =
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load chat history";
        setError(messageText);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    void loadHistory();
  }, []);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || isLoading) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
      };
      if (!response.ok || !data.reply) {
        throw new Error(data.error || "Failed to get AI response");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to get AI response";
      setError(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto h-[calc(100vh-56px)] lg:h-screen flex flex-col">
      <div className="mb-6">
        <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-3">
          <span className="w-8 h-px bg-foreground/30" />
          AI Chat
        </span>
        <h1 className="text-3xl lg:text-4xl font-display tracking-tight">
          Ask Supernova AI
        </h1>
        <p className="text-muted-foreground mt-2">
          Ask anything about your studies, quiz topics, or planning strategy.
        </p>
      </div>

      <div className="flex-1 border border-foreground/10 p-5 lg:p-6 overflow-y-auto space-y-4">
        {isHistoryLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" /> Loading chat history...
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Start by asking a question, for example: “How do I improve in
            thermodynamics?”
          </p>
        ) : (
          messages.map((entry, index) => (
            <div
              key={`${entry.role}-${index}`}
              className={`max-w-[92%] lg:max-w-[88%] px-4 py-3 text-sm ${
                entry.role === "user"
                  ? "ml-auto bg-foreground text-background"
                  : "bg-foreground/5 border border-foreground/10"
              }`}
            >
              {entry.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-base lg:text-lg font-semibold mb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm lg:text-base font-semibold mb-2">
                        {children}
                      </h2>
                    ),
                    p: ({ children }) => (
                      <p className="leading-6 mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 mb-2 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 mb-2 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-6">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4"
                      >
                        {children}
                      </a>
                    ),
                    code: ({ children, className }) => (
                      <code
                        className={`font-mono text-xs ${className ?? ""} px-1.5 py-0.5 rounded bg-foreground/10`}
                      >
                        {children}
                      </code>
                    ),
                  }}
                >
                  {entry.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap leading-6">{entry.content}</p>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" /> Thinking...
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Ask your study question..."
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!canSend}
          className="rounded-full"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
