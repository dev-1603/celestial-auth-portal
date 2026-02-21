# Database Scaling Architecture — Multi-Tenant, Multi-Module SaaS

This document describes the multi-tenant, multi-module database scaling strategy for the Celestial Auth Portal. It's intended for developers, SREs, and onboarding engineers.

## 1. Overview

- We use a 3-tier DB architecture: SuperAdmin DB, Tenant DB, and Module DBs  
- Each module (Ecommerce, Healthcare, Restaurant, and future modules) has its own isolated DB schema  
- Every table across all DBs has an `orgId` field for tenant scoping  
- No cross-DB joins — cross-module data flows through APIs or an event bus only

## 2. Current DB Structure (MVP — Tier 1)

Documented DBs and responsibilities:

- `superadmin_db` → Tenant, Plan, Module catalog, GlobalUser, TenantModuleAccess, Billing  
- `tenant_db` → User, Organization, Membership, OrgRole, RBAC, LoginEvent, MemberModuleOverrides  
- `ecommerce_db` → Product, Category, Catalogue, Offer, Order, OrderItem, OrderStatus, PaymentMode, PaymentTransaction, Cart, Wishlist, Review  
- `healthcare_db` → Hospital, Doctor, DoctorSchedule, MedicineCatalogue, Prescription, PatientHealthReport, DailyHealthLog, Appointment  
- `restaurant_db` → Menu, MenuItem, MenuCategory, Table, Reservation, Order, OrderStatus, KitchenQueue, KitchenInventory, StockAlert, Offer, DeliveryZone

## 3. Prisma Schema Structure

Folder layout:

```text
prisma/
├── superadmin/schema.prisma    → SUPERADMIN_DATABASE_URL
├── tenant/schema.prisma        → TENANT_DATABASE_URL
├── ecommerce/schema.prisma     → ECOMMERCE_DATABASE_URL
├── healthcare/schema.prisma    → HEALTHCARE_DATABASE_URL
└── restaurant/schema.prisma    → RESTAURANT_DATABASE_URL
```

Each schema generates its own Prisma client via a separate `generate` config.

text
Each schema generates its own Prisma client via a separate `generate` config.

## 4. Runtime Module Access Flow

1. Request hits API Gateway  
2. `TenantGuard` reads `x-tenant-id` from header  
3. SuperAdmin DB is checked → is this module enabled for this tenant?  
4. Request is routed to correct module service  
5. Module service connects to its own DB with `orgId` scoping via RLS

## 5. Scaling Tiers (Future Reference)

### Tier 1 — MVP (Current) | 0–50 Tenants
- Single Postgres server, schema-per-module on one machine  
- Vertical scaling only  
- No code changes needed to move to Tier 2

### Tier 2 — Growth | 50–500 Tenants
- Each module DB moves to its own Postgres instance (only env var changes)  
- Add PgBouncer for connection pooling  
- Add read replicas for read-heavy modules (e.g. Ecommerce)  
- Add Redis caching for SuperAdmin DB module access checks

### Tier 3 — Scale | 500–10,000 Tenants
- Hybrid model: small tenants share a pooled DB (orgId RLS), enterprise tenants get dedicated DB instances  
- Use Citus extension to shard by `orgId` across nodes  
- No SQL query changes required

### Tier 4 — Hyper-Scale | 10,000+ Tenants
- Each module becomes an independently deployed microservice with its own DB cluster  
- Modules scale independently based on demand  
- Global region DBs: `ecommerce_db_us`, `ecommerce_db_eu`, `ecommerce_db_asia`  
- Event-driven architecture via Kafka/RabbitMQ replaces any cross-module DB calls  
- CQRS + Event Sourcing for write-heavy modules (Orders, Transactions)

## 6. Scaling Rules (Never Break These)

Checklist:

- [ ] Every table in every DB must have `orgId`  
- [ ] No direct DB joins across module DBs — use API calls or events  
- [ ] Modules must never import another module's Prisma client  
- [ ] SuperAdmin DB is the single source of truth for tenant-module access  
- [ ] All cross-module references pass only `userId` + `orgId`, never full objects  
- [ ] New modules always get their own schema/DB — never added to tenant_db

## 7. Adding a New Module (Checklist)

- [ ] Create `prisma/<module_name>/schema.prisma`  
- [ ] Add `<MODULE>_DATABASE_URL` to `.env`  
- [ ] Register module in `superadmin_db` Module table  
- [ ] Add TenantModuleAccess entry to enable for tenants  
- [ ] Create module service folder under `src/modules/<module_name>/`  
- [ ] All tables must include `orgId`, `createdAt`, `updatedAt`

---

This file is intended for developer reference and onboarding.

