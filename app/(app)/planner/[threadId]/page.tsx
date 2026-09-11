import { redirect, notFound } from "next/navigation";
import { ensureCurrentUser, getUserProfileWithEquipment } from "@/features/users";
import { PlannerChat } from "@/features/planner";
import {
  getChatThreadById,
  getThreadMessages,
  storedMessagesToUIMessages,
} from "@/features/planner/repository";
import { getPlanStatusesForUser } from "@/features/plans";
import {
  buildMessagesSyncKey,
  extractPlanIdsFromMessages,
  hydrateStoredMessages,
} from "@/features/ui-registry/mappers/hydrate-stored-parts";

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

  const profileBundle = await getUserProfileWithEquipment(user.id);
  if (!profileBundle) {
    notFound();
  }

  const dbMessages = await getThreadMessages(threadId, user.id);
  const planIds = extractPlanIdsFromMessages(dbMessages);
  const planStates = await getPlanStatusesForUser(user.id, planIds);
  const hydratedMessages = hydrateStoredMessages(dbMessages, {
    equipmentCatalog: profileBundle.equipmentCatalog,
    equipmentSlugs: profileBundle.equipmentSlugs,
    planStates,
  });
  const initialMessages = storedMessagesToUIMessages(hydratedMessages);
  const messagesSyncKey = buildMessagesSyncKey(hydratedMessages);

  return (
    <PlannerChat
      key={`${threadId}-${messagesSyncKey}`}
      threadId={threadId}
      initialPrompt={initialPrompt}
      initialMessages={initialMessages}
    />
  );
}
