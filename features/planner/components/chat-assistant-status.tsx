"use client";

import { Loader2, Sparkles } from "lucide-react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

const TOOL_STATUS_LABELS: Record<string, string> = {
  propose_workout_plan: "Building your workout plan",
  revise_workout_plan: "Updating your plan",
  show_equipment_picker: "Preparing equipment picker",
  save_planning_facts: "Saving your preferences",
};

type ToolInvocationPart = Extract<
  UIMessage["parts"][number],
  { type: "dynamic-tool" } | { type: `tool-${string}` }
>;

function isToolInvocationPart(
  part: UIMessage["parts"][number]
): part is ToolInvocationPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

function getToolName(part: ToolInvocationPart): string {
  if (part.type === "dynamic-tool") {
    return part.toolName;
  }

  return part.type.slice("tool-".length);
}

function isActiveToolPart(part: UIMessage["parts"][number]): boolean {
  if (!isToolInvocationPart(part)) {
    return false;
  }

  return (
    part.state === "input-streaming" ||
    part.state === "input-available" ||
    part.state === "approval-requested"
  );
}

function getAssistantStatusLabel(
  messages: UIMessage[],
  isBusy: boolean
): string | null {
  if (!isBusy) return null;

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  if (lastAssistant) {
    for (const part of [...lastAssistant.parts].reverse()) {
      if (!isToolInvocationPart(part) || !isActiveToolPart(part)) continue;
      const toolName = getToolName(part);
      if (TOOL_STATUS_LABELS[toolName]) {
        return TOOL_STATUS_LABELS[toolName];
      }
    }

    const hasStreamingText = lastAssistant.parts.some(
      (part) =>
        part.type === "text" &&
        "state" in part &&
        part.state === "streaming" &&
        part.text.trim().length > 0
    );

    if (hasStreamingText) {
      return "Writing response";
    }
  }

  return "Thinking";
}

interface ChatAssistantStatusProps {
  messages: UIMessage[];
  isBusy: boolean;
  className?: string;
}

export function ChatAssistantStatus({
  messages,
  isBusy,
  className,
}: ChatAssistantStatusProps) {
  const label = getAssistantStatusLabel(messages, isBusy);

  if (!label) {
    return null;
  }

  return (
    <div
      className={cn(
        "mr-auto flex w-full max-w-3xl items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground",
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
      <span>{label}…</span>
      <Sparkles className="ml-auto size-3.5 shrink-0 text-primary/70" />
    </div>
  );
}
