import { z } from "zod";

export const planUpdatePartDataSchema = z.object({
  planId: z.string().uuid(),
  versionId: z.string().uuid(),
  title: z.string(),
  changeSummary: z.string(),
  state: z.enum(["draft", "saved", "active"]),
  autoCommitted: z.boolean(),
});

export type PlanUpdatePartData = z.infer<typeof planUpdatePartDataSchema>;
