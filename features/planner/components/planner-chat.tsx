"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  ArrowLeft,
  ArrowUp,
  Bot,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlannerChatProps {
  threadId: string;
  initialPrompt?: string | null;
  initialMessages?: UIMessage[];
}

function messageText(parts: { type: string; text?: string }[]) {
  return parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("");
}

export function PlannerChat({
  threadId,
  initialPrompt,
  initialMessages = [],
}: PlannerChatProps) {
  const router = useRouter();
  const [input, setInput] = React.useState("");
  const sentInitialPrompt = React.useRef(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  React.useEffect(() => {
    if (!initialPrompt?.trim() || sentInitialPrompt.current) return;
    sentInitialPrompt.current = true;
    void sendMessage({ text: initialPrompt.trim() });
    router.replace(`/planner/${threadId}`, { scroll: false });
  }, [initialPrompt, router, sendMessage, threadId]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const isBusy = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    void sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col h-[calc(100svh-4rem)]">
      <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/planner"
            className="p-1.5 rounded-md border border-border bg-surface-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors shrink-0"
            aria-label="Back to planner overview"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-foreground tracking-tight truncate">
                Planning chat
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-surface-2 text-[11px] font-medium text-primary">
                <Sparkles className="size-2.5" />
                Gemini
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ask Loadout for a routine, swap, or training question.
            </p>
          </div>
        </div>

        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs shrink-0"
        >
          <CheckCircle2 className="size-3.5" />
          <span className="hidden sm:inline">Save as active plan</span>
          <span className="sm:hidden">Save</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
        {messages.length === 0 && !isBusy && (
          <p className="text-sm text-muted-foreground text-center py-12">
            Send a message to start this planning thread.
          </p>
        )}

        {messages.map((message) => {
          const isUser = message.role === "user";
          const text = messageText(message.parts);
          if (!text && message.role !== "assistant") return null;

          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1.5 max-w-3xl",
                isUser ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                {!isUser && (
                  <div className="size-5 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                    <Bot className="size-3" />
                  </div>
                )}
                <span className="font-semibold text-foreground/80">
                  {isUser ? "You" : "Loadout AI"}
                </span>
              </div>

              <div
                className={cn(
                  "p-4 rounded-md text-sm leading-relaxed border whitespace-pre-wrap",
                  isUser
                    ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                    : "bg-card text-foreground border-border"
                )}
              >
                {text || (status === "streaming" ? "…" : "")}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <p className="text-xs text-muted-foreground">Thinking…</p>
        )}

        {error && (
          <p className="text-sm text-destructive">
            Something went wrong. Try sending the message again.
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="pt-3 border-t border-border shrink-0">
        {(status === "submitted" || status === "streaming") && (
          <div className="flex justify-end pb-2">
            <button
              type="button"
              onClick={() => stop()}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Stop
            </button>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center rounded-md border border-border bg-card p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-xs"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "ready"}
            placeholder="Ask Loadout to plan a split, swap an exercise, or change duration..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || status !== "ready"}
            className="size-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            aria-label="Send message"
          >
            <ArrowUp className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
