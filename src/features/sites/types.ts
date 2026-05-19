import type { Site } from "@/db/schema";

export type { Site };

export type CreateSiteInput = {
  organizationId: string;
  name: string;
  domain?: string;
};

export type UpdateSiteInput = {
  id: string;
  name?: string;
  domain?: string;
  isActive?: boolean;
};
