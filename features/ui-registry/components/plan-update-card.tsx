"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { savePlanDraftAction } from "@/features/plans/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlanUpdatePartData } from "../schemas/plan-update";

interface PlanUpdateCardProps {
  data: PlanUpdatePartData;
  threadId?: string;
}

const stateLabels: Record<PlanUpdatePartData["state"], string> = {
  draft: "Draft",
  saved: "Saved",
  active: "Active",
};

export function PlanUpdateCard({ data, threadId }: PlanUpdateCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState(data.state);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setState(data.state);
  }, [data.state]);

  function handleSaveDraft() {
    setError(null);
    startTransition(async () => {
      const result = await savePlanDraftAction(
        data.planId,
        data.versionId,
        threadId
      );

      if (!result.ok) {
        setError(result.error);
        toast.add({
          type: "error",
          title: "Could not save revision",
          description: result.error,
        });
        return;
      }

      setState(result.state);
      toast.add({
        type: "success",
        title: "Revision saved",
        description: `${data.title} has been updated.`,
      });
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-lg border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
              <span className="truncate">
                {data.autoCommitted ? "Plan updated" : "Plan revision ready"}
              </span>
            </CardTitle>
            <CardDescription className="truncate">{data.title}</CardDescription>
          </div>
          <Badge variant="secondary">{stateLabels[state]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {data.changeSummary}
        </p>
        {data.autoCommitted ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Changes are already saved
            {state === "active" ? " and your plan stays active." : "."}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Save this revision to keep the changes.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          nativeButton={false}
          render={<Link href={`/plan/${data.planId}`} />}
          size="sm"
          variant="outline"
        >
          View plan
          <ArrowRight className="size-3.5" />
        </Button>
        {state === "draft" && !data.autoCommitted && (
          <Button size="sm" disabled={isPending} onClick={handleSaveDraft}>
            {isPending ? "Saving…" : "Save revision"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
