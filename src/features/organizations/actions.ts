"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { organizations } from "@/db/schema";

// <form action={createOrganization}> から呼ばれる Server Action。
export async function createOrganization(formData: FormData): Promise<void> {
  const raw = formData.get("name");
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) throw new Error("組織名を入力してください");

  await db.insert(organizations).values({ name });

  // page.tsx を再レンダリングして一覧を更新。
  revalidatePath("/");
}
