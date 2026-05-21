import type { Organization } from "@/db/schema";

export type { Organization };

export type OrganizationWithRole = Organization & {
  role: "owner" | "admin" | "member";
};

export type CreateOrganizationInput = {
  name: string;
};
