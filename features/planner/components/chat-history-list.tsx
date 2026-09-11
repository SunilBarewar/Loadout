"use client";

import * as React from "react";
import { MessageSquare, Search } from "lucide-react";
import { ChatHistoryCard } from "./chat-history-card";
import type { ChatThreadItem } from "../types";

const INITIAL_THREADS: ChatThreadItem[] = [
  {
    id: "thread-hypertrophy-ppl",
    title: "Hypertrophy 4-Day Upper / Lower Split",
    purpose: "planner",
    snippet: "Generated a 4-day hypertrophy program focusing on compound lifts with 8–12 rep targets, progressive overload tracking, and scheduled deloads.",
    updatedAt: "2 hours ago",
    createdAt: "2026-09-11",
    messageCount: 6,
    planName: "Hypertrophy 4-Day",
    tags: ["4 days/wk", "Compound lifts", "8–12 reps"],
  },
  {
    id: "thread-shoulder-swap",
    title: "Shoulder-Safe Pressing Substitution",
    purpose: "session_swap",
    snippet: "Substituted flat barbell bench with a 30-degree incline dumbbell press and added cable face pulls to protect the rotator cuff.",
    updatedAt: "Yesterday",
    createdAt: "2026-09-10",
    messageCount: 4,
    planName: "Push A Routine",
    tags: ["Exercise swap", "Shoulder rehab"],
  },
  {
    id: "thread-hotel-circuit",
    title: "30-Min Hotel Gym Conditioning Circuit",
    purpose: "planner",
    snippet: "Created a high-density 30-minute training session using only 16 kg kettlebells and bodyweight intervals for hotel gyms.",
    updatedAt: "3 days ago",
    createdAt: "2026-09-08",
    messageCount: 3,
    tags: ["Travel", "Kettlebell", "Conditioning"],
  },
  {
    id: "thread-deload-tweak",
    title: "Deload Week Volume Reduction",
    purpose: "plan_revision",
    snippet: "Reduced working set volume by 40% across compound lifts while holding intensity at RPE 7 to dissipate central nervous fatigue.",
    updatedAt: "Last week",
    createdAt: "2026-09-04",
    messageCount: 5,
    planName: "Strength Peak Phase",
    tags: ["Deload", "Fatigue management"],
  },
];

interface ChatHistoryListProps {
  threads?: ChatThreadItem[];
  className?: string;
}

export function ChatHistoryList({
  threads,
  className,
}: ChatHistoryListProps) {
  const [dbThreads, setDbThreads] = React.useState<ChatThreadItem[]>(threads ?? []);
  const [isLoading, setIsLoading] = React.useState(!threads);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterPurpose, setFilterPurpose] = React.useState<string>("all");

  React.useEffect(() => {
    if (threads !== undefined) return;
    import("../actions").then(({ getUserThreadsAction }) => {
      getUserThreadsAction()
        .then((items) => {
          setDbThreads(items);
        })
        .finally(() => {
          setIsLoading(false);
        });
    });
  }, [threads]);

  const activeThreads = threads ?? dbThreads;

  const filteredThreads = React.useMemo(() => {
    return activeThreads.filter((thread) => {
      const matchesSearch =
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        filterPurpose === "all" || thread.purpose === filterPurpose;

      return matchesSearch && matchesFilter;
    });
  }, [activeThreads, searchQuery, filterPurpose]);

  return (
    <section className={className}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display font-extrabold text-2xl tracking-tight text-foreground">
            RECENT PLANNING CHATS
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-border bg-surface-2 text-xs font-mono font-medium text-muted-foreground">
            {filteredThreads.length}
          </span>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-2">
          {/* Quick Purpose Filter */}
          <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-md border border-border text-xs">
            <button
              type="button"
              onClick={() => setFilterPurpose("all")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                filterPurpose === "all"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterPurpose("planner")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                filterPurpose === "planner"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              New plans
            </button>
            <button
              type="button"
              onClick={() => setFilterPurpose("session_swap")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                filterPurpose === "session_swap"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Swaps
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-32 sm:w-44 pl-8 pr-2.5 py-1 rounded-md border border-border bg-surface-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Thread list or empty state */}
      {filteredThreads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {filteredThreads.map((thread) => (
            <ChatHistoryCard key={thread.id} thread={thread} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card p-8 text-center space-y-3 mt-4">
          <div className="mx-auto size-10 rounded-full border border-border bg-surface-2 flex items-center justify-center text-muted-foreground">
            <MessageSquare className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-foreground">
              No planning chats found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No sessions match "${searchQuery}". Clear your search query or describe a new goal above.`
                : "No saved chats in this category. Start by entering a routine requirement in the input box above."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
