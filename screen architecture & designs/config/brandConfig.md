# 🌌 Celestial Auth Portal: Brand Configuration Guide

This guide ensures our generic authentication pages transform into **YOUR branded experience**. Whether you’re setting up a sleek professional portal or a vibrant consumer app, this configuration file is your roadmap.

---

## 🎨 What This Does
**Generic SaaS Experience** $\rightarrow$ **Your Branded Professional Portal**

## 📁 File Structure (CDN Hosted)
Ensure your assets are hosted in your specific brand directory (e.g., `/brands/acme/`).

| Asset | File Name | Recommended Specs |
| :--- | :--- | :--- |
| **Light Logo** | `logo-light.svg` | 200x50px (Vector) |
| **Dark Logo** | `logo-dark.svg` | For dark mode support |
| **Favicon** | `favicon.ico` | 32x32px |
| **Hero Image** | `auth-bg.jpg` | 1920x1080px (Main background) |

---

## 🎭 Customization Options

### 1. Colors (Live Preview)
The system uses CSS variables to propagate your brand colors across the entire UI.

* **Primary:** `#2563eb` (Main brand color for buttons/links)
* **Hover:** *Auto-generated* (A slightly darker shade for interactions)
* **Secondary:** `#0f172a` (Text and secondary buttons)
* **Background:** `#f8fafc` (The overall page canvas)
* **Surface:** `#ffffff` (Login cards and modals)

### 2. Layout Templates
Choose the structure that best fits your brand identity.

* **Sign In:** `centered` (**Recommended** 👈) | `split` | `card`
* **Sign Up:** `centered` (**Recommended** 👈)
* **MFA:** `totp` (**Recommended** 👈)

### 3. Fonts (Google Fonts)
* **Heading:** `Inter` (Modern & Professional)
* **Body:** `Inter` (Optimized for readability)

---

## 🚀 Onboarding Flow (3 Minutes)

1.  **Upload Assets:** Upload your logo and favicon for an instant preview.
2.  **Pick Colors:** Define your primary color to auto-generate the palette.
3.  **Choose Templates:** Select your preferred layouts and view the live preview.
4.  **Review Text:** Update support links and legal URLs.
5.  **Deploy:** ✅ Push your branded portal live.

---

## 🔧 Developer Usage
The portal auto-injects brand tokens into the application via Vue props and CSS variables.

```vue
<BrandLogo :src="config.brand.logos.logoLight" />
<div :style="'--primary: ' + config.brand.tokens.primary">
  <slot name="auth-form" />
</div>