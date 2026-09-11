export type ChatThreadPurpose = "planner" | "plan_revision" | "session_swap";

export interface ChatThreadItem {
  id: string;
  title: string;
  purpose: ChatThreadPurpose;
  snippet: string;
  updatedAt: string;
  createdAt: string;
  messageCount: number;
  planName?: string;
  tags?: string[];
}

export interface PromptSuggestion {
  id: string;
  label: string;
  prompt: string;
  category?: string;
}
