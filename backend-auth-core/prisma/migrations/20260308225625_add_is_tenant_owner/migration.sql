-- Add isTenantOwner column to TenantUserLink
ALTER TABLE "TenantUserLink" ADD COLUMN IF NOT EXISTS "isTenantOwner" BOOLEAN NOT NULL DEFAULT false;
