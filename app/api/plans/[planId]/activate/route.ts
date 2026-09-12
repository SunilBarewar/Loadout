import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureCurrentUser } from "@/features/users";
import { activatePlan } from "@/features/plans/repository";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const activatePlanBodySchema = z.object({
  versionId: z.uuid(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const user = await ensureCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await params;
  if (!uuidPattern.test(planId)) {
    return NextResponse.json({ error: "Invalid plan id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = activatePlanBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "versionId is required and must be a valid UUID." },
      { status: 400 }
    );
  }

  const result = await activatePlan(planId, user.id, parsed.data.versionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, state: result.state });
}
