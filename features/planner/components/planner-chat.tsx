"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { ChatAssistantStatus } from "@/features/planner/components/chat-assistant-status";
import { MarkdownContent } from "@/features/planner/components/markdown-content";
import { ChatPartRenderer } from "@/features/ui-registry";
import type { StoredChatPart } from "@/features/ui-registry";
import { cn } from "@/lib/utils";

interface PlannerChatProps {
  threadId: string;
  initialPrompt?: string | null;
  initialMessages?: UIMessage[];
}

function messageText(parts: UIMessage["parts"]) {
  return parts
    .filter(
      (part): part is Extract<UIMessage["parts"][number], { type: "text" }> =>
        part.type === "text"
    )
    .map((part) => part.text ?? "")
    .join("");
}

function isDataRegistryPart(
  part: UIMessage["parts"][number]
): part is UIMessage["parts"][number] & { type: `data-${string}`; data: unknown; id?: string } {
  return part.type.startsWith("data-");
}

function dataPartToStoredPart(
  part: UIMessage["parts"][number] & { type: `data-${string}`; data: unknown; id?: string }
): StoredChatPart | null {
  const registryType = part.type.replace(/^data-/, "");
  if (
    registryType !== "equipment_picker" &&
    registryType !== "workout_plan" &&
    registryType !== "weekly_schedule" &&
    registryType !== "plan_update" &&
    registryType !== "exercise_carousel" &&
    registryType !== "progress_snapshot"
  ) {
    return null;
  }

  return {
    id: part.id ?? crypto.randomUUID(),
    type: registryType,
    schemaVersion: 1,
    data: part.data,
  } as StoredChatPart;
}

function hasRenderableContent(parts: UIMessage["parts"]) {
  const text = messageText(parts);
  if (text) return true;
  return parts.some(isDataRegistryPart);
}

function getDataPartPlanId(part: UIMessage["parts"][number]): string | null {
  if (!isDataRegistryPart(part)) return null;
  const data = part.data as { planId?: string };
  return typeof data.planId === "string" ? data.planId : null;
}

function buildScheduleVisibility(messages: UIMessage[]) {
  const firstWeeklyScheduleMessageByPlan = new Map<string, string>();

  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== "data-weekly_schedule") continue;
      const planId = getDataPartPlanId(part);
      if (!planId || firstWeeklyScheduleMessageByPlan.has(planId)) continue;
      firstWeeklyScheduleMessageByPlan.set(planId, message.id);
    }
  }

  return firstWeeklyScheduleMessageByPlan;
}

function shouldRenderDataPart(
  part: UIMessage["parts"][number] & { type: `data-${string}`; data: unknown; id?: string },
  messageId: string,
  scheduleVisibility: Map<string, string>
) {
  if (part.type === "data-weekly_schedule") {
    const planId = getDataPartPlanId(part);
    if (!planId) return true;
    return scheduleVisibility.get(planId) === messageId;
  }

  if (part.type === "data-workout_plan") {
    const data = part.data as { isRevision?: boolean };
    if (data.isRevision) return false;
  }

  return true;
}

function AssistantMessageText({
  parts,
  isStreamingMessage,
}: {
  parts: UIMessage["parts"];
  isStreamingMessage: boolean;
}) {
  const text = messageText(parts);
  if (!text) return null;

  const textPart = parts.find(
    (part): part is Extract<UIMessage["parts"][number], { type: "text" }> =>
      part.type === "text"
  );
  const isActivelyStreaming =
    isStreamingMessage &&
    textPart != null &&
    "state" in textPart &&
    textPart.state === "streaming";

  if (isActivelyStreaming) {
    return (
      <p className="whitespace-pre-wrap leading-relaxed">
        {text}
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
      </p>
    );
  }

  return <MarkdownContent content={text} />;
}

export function PlannerChat({
  threadId,
  initialPrompt,
  initialMessages = [],
}: PlannerChatProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const sentInitialPrompt = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    throttle: 50,
    onFinish: () => {
      router.refresh();
    },
  });

  useEffect(() => {
    if (!initialPrompt?.trim() || sentInitialPrompt.current) return;
    sentInitialPrompt.current = true;
    void sendMessage({ text: initialPrompt.trim() });
    router.replace(`/planner/${threadId}`, { scroll: false });
  }, [initialPrompt, router, sendMessage, threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const isBusy = status === "submitted" || status === "streaming";
  const scheduleVisibility = buildScheduleVisibility(messages);
  const lastMessage = messages.at(-1);
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const lastAssistantText = lastAssistantMessage
    ? messageText(lastAssistantMessage.parts).trim()
    : "";
  const showAssistantStatus =
    isBusy &&
    (lastMessage?.role === "user" ||
      !lastAssistantMessage ||
      lastAssistantText.length === 0);

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

        {messages.map((message, messageIndex) => {
          const isUser = message.role === "user";
          const text = messageText(message.parts);
          const dataParts = message.parts.filter(isDataRegistryPart);
          const isStreamingMessage =
            isBusy &&
            message.role === "assistant" &&
            messageIndex === messages.length - 1;

          if (!hasRenderableContent(message.parts) && message.role !== "assistant") {
            return null;
          }

          if (
            message.role === "assistant" &&
            !hasRenderableContent(message.parts) &&
            isStreamingMessage
          ) {
            return null;
          }

          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-3",
                isUser
                  ? "ml-auto max-w-[85%] items-end"
                  : "mr-auto w-full max-w-3xl items-start"
              )}
            >
              <div
                className={cn(
                  "flex flex-col gap-3",
                  isUser ? "items-end" : "w-full"
                )}
              >
                {text && (
                  <div
                    className={cn(
                      "rounded-md border p-4 text-sm leading-relaxed",
                      isUser
                        ? "w-fit max-w-full bg-primary font-medium text-primary-foreground border-primary shadow-xs whitespace-pre-wrap"
                        : "w-full bg-card text-foreground border-border"
                    )}
                  >
                    {isUser ? (
                      text
                    ) : (
                      <AssistantMessageText
                        parts={message.parts}
                        isStreamingMessage={isStreamingMessage}
                      />
                    )}
                  </div>
                )}

                {!isUser &&
                  dataParts.map((part, index) => {
                    if (
                      !shouldRenderDataPart(part, message.id, scheduleVisibility)
                    ) {
                      return null;
                    }

                    const storedPart = dataPartToStoredPart(part);
                    if (!storedPart) return null;

                    return (
                      <ChatPartRenderer
                        key={part.id ?? `${message.id}-part-${index}`}
                        part={storedPart}
                        threadId={threadId}
                      />
                    );
                  })}
              </div>
            </div>
          );
        })}

        {showAssistantStatus && (
          <ChatAssistantStatus messages={messages} isBusy={isBusy} />
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
