import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ensureCurrentUser } from "@/features/users";
import { getSessionPageData } from "@/features/sessions/get-session-page-data";
import { SessionWorkout } from "@/features/sessions/components/session-workout";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await ensureCurrentUser();
  if (!user) {
    notFound();
  }

  const { id } = await params;
  if (!uuidPattern.test(id)) {
    notFound();
  }

  const data = await getSessionPageData(id, user.id);
  if (!data) {
    notFound();
  }

  return (
    <div className="w-full max-w-[720px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <Link
          href="/today"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Exit to Today</span>
        </Link>
      </div>

      <SessionWorkout data={data} />
    </div>
  );
}
