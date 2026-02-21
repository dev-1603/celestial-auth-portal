# 🌌 Celestial-Auth-Portal

**Celestial-Auth-Portal** is a production-ready **Authentication-as-a-Service (AaaS)** and **Shell Orchestrator** toolkit. It provides a centralized identity gateway designed to power modular SaaS ecosystems with high-performance multi-tenancy.

This project is a **pluggable toolkit**: it provides a rock-solid backend engine and the same Portal/Shell experience implemented in two different frameworks. You simply pick the core and the frontend "skin" that matches your project's technical DNA.

---

## 🏗️ The "Pick Your Framework" Architecture

The project consists of one central engine and two interchangeable frontend implementations:



### 1. The Engine: `backend-node-core`
The framework-agnostic Node.js core. This is the "Source of Truth" for your entire ecosystem.
* **Purpose:** Handles tenant isolation (`orgId`), RBAC, JWT session management, and database orchestration via Prisma.
* **Flexibility:** Written in clean TypeScript, ready to be wrapped in **Express** for simplicity or **NestJS** for enterprise modularity.

### 2. The Skin: `frontend-shell-[react|vue]`
The same Portal/Shell features, built twice. Whether you choose React or Vue, you get the same capabilities:
* **Landing Pages:** CMS-ready Home, About, and FAQ sections.
* **Auth UI:** Login, Registration, and Password Recovery flows.
* **Launchpad:** A tenant-aware dashboard that directs users to their authorized applications post-authentication.

---

## 🚀 Key Features

* **Interchangeable Frontends:** Seamlessly switch between the **Next.js/React** implementation or the **Vite/Vue** implementation without changing a single line of backend logic.
* **Enterprise Multi-Tenancy:** Built-in support for organization-based data isolation and tenant-aware routing.
* **Unified Identity Gateway:** A centralized portal that maintains session state across different sub-domains and micro-apps.
* **CMS-Driven Content:** Structured to fetch dynamic landing page content from a headless CMS (like Payload or Strapi) or local JSON.
* **Security First:** Implementation-ready for secure token rotation, HTTP-only cookies, and Row-Level Security (RLS).

---

## 🛠️ Tech Stack

- **Backend Core:** Node.js (TypeScript), PostgreSQL, Prisma, Supabase-ready.
- **Frontend Choice A:** Next.js 15 (React), Tailwind CSS, Shadcn/ui, Zustand.
- **Frontend Choice B:** Vue 3 (Vite), Tailwind CSS, Headless UI, Pinia.

---

## 📖 How to Deploy

This module is designed for a **"Select & Connect"** workflow:

1. **Initialize Backend:** Deploy the `backend-node-core` as your central Auth service.
2. **Select Frontend:** - **Option React:** Use `frontend-shell-react` for a Next.js-based orchestrator.
    - **Option Vue:** Use `frontend-shell-vue` for a Vue-based reactive dashboard.
3. **Point & Launch:** Configure your chosen frontend to point to the Backend API URL and start onboarding tenants.

---

## 📁 Repository Structure

```text
celestial-auth-portal/
├── backend-auth-core/       # Core Auth & Tenant Logic (Node.js)
├── auth-client-react/    # Portal implementation in React/Next.js
└── auth-client-vue/      # Portal implementation in Vue/Vite
