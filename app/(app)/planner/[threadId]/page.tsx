import { redirect, notFound } from "next/navigation";
import { ensureCurrentUser } from "@/features/users";
import { PlannerChat } from "@/features/planner";
import {
  getChatThreadById,
  getThreadMessages,
  storedMessagesToUIMessages,
} from "@/features/planner/repository";

interface PlannerThreadPageProps {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ initialPrompt?: string }>;
}

export default async function PlannerThreadPage({
  params,
  searchParams,
}: PlannerThreadPageProps) {
  const user = await ensureCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { threadId } = await params;
  const { initialPrompt } = await searchParams;

  // Verify ownership of the thread
  const thread = await getChatThreadById(threadId, user.id);
  if (!thread) {
    notFound();
  }

  // Load existing persisted messages
  const dbMessages = await getThreadMessages(threadId, user.id);
  const initialMessages = storedMessagesToUIMessages(dbMessages);

  return (
    <PlannerChat
      key={threadId}
      threadId={threadId}
      initialPrompt={initialPrompt}
      initialMessages={initialMessages}
    />
  );
}
