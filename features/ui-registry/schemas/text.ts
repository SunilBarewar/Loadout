import { z } from "zod";

export const textPartDataSchema = z.object({
  content: z.string(),
  clientMessageId: z.string().optional(),
});

export type TextPartData = z.infer<typeof textPartDataSchema>;
