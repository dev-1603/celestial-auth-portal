-- CreateEnum
CREATE TYPE "AuthMethodType" AS ENUM ('PASSWORD', 'OAUTH', 'SSO', 'MAGIC_LINK', 'OTP', 'PHONE');

-- AlterTable
ALTER TABLE "AuthIdentity" ADD COLUMN "authMethodType" "AuthMethodType";

-- CreateIndex
CREATE INDEX "AuthIdentity_authMethodType_idx" ON "AuthIdentity"("authMethodType");
