"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PlannerGreeting,
  PlannerPromptInput,
  PromptSuggestions,
  ChatHistoryList,
} from "@/features/planner";

export default function PlannerPage() {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmitPrompt = (submittedPrompt: string) => {
    if (!submittedPrompt.trim() || isSubmitting) return;
    setIsSubmitting(true);

    // Redirect to a new conversational chat thread with the submitted prompt
    const newThreadId = `thread-${Date.now()}`;
    router.push(
      `/planner/${newThreadId}?initialPrompt=${encodeURIComponent(submittedPrompt)}`
    );
  };

  const handleSelectSuggestion = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12">
      {/* 1. Hero Section: Greeting, Fixed-Height Textarea Input Box, and Prompt Suggestions */}
      <section className="max-w-3xl mx-auto w-full flex flex-col items-center gap-6">
        {/* Dynamic Lifter Greeting */}
        <PlannerGreeting />

        {/* Textarea Input Box with Fixed Height and Send Button (Referencing Design) */}
        <PlannerPromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSubmitPrompt}
          isSubmitting={isSubmitting}
        />

        {/* Prompt Suggestions Pills */}
        <PromptSuggestions onSelect={handleSelectSuggestion} />
      </section>

      {/* 2. Chat History List with Redirect to Chat Screen */}
      <ChatHistoryList className="w-full pt-4" />
    </div>
  );
}
