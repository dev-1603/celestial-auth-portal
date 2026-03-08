CREATE TABLE "global_users" (
  "id" uuid PRIMARY KEY,
  "email" varchar UNIQUE NOT NULL,
  "passwordHash" text,
  "isSuperAdmin" boolean DEFAULT false,
  "isEmailVerified" boolean DEFAULT false,
  "lastLoginAt" timestamp,
  "deletedAt" timestamp,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "tenants" (
  "id" uuid PRIMARY KEY,
  "planId" uuid,
  "name" varchar NOT NULL,
  "slug" varchar UNIQUE NOT NULL,
  "primaryDomain" varchar UNIQUE,
  "logoUrl" text,
  "status" varchar NOT NULL,
  "stripeCustomerId" varchar UNIQUE,
  "trialEndsAt" timestamp,
  "onboardedAt" timestamp,
  "dbStrategy" varchar,
  "dbUrl" text,
  "dbSchemaName" varchar,
  "deletedAt" timestamp,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "oauth_providers" (
  "id" uuid PRIMARY KEY,
  "globalUserId" uuid,
  "provider" varchar,
  "providerUserId" varchar NOT NULL,
  "accessToken" text,
  "refreshToken" text,
  "expiresAt" timestamp,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "plans" (
  "id" uuid PRIMARY KEY,
  "name" varchar UNIQUE NOT NULL,
  "displayName" varchar NOT NULL,
  "description" text,
  "type" varchar NOT NULL,
  "basePriceMo" decimal DEFAULT 0,
  "basePriceYr" decimal DEFAULT 0,
  "discountPct" decimal DEFAULT 0,
  "maxUsers" int,
  "maxStorage" int,
  "supportLevel" varchar,
  "isActive" boolean DEFAULT true,
  "stripePriceIdMo" varchar,
  "stripePriceIdYr" varchar,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "modules" (
  "id" uuid PRIMARY KEY,
  "key" varchar UNIQUE NOT NULL,
  "name" varchar NOT NULL,
  "description" text,
  "type" varchar,
  "entryUrl" text NOT NULL,
  "icon" varchar,
  "category" varchar,
  "version" varchar DEFAULT '1.0.0',
  "isCore" boolean DEFAULT false,
  "isActive" boolean DEFAULT true,
  "priceMo" decimal DEFAULT 0,
  "priceYr" decimal DEFAULT 0,
  "stripePriceIdMo" varchar,
  "stripePriceIdYr" varchar,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "bundle_modules" (
  "id" uuid PRIMARY KEY,
  "planId" uuid,
  "moduleId" uuid,
  "createdAt" timestamp DEFAULT (now())
);

CREATE TABLE "tenant_user_links" (
  "id" uuid PRIMARY KEY,
  "globalUserId" uuid,
  "invitedByGlobalUserId" uuid,
  "tenantId" uuid,
  "isTenantOwner" boolean DEFAULT false,
  "status" varchar,
  "tenantSideUserId" uuid,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "tenant_invitations" (
  "id" uuid PRIMARY KEY,
  "tenantId" uuid,
  "invitedEmail" varchar NOT NULL,
  "invitedBy" uuid,
  "token" uuid UNIQUE NOT NULL,
  "status" varchar,
  "expiresAt" timestamp NOT NULL,
  "acceptedAt" timestamp,
  "createdAt" timestamp DEFAULT (now())
);

CREATE TABLE "tenant_module_access" (
  "id" uuid PRIMARY KEY,
  "tenantId" uuid,
  "moduleId" uuid,
  "moduleKey" varchar NOT NULL,
  "enabled" boolean DEFAULT true,
  "source" varchar,
  "config" json,
  "enabledAt" timestamp,
  "disabledAt" timestamp,
  "enabledByGlobalUserId" uuid,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "tenant_subscriptions" (
  "id" uuid PRIMARY KEY,
  "tenantId" uuid,
  "moduleId" uuid,
  "planId" uuid,
  "billingCycle" varchar,
  "unitPrice" decimal NOT NULL,
  "discountPct" decimal DEFAULT 0,
  "finalPrice" decimal NOT NULL,
  "status" varchar,
  "trialEndsAt" timestamp,
  "currentPeriodStart" timestamp NOT NULL,
  "currentPeriodEnd" timestamp NOT NULL,
  "cancelledAt" timestamp,
  "stripeSubscriptionItemId" varchar,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "superadmin_audit_logs" (
  "id" uuid PRIMARY KEY,
  "actorUserId" uuid,
  "tenantId" uuid,
  "action" varchar NOT NULL,
  "entity" varchar,
  "entityId" uuid,
  "oldValue" json,
  "newValue" json,
  "ip" varchar,
  "userAgent" text,
  "createdAt" timestamp DEFAULT (now())
);

CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY,
  "name" varchar NOT NULL,
  "slug" varchar UNIQUE NOT NULL,
  "logoUrl" text,
  "faviconUrl" text,
  "theme" json,
  "defaultLanguage" varchar DEFAULT 'en',
  "timezone" varchar DEFAULT 'UTC',
  "dateFormat" varchar DEFAULT 'DD/MM/YYYY',
  "currencyCode" varchar DEFAULT 'INR',
  "settings" json,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "orgId" uuid NOT NULL,
  "globalUserId" uuid,
  "email" varchar NOT NULL,
  "firstName" varchar,
  "lastName" varchar,
  "displayName" varchar,
  "avatarUrl" text,
  "phone" varchar,
  "isActive" boolean DEFAULT true,
  "lastLoginAt" timestamp,
  "preferences" json,
  "deletedAt" timestamp,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "org_roles" (
  "id" uuid PRIMARY KEY,
  "orgId" uuid NOT NULL,
  "name" varchar NOT NULL,
  "description" text,
  "isSystem" boolean DEFAULT false,
  "permissions" json NOT NULL,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "memberships" (
  "id" uuid PRIMARY KEY,
  "orgId" uuid NOT NULL,
  "userId" uuid UNIQUE,
  "status" varchar,
  "joinedAt" timestamp,
  "invitedByUserId" uuid,
  "createdAt" timestamp DEFAULT (now()),
  "updatedAt" timestamp
);

CREATE TABLE "membership_roles" (
  "id" uuid PRIMARY KEY,
  "orgId" uuid NOT NULL,
  "membershipId" uuid,
  "orgRoleId" uuid,
  "assignedByUserId" uuid,
  "createdAt" timestamp DEFAULT (now())
);

CREATE TABLE "member_module_overrides" (
  "id" uuid PRIMARY KEY,
  "orgId" uuid NOT NULL,
  "membershipId" uuid,
  "moduleKey" varchar NOT NULL,
  "canAccess" boolean DEFAULT true,
  "createdAt" timestamp DEFAULT (now())
);

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY,
  "orgId" uuid NOT NULL,
  "actorUserId" uuid,
  "action" varchar NOT NULL,
  "entity" varchar,
  "entityId" uuid,
  "oldValue" json,
  "newValue" json,
  "ip" varchar,
  "userAgent" text,
  "createdAt" timestamp DEFAULT (now())
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY,
  "orgId" uuid NOT NULL,
  "userId" uuid,
  "type" varchar NOT NULL,
  "title" varchar NOT NULL,
  "body" text,
  "data" json,
  "isRead" boolean DEFAULT false,
  "readAt" timestamp,
  "createdAt" timestamp DEFAULT (now())
);

CREATE UNIQUE INDEX ON "oauth_providers" ("provider", "providerUserId");

CREATE UNIQUE INDEX ON "oauth_providers" ("globalUserId", "provider");

CREATE UNIQUE INDEX ON "bundle_modules" ("planId", "moduleId");

CREATE UNIQUE INDEX ON "tenant_user_links" ("globalUserId", "tenantId");

CREATE UNIQUE INDEX ON "tenant_module_access" ("tenantId", "moduleId");

CREATE UNIQUE INDEX ON "tenant_subscriptions" ("tenantId", "moduleId");

CREATE UNIQUE INDEX ON "users" ("orgId", "email");

CREATE UNIQUE INDEX ON "org_roles" ("orgId", "name");

CREATE UNIQUE INDEX ON "membership_roles" ("membershipId", "orgRoleId");

CREATE UNIQUE INDEX ON "member_module_overrides" ("membershipId", "moduleKey");

COMMENT ON TABLE "global_users" IS 'SUPERADMIN DB';

COMMENT ON COLUMN "global_users"."id" IS 'Primary Key';

COMMENT ON COLUMN "global_users"."passwordHash" IS 'null if OAuth only';

COMMENT ON COLUMN "global_users"."deletedAt" IS 'Soft delete — GDPR';

COMMENT ON COLUMN "tenants"."id" IS 'Used as orgId in Tenant DB';

COMMENT ON COLUMN "tenants"."status" IS 'TRIAL|ACTIVE|SUSPENDED|CANCELLED';

COMMENT ON COLUMN "tenants"."dbStrategy" IS 'SHARED|SCHEMA_PER|DEDICATED';

COMMENT ON COLUMN "tenants"."dbUrl" IS 'encrypted — only for DEDICATED';

COMMENT ON COLUMN "tenants"."dbSchemaName" IS 'only for SCHEMA_PER';

COMMENT ON COLUMN "oauth_providers"."provider" IS 'GOOGLE | GITHUB | MICROSOFT | SAML';

COMMENT ON COLUMN "oauth_providers"."accessToken" IS 'encrypted';

COMMENT ON COLUMN "oauth_providers"."refreshToken" IS 'encrypted';

COMMENT ON COLUMN "plans"."name" IS 'pay_as_you_go | all_bundle';

COMMENT ON COLUMN "plans"."type" IS 'PAY_PER_MODULE | BUNDLE';

COMMENT ON COLUMN "plans"."maxUsers" IS 'null = unlimited';

COMMENT ON COLUMN "plans"."maxStorage" IS 'MB, null = unlimited';

COMMENT ON COLUMN "plans"."supportLevel" IS 'COMMUNITY | EMAIL | PRIORITY | DEDICATED';

COMMENT ON COLUMN "modules"."key" IS 'healthcare | ecommerce | restaurant';

COMMENT ON COLUMN "modules"."type" IS 'MFE | EXTERNAL | IFRAME';

COMMENT ON COLUMN "modules"."entryUrl" IS 'remoteEntry.js URL';

COMMENT ON COLUMN "modules"."priceMo" IS 'Monthly per-module price';

COMMENT ON COLUMN "modules"."priceYr" IS 'Yearly per-module price';

COMMENT ON TABLE "bundle_modules" IS 'JOIN: Plan ↔ Module for BUNDLE plans';

COMMENT ON TABLE "tenant_user_links" IS 'JOIN: GlobalUser ↔ Tenant';

COMMENT ON COLUMN "tenant_user_links"."status" IS 'INVITED | ACTIVE | DISABLED';

COMMENT ON COLUMN "tenant_user_links"."tenantSideUserId" IS 'bridge → Tenant DB users.id';

COMMENT ON COLUMN "tenant_invitations"."status" IS 'PENDING|ACCEPTED|EXPIRED|REVOKED';

COMMENT ON COLUMN "tenant_module_access"."moduleKey" IS 'denormalized for JWT';

COMMENT ON COLUMN "tenant_module_access"."source" IS 'SUBSCRIPTION | OVERRIDE | TRIAL';

COMMENT ON TABLE "tenant_subscriptions" IS 'Billing record per module per tenant';

COMMENT ON COLUMN "tenant_subscriptions"."billingCycle" IS 'MONTHLY | YEARLY';

COMMENT ON COLUMN "tenant_subscriptions"."unitPrice" IS 'Snapshot at subscription time';

COMMENT ON COLUMN "tenant_subscriptions"."finalPrice" IS 'unitPrice - discount';

COMMENT ON COLUMN "tenant_subscriptions"."status" IS 'TRIAL|ACTIVE|PAUSED|CANCELLED';

COMMENT ON TABLE "superadmin_audit_logs" IS 'APPEND-ONLY — no updates/deletes';

COMMENT ON TABLE "organizations" IS 'TENANT DB — id mirrors tenants.id';

COMMENT ON COLUMN "organizations"."id" IS 'SAME UUID as tenants.id in SuperAdmin DB';

COMMENT ON COLUMN "organizations"."theme" IS '{ primary, background, font }';

COMMENT ON TABLE "users" IS 'orgId = RLS anchor on EVERY table';

COMMENT ON COLUMN "users"."orgId" IS 'RLS ANCHOR — refs organizations.id';

COMMENT ON COLUMN "users"."globalUserId" IS 'bridge → SuperAdmin global_users.id';

COMMENT ON COLUMN "org_roles"."name" IS 'ADMIN | DOCTOR | CASHIER | VIEWER';

COMMENT ON COLUMN "org_roles"."permissions" IS '{ "healthcare:read": true }';

COMMENT ON COLUMN "memberships"."status" IS 'INVITED|ACTIVE|SUSPENDED|REMOVED';

COMMENT ON TABLE "membership_roles" IS 'JOIN: Membership ↔ OrgRole';

COMMENT ON COLUMN "member_module_overrides"."moduleKey" IS 'logical ref → SuperAdmin modules.key';

COMMENT ON TABLE "audit_logs" IS 'APPEND-ONLY — no updates/deletes';

ALTER TABLE "tenants" ADD FOREIGN KEY ("planId") REFERENCES "plans" ("id");

ALTER TABLE "oauth_providers" ADD FOREIGN KEY ("globalUserId") REFERENCES "global_users" ("id");

ALTER TABLE "bundle_modules" ADD FOREIGN KEY ("planId") REFERENCES "plans" ("id");

ALTER TABLE "bundle_modules" ADD FOREIGN KEY ("moduleId") REFERENCES "modules" ("id");

ALTER TABLE "tenant_user_links" ADD FOREIGN KEY ("globalUserId") REFERENCES "global_users" ("id");

ALTER TABLE "tenant_user_links" ADD FOREIGN KEY ("invitedByGlobalUserId") REFERENCES "global_users" ("id");

ALTER TABLE "tenant_user_links" ADD FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id");

ALTER TABLE "tenant_invitations" ADD FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id");

ALTER TABLE "tenant_invitations" ADD FOREIGN KEY ("invitedBy") REFERENCES "global_users" ("id");

ALTER TABLE "tenant_module_access" ADD FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id");

ALTER TABLE "tenant_module_access" ADD FOREIGN KEY ("moduleId") REFERENCES "modules" ("id");

ALTER TABLE "tenant_subscriptions" ADD FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id");

ALTER TABLE "tenant_subscriptions" ADD FOREIGN KEY ("moduleId") REFERENCES "modules" ("id");

ALTER TABLE "tenant_subscriptions" ADD FOREIGN KEY ("planId") REFERENCES "plans" ("id");

ALTER TABLE "superadmin_audit_logs" ADD FOREIGN KEY ("actorUserId") REFERENCES "global_users" ("id");

ALTER TABLE "superadmin_audit_logs" ADD FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id");

ALTER TABLE "org_roles" ADD FOREIGN KEY ("orgId") REFERENCES "organizations" ("id");

ALTER TABLE "memberships" ADD FOREIGN KEY ("orgId") REFERENCES "organizations" ("id");

ALTER TABLE "memberships" ADD FOREIGN KEY ("userId") REFERENCES "users" ("id");

ALTER TABLE "memberships" ADD FOREIGN KEY ("invitedByUserId") REFERENCES "users" ("id");

ALTER TABLE "membership_roles" ADD FOREIGN KEY ("membershipId") REFERENCES "memberships" ("id");

ALTER TABLE "membership_roles" ADD FOREIGN KEY ("orgRoleId") REFERENCES "org_roles" ("id");

ALTER TABLE "membership_roles" ADD FOREIGN KEY ("assignedByUserId") REFERENCES "users" ("id");

ALTER TABLE "member_module_overrides" ADD FOREIGN KEY ("membershipId") REFERENCES "memberships" ("id");

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("actorUserId") REFERENCES "users" ("id");

ALTER TABLE "notifications" ADD FOREIGN KEY ("userId") REFERENCES "users" ("id");
