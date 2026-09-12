import Link from "next/link";
import { Calendar, History as HistoryIcon } from "lucide-react";
import { ensureCurrentUser } from "@/features/users";
import { getHistoryPageData } from "@/features/sessions/get-history-page-data";
import { HistoryPagination } from "@/features/sessions/components/history-pagination";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await ensureCurrentUser();
  if (!user) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const requestedPage = Number(resolvedSearchParams.page ?? "1");
  const page = Number.isFinite(requestedPage) ? requestedPage : 1;
  const data = await getHistoryPageData(user.id, page);

  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
          WORKOUT HISTORY
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Completed sessions, set logs, and strength progression.
        </p>
      </div>

      {data.items.length > 0 ? (
        <>
          <div className="rounded-md border border-border bg-card divide-y divide-border overflow-hidden">
            {data.items.map((item) => (
              <Link
                key={item.id}
                href={`/session/${item.id}`}
                className="flex items-center justify-between p-4 hover:bg-surface-2/40 transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Calendar className="size-3 shrink-0" />
                    <span>{item.dateLabel}</span>
                    {item.status === "abandoned" && (
                      <span className="uppercase tracking-wide text-[10px]">
                        · Discarded
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-foreground truncate">
                    {item.title}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-mono shrink-0 ml-4">
                  {item.setCount} sets · {item.durationLabel}
                </div>
              </Link>
            ))}
          </div>

          <HistoryPagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
          />
        </>
      ) : (
        <div className="rounded-md border border-border bg-card p-8 text-center space-y-3">
          <div className="mx-auto size-10 rounded-full border border-border bg-surface-2 flex items-center justify-center text-muted-foreground">
            <HistoryIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-bold text-lg text-foreground">
              No workout history yet
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Complete a session from Today to see it here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
