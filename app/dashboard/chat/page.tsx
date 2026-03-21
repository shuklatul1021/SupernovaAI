"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const canSend = useMemo(
    () => message.trim().length > 0 && !isLoading,
    [message, isLoading],
  );

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
    <div className="p-6 lg:p-10 max-w-4xl mx-auto h-[calc(100vh-56px)] lg:h-screen flex flex-col">
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

      <div className="flex-1 border border-foreground/10 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Start by asking a question, for example: “How do I improve in
            thermodynamics?”
          </p>
        ) : (
          messages.map((entry, index) => (
            <div
              key={`${entry.role}-${index}`}
              className={`max-w-[85%] px-4 py-3 text-sm whitespace-pre-wrap ${
                entry.role === "user"
                  ? "ml-auto bg-foreground text-background"
                  : "bg-foreground/5 border border-foreground/10"
              }`}
            >
              {entry.content}
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
