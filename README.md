<div align="center">

# 🌿 MEIL ESG CONNECT
### *Sustainability & BRSR Core Compliance, but make it seamless & aesthetic ✨*

[![Supabase](https://img.shields.io/badge/Supabase-Database%20Connected-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![SEBI BRSR](https://img.shields.io/badge/SEBI-BRSR%20Core%20Ready-0052CC?style=for-the-badge&logo=databricks&logoColor=white)](https://www.sebi.gov.in)
[![Dark Mode](https://img.shields.io/badge/Theme-Dark%20%26%20Light-1E293B?style=for-the-badge&logo=visualstudiocode&logoColor=white)](#-dark--light-mode)
[![License](https://img.shields.io/badge/License-Proprietary%20MEIL-0D9488?style=for-the-badge)](https://meil.in)

<p align="center">
  <b>Enterprise-grade, auditable ESG analytics & greenhouse gas accounting for Megha Engineering & Infrastructures Limited (MEIL).</b><br>
  Built strictly to SEBI BRSR Core standards, ISO 14064 GHG protocols, and designed with ultra-crisp responsive UI.
</p>

[✨ Live Demo](#-quickstart-30-seconds) • [⚡ Features](#-features--vibes) • [🗄️ Supabase Setup](#-database--supabase-setup) • [📂 Structure](#-repo-architecture) • [🚀 Deploy](#-production-deployment)

---

</div>

## 🌟 The Vibe: Why MEIL ESG Connect?

Tracking sustainability across multi-billion dollar mega-infrastructure projects (Hydro, Highways, Tunnels, Oil Refineries, City Gas) shouldn't feel like 2004 Excel spreadsheets.

**MEIL ESG Connect** brings:
- ⚡ **Zero Lag, Zero Bloat**: Built with vanilla ES6+ & Tailwind for instant 60fps interaction.
- 🗄️ **Supabase Cloud Sync**: Live PostgreSQL persistence with offline-first graceful fallback.
- 🌓 **Day & Night Ready**: One-click Dark Mode toggle matching modern IDEs and executive command centers.
- 🛡️ **SEBI BRSR Core Ready**: 9 NGRBC principles, Scope 1/2/3 GHG accounting, and ISO 14064 audit justifications.
- 🤖 **Gemini AI Copilot**: Predictive anomaly explainers and automated narrative drafting.

---

## ⚡ Features & Vibes

### 1. 📊 Executive Command Center (`#executive-dashboard`)
* **Real-time Anomaly Ticker**: Live alerts for diesel spikes (e.g., Zojila West Portal) backed by Gemini AI root cause reasoning.
* **SEBI BRSR Filing Countdown**: 42-day compliance countdown with stage-2 assurance checklist.
* **Corporate KPI Matrix**:
  - `84.6%` Overall data completeness across 1,298 indicators.
  - `418,240 tCO₂e` Total Scope 1 & 2 emissions + `14.2 tCO₂e / ₹ Cr` intensity.
  - `28.4%` Renewable energy mix & `38.5%` Zero-liquid discharge recycling.
  - `0.14` LTIFR with **Zero Fatalities** over 46.8M safe man-hours.
* **Interactive SVG Visualizations**: Trajectory charts comparing actual carbon footprints against budget ceilings + instant CSV export.
* **Subsidiary Breakdown**: Drillmec SpA, Megha City Gas, Olectra Greentech, ICOMM Tele, Hydro, and Infra divisions.

### 2. 📑 BRSR Section C: Principle-Wise Performance (`#brsr-section-c-principle-wise-performance`)
* **P1 to P9 Navigation Strip**: Instant switcher across all National Guidelines on Responsible Business Conduct principles.
* **P6 Deep Dive (Environment)**:
  - Reactive energy input tables (Grid MWh, Captive Solar, Diesel KL, PNG GJ) with auto-recalculation of Renewable Ratios and total energy in GJ.
  - Scope 1, 2, and 3 emission real-time ledger cards.
  - Zero Liquid Discharge (ZLD) water accounting & hazardous waste management streams.
* **Inline Unit Converter**: Flyout utility to convert kWh ⇄ MWh ⇄ GJ, Litres ⇄ KL ⇄ MT, and m³ ⇄ KL.
* **Evidence Vault**: Attachment manager with multi-format chip uploads, audit notes, and auditor sign-offs.

### 3. 🔬 Calculation & Emission Engine (`#calculation-and-emission-engine`)
* **Consolidated Carbon Ledger**: Live calculation of `541,617 tCO₂e` across direct combustion, electricity, and supply chain.
* **Transparent Math Formulas**:
  - *Scope 1 Tier 3*: `Activity Data × Net Calorific Value × Emission Factor × Oxidation Factor`
  - *Scope 2*: CEA Baseline Database v19 location-based method.
  - *Scope 3*: Hybrid spend-based & physical volume allocation.
* **Master 28-Factor Emission Library**:
  - Instant search and sector category filtering.
  - Audit modal override enforcing regulatory justification for factor alterations.

### 4. 📄 BRSR Report Generator & XBRL Suite (`#brsr-report-generator`)
* **Regulatory Formats**: SEBI Annexure I BRSR PDF, BSE/NSE XBRL Taxonomy XML, and Audited Databook exports.
* **Digital Assurance Seal**: External third-party verification watermark (Ernst & Young LLP, Stage-2 Assurance).
* **Print-Ready Layout**: Optimized print CSS for instant executive distribution via `Ctrl+P` / `Cmd+P`.

### 5. 🌓 Dark & Light Mode
* Handcrafted dark color scheme (`#0b1320` base, `#111c2e` cards, and `#93c5fd` accents).
* Persisted state in `localStorage` with system preference detection.

---

## 🗄️ Database & Supabase Setup

This project uses **Supabase Cloud** for real-time data storage, role management, and immutable audit logs.

### 🔑 Cloud Connection Details
The project is pre-configured to connect to Supabase:
- **Project URL**: `https://tknutnputsafopjfgqdu.supabase.co`
- **Config file**: [`supabaseClient.js`](./supabaseClient.js)

### 🚀 Running the DB Migration (1-Minute Setup)
1. Head over to your [Supabase Dashboard](https://app.supabase.com).
2. Go to **SQL Editor** from the left navigation menu.
3. Open the [`supabase_schema.sql`](./supabase_schema.sql) file included in this repository.
4. Copy the SQL code, paste it into the editor, and click **Run**.
5. *Boom!* Tables created with Row Level Security (RLS) & seed records:
   - `organizations`
   - `projects` (Zojila, Polavaram, Kaleshwaram, etc.)
   - `emission_factors` (CEA v19, Diesel, Natural Gas, etc.)
   - `energy_consumption`
   - `evidence_vault`
   - `audit_logs`
   - `brsr_filings`

---

## ⚡ Quickstart (30 Seconds)

No complicated `npm install` or node dependency hell. Clone & launch right away:

```bash
# 1. Clone the repo
git clone https://github.com/namanacharya17197-ui/meil.git

# 2. Enter project folder
cd meil

# 3. Launch with Python local server (or any HTTP server)
python -m http.server 8080
```

Now open **[http://localhost:8080](http://localhost:8080)** in your browser! 🚀

---

## 📂 Repo Architecture

```plaintext
meil/
├── 📄 index.html          # Full responsive Single Page Application UI & layouts
├── 🎨 app.js              # Client-side hash routing, reactive formulas, & modals
├── ⚡ supabaseClient.js   # Supabase cloud DB connection & real-time sync handlers
├── 🗄️ supabase_schema.sql # Complete PostgreSQL schema, RLS policies, & seed data
└── 📖 README.md           # You are here ✨
```

---

## 🛠️ Tech Stack & Badges

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | HTML5 + Modern CSS | Semantic structure, zero external JS frameworks |
| **Styling** | Tailwind CSS v3.4 | Dynamic theming with customized MEIL design system |
| **Icons & Typography** | Google Fonts | Inter & Manrope typography + Material Symbols Outlined |
| **Database** | Supabase (PostgreSQL) | Managed PostgreSQL, Row Level Security, Realtime REST |
| **Compliance** | SEBI BRSR Core | NGRBC Principles 1-9, ISO 14064, CEA Baseline v19 |

---

## 🔒 Security & Compliance
- **Zero Exposure**: Client uses Supabase Anon Key with Row-Level Security (RLS) enabled.
- **Audit Trails**: Every emission factor override records user identity, timestamp, and mandatory justification note.
- **Fail-Safe Offline Mode**: If offline or schema is pending, app runs seamlessly in mock mode without throwing unhandled exceptions.

---

<div align="center">

Crafted with 💚 for **Megha Engineering & Infrastructures Limited (MEIL)**

*Bridging Engineering Excellence & Sustainable Future 🌍*

</div>
