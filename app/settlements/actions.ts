"use server";

import { db } from "@/db";
import { settlements } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function resolveSettlement(formData: FormData) {
  const settlementId = formData.get("settlementId") as string;
  const showId = formData.get("showId") as string | null;
  if (!settlementId) return;

  await db
    .update(settlements)
    .set({ status: "finalized", finalizedAt: new Date(), disputedAt: sql`NULL` })
    .where(eq(settlements.id, settlementId));

  revalidatePath("/", "layout");
  revalidatePath("/settlements");
  if (showId) revalidatePath(`/shows/${showId}/settle`);
}
