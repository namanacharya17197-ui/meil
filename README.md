<div align="center">

# 🌿 MEIL ESG CONNECT
### *Sustainability & BRSR Core Compliance, but make it seamless & aesthetic ✨*

[![Backend](https://img.shields.io/badge/Backend-Dual--Mode%20API-6366F1?style=for-the-badge&logo=fastapi&logoColor=white)](#-backend--dual-mode-architecture)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20Connected-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-REST%20API-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Python](https://img.shields.io/badge/Python-3.14%20Native%20API-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![SEBI BRSR](https://img.shields.io/badge/SEBI-BRSR%20Core%20Ready-0052CC?style=for-the-badge&logo=databricks&logoColor=white)](https://www.sebi.gov.in)
[![Dark Mode](https://img.shields.io/badge/Theme-Dark%20%26%20Light-1E293B?style=for-the-badge&logo=visualstudiocode&logoColor=white)](#-dark--light-mode)
[![License](https://img.shields.io/badge/License-Proprietary%20MEIL-0D9488?style=for-the-badge)](https://meil.in)

<p align="center">
  <b>Enterprise-grade, auditable ESG analytics & greenhouse gas accounting for Megha Engineering & Infrastructures Limited (MEIL).</b><br>
  Built strictly to SEBI BRSR Core standards, ISO 14064 GHG protocols, and designed with ultra-crisp responsive UI.
</p>

[✨ Quickstart](#-quickstart-30-seconds) • [⚙️ 6-Step Architecture](#-the-6-step-backend-architecture) • [⚡ Features](#-features--vibes) • [🗄️ Supabase Setup](#-database--supabase-setup) • [📂 Structure](#-repo-architecture)

---

</div>

## 🌟 The Vibe: Why MEIL ESG Connect?

Tracking sustainability across multi-billion dollar mega-infrastructure projects (Hydro, Highways, Tunnels, Oil Refineries, City Gas) shouldn't feel like 2004 Excel spreadsheets.

**MEIL ESG Connect** brings:
- ⚡ **Zero Lag, Zero Bloat**: Built with vanilla ES6+ & Tailwind for instant 60fps interaction.
- 🔄 **Dual-Mode Backend Engine**: Runs instantaneously out-of-the-box via local in-memory/JSON store, and seamlessly elevates to live Supabase Cloud PostgreSQL.
- 🌓 **Day & Night Ready**: One-click Dark Mode toggle matching modern IDEs and executive command centers.
- 🛡️ **SEBI BRSR Core Ready**: 9 NGRBC principles, Scope 1/2/3 GHG accounting, and ISO 14064 audit justifications.
- 🤖 **Gemini AI Copilot**: Predictive anomaly explainers and automated narrative drafting.
- 🔐 **SHA-256 Evidence Vault**: Tamper-proof cryptographic checksums for every uploaded invoice and lab certificate.

---

## ⚙️ The 6-Step Backend Architecture

| Step | Component | Description & Status |
| :---: | :--- | :--- |
| **Step 1** | **Database Schema & SQL Migrations** | `supabase_schema.sql` / `schema.sql`: 8 PostgreSQL tables with RLS policies, P1–P9 BRSR Indicators, and seed data for major MEIL projects (Zojila, Polavaram, Kaleshwaram, Mongol Refinery). |
| **Step 2** | **Backend Server & Dual-Mode API** | `server.js` (Express) & `server.py` (Python 3.14 native): Dual-Mode execution that runs locally (`data/db.json`) and connects live to Supabase PostgreSQL without downtime. |
| **Step 3** | **Calculation & Emission Services** | `services/emissionCalculator.js`: Scope 1 (AD × NCV × EF × OF), Scope 2 (CEA v19), Scope 3, Turnover & LTIFR intensities, and Anomaly Radar detection. |
| **Step 4** | **Evidence Vault & Storage** | `services/evidenceVault.js`: SHA-256 cryptographic checksum calculation, Supabase Storage bucket (`esg-evidence-vault`) integration, and disk fallback (`uploads/`). |
| **Step 5** | **Frontend Client Integration** | `api.js`: Unified API client decoupled from `app.js` with auto-save debouncing, live telemetry sync, and reactive factor overrides. |
| **Step 6** | **RBAC & Authentication** | `middleware/rbac.js`: 6 enterprise governance roles (`Group CSO`, `Subsidiary Approver`, `BU Reviewer`, `Site Engineer`, `Auditor`, `Board Viewer`) with permission enforcement. |

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

This project connects seamlessly to **Supabase Cloud** for real-time data storage, role management, and immutable audit logs.

### 🔑 Cloud Connection Details
The project is pre-configured:
- **Project URL**: `https://tknutnputsafopjfgqdu.supabase.co`
- **Config file**: [`supabaseClient.js`](./supabaseClient.js)

### 🚀 Running the DB Migration (1-Minute Setup)
1. Head over to your [Supabase Dashboard](https://app.supabase.com).
2. Go to **SQL Editor** from the left navigation menu.
3. Open the [`supabase_schema.sql`](./supabase_schema.sql) file included in this repository.
4. Copy the SQL code, paste it into the editor, and click **Run**.
5. Tables created with Row Level Security (RLS) & seed records:
   - `organizations`
   - `projects`
   - `brsr_indicators` (P1 to P9 Master list)
   - `emission_factors`
   - `energy_consumption`
   - `evidence_vault` (with SHA-256 verification)
   - `audit_logs` (immutable audit trails)
   - `brsr_filings`

---

## ⚡ Quickstart (30 Seconds)

### Option A: Python Native Backend (Instant, 0 dependencies)
Python is already installed on Windows. Launch with one line:

```bash
python server.py
```
- 📍 **Frontend & API**: [http://localhost:5000](http://localhost:5000)
- ⚡ **Health Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Option B: Node.js Express Backend
```bash
npm install
npm start
```

---

## 📂 Repo Architecture

```plaintext
meil/
├── 📄 index.html                  # Responsive Single Page Application UI & dashboard
├── 🎨 app.js                      # UI routing, reactive state, modals & event handlers
├── ⚡ api.js                      # Decoupled API client with auto-save & telemetry sync
├── 🔌 supabaseClient.js           # Direct Supabase JS client configuration & ping
├── 🗄️ supabase_schema.sql         # Complete PostgreSQL schema, RLS policies, & seed data
├── 🗄️ schema.sql                  # PostgreSQL mirror schema
├── 🚀 server.js                   # Node.js + Express Dual-Mode REST API server
├── 🐍 server.py                   # Python 3.14 native Dual-Mode REST API server
├── 📦 package.json                # Node.js package manifest & dependencies
├── 📁 data/
│   └── 💾 db.json                 # In-memory / local JSON database for offline mode
├── 📁 middleware/
│   └── 🛡️ rbac.js                 # 6 Governance Roles & permission middleware
├── 📁 services/
│   ├── 🧮 emissionCalculator.js   # Scope 1, 2, 3 math, intensity & anomaly radar
│   └── 🔐 evidenceVault.js        # SHA-256 cryptographic verification & storage
└── 📖 README.md                   # Full platform documentation ✨
```

---

## 🛠️ REST API Endpoints

| Method | Endpoint | Description | Auth / Role Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health & Dual-Mode storage status | Public |
| `GET` | `/api/organizations` | Corporate hierarchy (Group -> Subsidiary -> Site) | Public |
| `GET` | `/api/projects` | Active infrastructure project ledger | Public |
| `GET` | `/api/emission-factors` | Master 28-factor emission library | Public |
| `PUT` | `/api/emission-factors/:id`| Update emission factor with mandatory justification | `Group ESG Admin` |
| `POST`| `/api/calculate` | Server-side GHG (Scope 1, 2, 3) & intensity math | Public |
| `GET` | `/api/anomalies` | Anomaly radar detection algorithm output | Public |
| `POST`| `/api/energy-consumption`| Record energy consumption ledger entry | `Project Data Entry User` |
| `GET` | `/api/evidence` | List evidence vault documents with SHA-256 hashes | Public |
| `POST`| `/api/evidence/upload` | Upload evidence with automatic SHA-256 calculation | `Site Engineer` |
| `POST`| `/api/evidence/verify` | Cryptographically verify file against expected hash | Public |
| `GET` | `/api/audit-logs` | Immutable audit trail & compliance discussions | Public |
| `POST`| `/api/audit-logs` | Post compliance discussion note | Any authorized role |
| `GET` | `/api/brsr/indicators` | Master BRSR Principle 1–9 indicators | Public |

---

<div align="center">

Crafted with 💚 for **Megha Engineering & Infrastructures Limited (MEIL)**

*Bridging Engineering Excellence & Sustainable Future 🌍*

</div>
