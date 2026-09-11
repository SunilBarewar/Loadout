import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  equipment,
  userEquipment,
  users,
  type Equipment,
  type User,
} from "@/db";
import type { PlanningFactsInput } from "@/features/ai/schemas/planning-facts";

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

export type UserProfileWithEquipment = {
  profile: User;
  equipmentSlugs: string[];
  equipmentCatalog: Equipment[];
};

export async function getUserProfileWithEquipment(
  userId: string
): Promise<UserProfileWithEquipment | null> {
  const profile = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!profile) {
    return null;
  }

  const equipmentCatalog = await db
    .select()
    .from(equipment)
    .orderBy(equipment.name);

  const userEquipmentRows = await db
    .select({ slug: equipment.slug })
    .from(userEquipment)
    .innerJoin(equipment, eq(userEquipment.equipmentId, equipment.id))
    .where(eq(userEquipment.userId, userId));

  return {
    profile,
    equipmentSlugs: userEquipmentRows.map((row) => row.slug),
    equipmentCatalog,
  };
}

export async function updateUserPlanningProfile(
  userId: string,
  facts: PlanningFactsInput
): Promise<User | null> {
  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (facts.primaryGoal !== undefined) {
    updates.primaryGoal = facts.primaryGoal;
  }
  if (facts.experienceLevel !== undefined) {
    updates.experienceLevel = facts.experienceLevel;
  }
  if (facts.defaultDaysPerWeek !== undefined) {
    updates.defaultDaysPerWeek = facts.defaultDaysPerWeek;
  }
  if (facts.defaultSessionMinutes !== undefined) {
    updates.defaultSessionMinutes = facts.defaultSessionMinutes;
  }
  if (facts.limitations !== undefined) {
    updates.limitations = facts.limitations;
  }
  if (facts.weightUnit !== undefined) {
    updates.weightUnit = facts.weightUnit;
  }

  if (Object.keys(updates).length === 1) {
    return (
      (await db.query.users.findFirst({ where: eq(users.id, userId) })) ?? null
    );
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();

  return updated ?? null;
}

export async function setUserEquipmentSlugs(
  userId: string,
  slugs: string[]
): Promise<string[]> {
  const uniqueSlugs = [...new Set(slugs)];
  if (uniqueSlugs.length === 0) {
    await db.delete(userEquipment).where(eq(userEquipment.userId, userId));
    return [];
  }

  const catalogItems = await db
    .select()
    .from(equipment)
    .where(inArray(equipment.slug, uniqueSlugs));

  const validSlugs = catalogItems.map((item) => item.slug);

  await db.delete(userEquipment).where(eq(userEquipment.userId, userId));

  if (catalogItems.length > 0) {
    await db.insert(userEquipment).values(
      catalogItems.map((item) => ({
        userId,
        equipmentId: item.id,
      }))
    );
  }

  return validSlugs;
}
