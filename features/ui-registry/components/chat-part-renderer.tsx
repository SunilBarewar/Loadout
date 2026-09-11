"use client";

import type { ComponentType } from "react";
import type { z } from "zod";
import { uiRegistry } from "../registry";
import type { ChatPartType, StoredChatPart } from "../schemas/envelope";

interface ChatPartRendererProps {
  part: StoredChatPart;
}

type RegistryComponent = ComponentType<{ data: unknown }>;

export function ChatPartRenderer({ part }: ChatPartRendererProps) {
  const entry = uiRegistry[part.type as ChatPartType];

  if (!entry) {
    console.warn(`[ChatPartRenderer] Unknown part type: ${part.type}`);
    return null;
  }

  const parsed = (entry.schema as z.ZodType).safeParse(part.data);

  if (!parsed.success) {
    console.warn(
      `[ChatPartRenderer] Invalid data for part type "${part.type}":`,
      parsed.error.flatten()
    );
    return null;
  }

  const Component = entry.component as RegistryComponent;
  return <Component data={parsed.data} />;
}
