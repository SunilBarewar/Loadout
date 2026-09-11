"use client";

import { useParams, useSearchParams } from "next/navigation";
import { PlannerChat } from "@/features/planner";

export default function PlannerThreadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const threadId = (params?.threadId as string) || "new-session";
  const initialPrompt = searchParams.get("initialPrompt");

  return (
    <PlannerChat
      key={threadId}
      threadId={threadId}
      initialPrompt={initialPrompt}
    />
  );
}
