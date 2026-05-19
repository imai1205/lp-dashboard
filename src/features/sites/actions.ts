"use server";

import { db } from "@/db/client";
import type { CreateSiteInput, UpdateSiteInput } from "./types";

export async function createSite(_input: CreateSiteInput): Promise<void> {
  void db;
  throw new Error("createSite: not implemented");
}

export async function updateSite(_input: UpdateSiteInput): Promise<void> {
  void db;
  throw new Error("updateSite: not implemented");
}

export async function deleteSite(_id: string): Promise<void> {
  void db;
  throw new Error("deleteSite: not implemented");
}
