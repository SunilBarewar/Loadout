import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, users, type User } from "@/db";

function getDisplayName(
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>
) {
  if (clerkUser.fullName) {
    return clerkUser.fullName;
  }

  const parts = [clerkUser.firstName, clerkUser.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

export async function ensureCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (existingUser) {
    return existingUser;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const displayName = getDisplayName(clerkUser);

  const [createdUser] = await db
    .insert(users)
    .values({
      id: userId,
      email,
      displayName,
    })
    .onConflictDoNothing()
    .returning();

  if (createdUser) {
    return createdUser;
  }

  return (
    (await db.query.users.findFirst({
      where: eq(users.id, userId),
    })) ?? null
  );
}
