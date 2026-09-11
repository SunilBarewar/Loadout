"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Send,
  Dumbbell,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  planPreview?: {
    name: string;
    split: string;
    daysCount: number;
    exercises: {
      name: string;
      prescription: string;
      notes?: string;
    }[];
  };
}

export default function PlannerThreadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const threadId = (params?.threadId as string) || "new-session";
  const initialPrompt = searchParams.get("initialPrompt");

  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>(() => {
    // Generate initial contextual messages based on threadId
    if (threadId.includes("shoulder")) {
      return [
        {
          id: "1",
          role: "user",
          content:
            "I have mild shoulder impingement. Swap the flat barbell bench press for an incline dumbbell press and recommend safe chest accessory work.",
          timestamp: "Yesterday, 3:12 PM",
        },
        {
          id: "2",
          role: "assistant",
          content:
            "Understood. For anterior shoulder impingement, flat barbell bench press often forces excessive internal rotation and flared elbows at the bottom of the movement. I've updated your Push session to utilize a 30-degree incline dumbbell press with a semi-neutral grip, paired with rotator-cuff friendly accessories.",
          timestamp: "Yesterday, 3:13 PM",
          planPreview: {
            name: "Shoulder-Safe Push Protocol",
            split: "Push Day Revision",
            daysCount: 1,
            exercises: [
              {
                name: "30° Incline Dumbbell Press (Semi-neutral grip)",
                prescription: "4 sets × 8–10 reps · 90s rest",
                notes: "Tuck elbows to 45°, squeeze shoulder blades into bench",
              },
              {
                name: "Chest-Supported Dumbbell Row",
                prescription: "3 sets × 10–12 reps · 75s rest",
                notes: "Reinforces thoracic extension and posterior deltoids",
              },
              {
                name: "Cable Face Pulls with External Rotation",
                prescription: "3 sets × 15 reps · 60s rest",
                notes: "Pull rope to forehead height, thumbs pointing backward",
              },
            ],
          },
        },
      ];
    }

    if (threadId.includes("hotel")) {
      return [
        {
          id: "1",
          role: "user",
          content:
            "I am traveling and only have access to 16 kg kettlebells and bodyweight. Build a high-density 30-minute full body conditioning circuit.",
          timestamp: "3 days ago",
        },
        {
          id: "2",
          role: "assistant",
          content:
            "Here is a high-density 30-minute circuit designed around your 16 kg kettlebells. We will work in an EMOM (Every Minute on the Minute) format to maximize heart rate response without compromising form.",
          timestamp: "3 days ago",
          planPreview: {
            name: "30-Min Hotel Kettlebell Circuit",
            split: "Full Body Density",
            daysCount: 1,
            exercises: [
              {
                name: "Kettlebell Goblet Squat",
                prescription: "5 rounds × 12 reps · 45s rest",
                notes: "Chest proud, break at hips and knees simultaneously",
              },
              {
                name: "Single-Arm Kettlebell Clean & Press",
                prescription: "5 rounds × 6 reps/arm · 45s rest",
                notes: "Explosive hip hinge with steady lockout overhead",
              },
              {
                name: "Alternating Renegade Row + Push-up",
                prescription: "4 rounds × 8 total reps · 60s rest",
                notes: "Lock core to avoid hip swivel during rows",
              },
            ],
          },
        },
      ];
    }

    // Default or newly initiated thread
    return [
      {
        id: "1",
        role: "user",
        content:
          initialPrompt ||
          "Generate a 4-day push/pull/legs hypertrophy split focusing on compound barbell and dumbbell movements with 8–12 rep targets.",
        timestamp: "Today, 10:30 AM",
      },
      {
        id: "2",
        role: "assistant",
        content:
          "Here is your tailored 4-day Upper/Lower Hypertrophy Split. It delivers optimal weekly volume per muscle group (12–16 sets) while providing dedicated rest days for recovery and progressive overload tracking.",
        timestamp: "Today, 10:31 AM",
        planPreview: {
          name: "Hypertrophy 4-Day Split",
          split: "Upper A · Lower A · Upper B · Lower B",
          daysCount: 4,
          exercises: [
            {
              name: "Barbell Bench Press",
              prescription: "4 sets × 6–8 reps · 120s rest",
              notes: "Progress load when top set hits 8 reps with clean form",
            },
            {
              name: "Chest-Supported T-Bar Row",
              prescription: "4 sets × 8–10 reps · 90s rest",
              notes: "Full scapular retraction at top of each rep",
            },
            {
              name: "Standing Dumbbell Overhead Press",
              prescription: "3 sets × 8–10 reps · 90s rest",
              notes: "Braced glutes and core throughout pressing motion",
            },
            {
              name: "Incline Dumbbell Bicep Curl",
              prescription: "3 sets × 10–12 reps · 60s rest",
              notes: "Keep upper arm pinned, control eccentric descent",
            },
          ],
        },
      },
    ];
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Got it. Adjusting your program based on "${currentInput}". I've updated the exercise sequencing and target load figures accordingly.`,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 700);
  };

  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col h-[calc(100svh-4rem)]">
      {/* Top Header / Back navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/planner"
            className="p-1.5 rounded-md border border-border bg-surface-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            aria-label="Back to planner overview"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-foreground tracking-tight">
                {threadId.includes("shoulder")
                  ? "Shoulder-Safe Pressing Substitution"
                  : threadId.includes("hotel")
                  ? "30-Min Hotel Gym Conditioning"
                  : "Hypertrophy 4-Day Upper / Lower Split"}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-surface-2 text-[11px] font-medium text-primary">
                <Sparkles className="size-2.5" />
                Active planning thread
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Review and revise workouts with conversational AI adjustments.
            </p>
          </div>
        </div>

        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
        >
          <CheckCircle2 className="size-3.5" />
          <span className="hidden sm:inline">Save as active plan</span>
          <span className="sm:hidden">Save</span>
        </Link>
      </div>

      {/* Messages Scroll Feed */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1.5 max-w-3xl",
                isUser ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              {/* Role Header */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                {!isUser && (
                  <div className="size-5 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                    <Bot className="size-3" />
                  </div>
                )}
                <span className="font-semibold text-foreground/80">
                  {isUser ? "You" : "Loadout AI"}
                </span>
                <span>·</span>
                <span>{message.timestamp}</span>
              </div>

              {/* Message Content Bubble */}
              <div
                className={cn(
                  "p-4 rounded-md text-sm leading-relaxed border transition-all",
                  isUser
                    ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                    : "bg-card text-foreground border-border"
                )}
              >
                {message.content}
              </div>

              {/* Generative Plan Preview Part */}
              {message.planPreview && (
                <div className="w-full mt-2 rounded-md border border-border bg-card p-4 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-primary" />
                      <span className="font-display font-bold text-base text-foreground">
                        {message.planPreview.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground bg-surface-2 px-2 py-0.5 rounded border border-border">
                      {message.planPreview.split}
                    </span>
                  </div>

                  <div className="divide-y divide-border/60 rounded-md border border-border/80 bg-surface-2/40 overflow-hidden">
                    {message.planPreview.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-surface-2/80 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground block">
                            {ex.name}
                          </span>
                          {ex.notes && (
                            <span className="text-muted-foreground text-[11px] block">
                              {ex.notes}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-foreground font-medium shrink-0 bg-card px-2 py-1 rounded border border-border/70 self-start sm:self-auto">
                          {ex.prescription}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Input Box for Continued Chat */}
      <div className="pt-3 border-t border-border shrink-0">
        <form
          onSubmit={handleSendMessage}
          className="relative flex items-center rounded-md border border-border bg-card p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-xs"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Loadout to swap exercises, change rep ranges, or adjust workout duration..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="size-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <ArrowUp className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
