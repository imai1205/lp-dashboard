"use server";

import { db } from "@/db/client";
import type { NewInquiryInput } from "./types";

// TODO: 公開フォームからのSubmitで呼ぶ。zod等でバリデーション後、inquiriesにINSERT。
export async function submitInquiry(_input: NewInquiryInput): Promise<void> {
  void db;
  throw new Error("submitInquiry: not implemented");
}

// TODO: ステータス更新 (open / in_progress / resolved)
export async function updateInquiryStatus(
  _id: string,
  _status: "open" | "in_progress" | "resolved",
): Promise<void> {
  void db;
  throw new Error("updateInquiryStatus: not implemented");
}
