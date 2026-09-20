-- =========================================================================
-- MEIL ESG Connect Platform - PostgreSQL / Supabase Schema (schema.sql)
-- Designed for SEBI BRSR Core Mandate & ISO 14064 GHG Accounting
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Organizations & Corporate Structure (Hierarchy)
create table if not exists public.organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    cin text,
    code text unique not null,
    entity_type text default 'Subsidiary', -- Group, Subsidiary, Business Unit, Site
    headquarters text,
    parent_org_code text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Infrastructure Projects / Asset Sites Ledger
create table if not exists public.projects (
    id uuid primary key default uuid_generate_v4(),
    site_code text unique not null,
    name text not null,
    location text not null,
    subsidiary_bu text not null,
    scope1_tco2e numeric(12, 2) default 0,
    scope2_tco2e numeric(12, 2) default 0,
    scope3_tco2e numeric(12, 2) default 0,
    turnover_cr numeric(10, 2) default 500,
    safe_man_hours numeric(12, 2) default 1000000,
    energy_mix text,
    water_recycled_pct numeric(5, 2) default 0,
    audit_status text default 'Stage-2 Certified',
    status_category text default 'active', -- active, due, high
    latitude numeric(10, 6),
    longitude numeric(10, 6),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. BRSR Principles 1-9 Indicators Master Table
create table if not exists public.brsr_indicators (
    id uuid primary key default uuid_generate_v4(),
    principle_code text not null, -- P1, P2, ... P9
    principle_title text not null,
    indicator_code text unique not null, -- e.g. P6-EI-01, P3-EI-02
    indicator_name text not null,
    indicator_type text default 'Essential', -- Essential, Leadership
    unit_of_measure text,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Emission Factor Master Library (28-Factor Master)
create table if not exists public.emission_factors (
    id uuid primary key default uuid_generate_v4(),
    fuel_name text unique not null,
    description text,
    factor_value numeric(10, 4) not null,
    factor_unit text not null,
    standard_reference text not null,
    regional_variance text not null,
    sector_type text default 'Combustion', -- Combustion, Grid, International, Transport
    last_verified date default current_date,
    audit_locked boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Energy Consumption Ledger (Principle 6 - Environment)
create table if not exists public.energy_consumption (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references public.projects(id),
    reporting_fiscal_year text default 'FY 2025-26',
    grid_mwh numeric(12, 2) default 0,
    solar_mwh numeric(12, 2) default 0,
    diesel_kl numeric(12, 2) default 0,
    png_gj numeric(12, 2) default 0,
    renewable_ratio_pct numeric(5, 2) default 0,
    total_energy_gj numeric(14, 2) default 0,
    calculated_scope1_tco2e numeric(12, 2) default 0,
    calculated_scope2_tco2e numeric(12, 2) default 0,
    calculated_scope3_tco2e numeric(12, 2) default 0,
    reported_by text default 'K. V. Rao',
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Evidence Vault Attachments (SHA-256 Checksummed)
create table if not exists public.evidence_vault (
    id uuid primary key default uuid_generate_v4(),
    file_name text not null,
    file_size_kb numeric(10, 2),
    mime_type text default 'application/pdf',
    storage_path text,
    sha256_hash text not null,
    attached_by text default 'Lead Auditor',
    author_role text default 'Auditor/Assurance Provider',
    principle_ref text default 'P6-EI-01',
    verification_status text default 'Verified', -- Verified, Pending, Flagged
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Immutable Audit Trail & Discussion Logs
create table if not exists public.audit_logs (
    id uuid primary key default uuid_generate_v4(),
    author text not null,
    author_role text not null,
    note_text text not null,
    entity_ref text default 'Polavaram Hydro Package',
    action_type text default 'NOTE', -- NOTE, FACTOR_UPDATE, ASSURANCE_SIGN, FILE_UPLOAD
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 8. BRSR Statutory Filings & Digital Assurance
create table if not exists public.brsr_filings (
    id uuid primary key default uuid_generate_v4(),
    fiscal_year text not null,
    reporting_entity text not null,
    filing_format text default 'SEBI Annexure I PDF',
    scope1_total numeric(14, 2),
    scope2_total numeric(14, 2),
    scope3_total numeric(14, 2),
    intensity_ratio numeric(8, 2),
    assurance_provider text default 'Ernst & Young LLP',
    assurance_status text default 'Stage-2 Reasonable Assurance',
    digital_signature_hash text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
alter table public.organizations enable row level security;
alter table public.projects enable row level security;
alter table public.brsr_indicators enable row level security;
alter table public.emission_factors enable row level security;
alter table public.energy_consumption enable row level security;
alter table public.evidence_vault enable row level security;
alter table public.audit_logs enable row level security;
alter table public.brsr_filings enable row level security;

create policy "Allow public read on organizations" on public.organizations for select using (true);
create policy "Allow public all on projects" on public.projects for all using (true) with check (true);
create policy "Allow public read on brsr_indicators" on public.brsr_indicators for select using (true);
create policy "Allow public all on emission_factors" on public.emission_factors for all using (true) with check (true);
create policy "Allow public all on energy_consumption" on public.energy_consumption for all using (true) with check (true);
create policy "Allow public all on evidence_vault" on public.evidence_vault for all using (true) with check (true);
create policy "Allow public all on audit_logs" on public.audit_logs for all using (true) with check (true);
create policy "Allow public all on brsr_filings" on public.brsr_filings for all using (true) with check (true);

-- =========================================================================
-- INITIAL SEED DATA
-- =========================================================================

-- Organizations Structure
insert into public.organizations (name, code, entity_type, headquarters, parent_org_code)
values
('Megha Engineering & Infrastructures Limited', 'MEIL-GRP', 'Group', 'Hyderabad, India', null),
('MEIL Hydro Division', 'MEIL-HYD', 'Subsidiary', 'Hyderabad, India', 'MEIL-GRP'),
('MEIL Roads & Infra Division', 'MEIL-RND', 'Subsidiary', 'Hyderabad, India', 'MEIL-GRP'),
('Drillmec S.p.A.', 'MEIL-DRL', 'Subsidiary', 'Piacenza, Italy', 'MEIL-GRP'),
('Megha City Gas Distribution Pvt Ltd', 'MEIL-CGD', 'Subsidiary', 'Hyderabad, India', 'MEIL-GRP'),
('Olectra Greentech Limited', 'MEIL-OLC', 'Subsidiary', 'Hyderabad, India', 'MEIL-GRP'),
('ICOMM Tele Limited', 'MEIL-ICM', 'Subsidiary', 'Hyderabad, India', 'MEIL-GRP')
on conflict (code) do nothing;

-- Projects / Mega Sites
insert into public.projects (site_code, name, location, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
values
('Site #108', 'Zojila Tunnel Project - Portal 1 & 2', 'Kashmir & Ladakh Connectivity', 'MEIL Roads & Infra', 48920, 12180, 18500, 3850.00, 8420000, '18.4% Solar Microgrid', 44.2, 'Flagged Variance', 'due high'),
('Site #042', 'Polavaram Multi-Purpose Irrigation Project', 'Andhra Pradesh Spillway & Hydel Works', 'MEIL Hydro Division', 76400, 19840, 24600, 7200.00, 16200000, '32.6% Hydro Dedicated', 52.8, 'Stage-2 Certified', 'high'),
('Site #014', 'Kaleshwaram Lift Irrigation - Link III', 'Telangana Underground Pump Houses', 'MEIL Hydro Division', 24310, 34100, 14200, 4100.00, 9500000, '41.0% High-Tension Renew', 31.0, 'Review Pending', 'due'),
('Site #INT-09', 'Mongol Oil Refinery EPC-3 & EPC-4', 'Sainshand, Mongolia International EPC', 'MEIL Industrial Plant', 32150, 15400, 11800, 2900.00, 6100000, '12.0% Substation Grid', 26.5, 'Stage-2 Certified', 'active')
on conflict (site_code) do nothing;

-- Master BRSR Principles 1-9 Indicators
insert into public.brsr_indicators (principle_code, principle_title, indicator_code, indicator_name, indicator_type, unit_of_measure, description)
values
('P1', 'Ethics, Transparency & Accountability', 'P1-EI-01', 'Anti-corruption & Anti-bribery policy coverage', 'Essential', '% Operations', 'Coverage of anti-corruption code across all operating units and subcontractors'),
('P1', 'Ethics, Transparency & Accountability', 'P1-EI-02', 'Disciplinary actions taken against KMPs/Employees', 'Essential', 'Number', 'Disciplinary actions relating to integrity, conflict of interest, or whistle-blower complaints'),
('P2', 'Product Lifecycle Sustainability', 'P2-EI-01', 'Life Cycle Assessment (LCA) conducted', 'Essential', '% Turnover', 'Turnover from infrastructure packages covered by third-party ISO 14040/44 LCA study'),
('P2', 'Product Lifecycle Sustainability', 'P2-EI-02', 'Sustainable sourcing & recycled material inputs', 'Essential', '% Sourced Material', 'Recycled steel, fly-ash blend cement, and sustainable quarry aggregates used in construction'),
('P3', 'Employee Well-being & Safety', 'P3-EI-01', 'Lost Time Injury Frequency Rate (LTIFR)', 'Essential', 'Per Mn Man-Hours', 'Total lost time injuries normalized per million safe employee & contractor man-hours'),
('P3', 'Employee Well-being & Safety', 'P3-EI-02', 'Permanent & Contractual Workforce Diversity', 'Essential', '% Female Ratio', 'Percentage of female employees overall and in key management positions (KMP/Board)'),
('P4', 'Stakeholder Engagement', 'P4-EI-01', 'Vulnerable & Marginalized Community Engagement', 'Essential', '% Projects', 'Social Impact Assessments (SIA) and public hearing consultations completed before site initiation'),
('P5', 'Human Rights & Fair Labour', 'P5-EI-01', 'Human rights due diligence & grievance mechanism', 'Essential', '% Sites Covered', 'Active grievance redressal mechanisms and child/forced labour audit certifications'),
('P6', 'Environmental Protection', 'P6-EI-01', 'Total Electricity & Direct Fuel Energy Consumption', 'Essential', 'Gigajoules (GJ)', 'Scope 1 direct diesel/gas combustion and Scope 2 grid electricity across all operational packages'),
('P6', 'Environmental Protection', 'P6-EI-02', 'Total Scope 1 and Scope 2 GHG Emissions', 'Essential', 'Metric Tonnes CO2e', 'Direct stationary & mobile combustion + location-based electricity emissions per ISO 14064'),
('P6', 'Environmental Protection', 'P6-EI-03', 'Water Withdrawal & Zero Liquid Discharge (ZLD)', 'Essential', 'Kilolitres (KL)', 'Groundwater, surface water, and recycled effluent treated via STP/ETP setups'),
('P7', 'Responsible Public Policy Advocacy', 'P7-EI-01', 'Affiliation with Trade & Industry Associations', 'Essential', 'Count', 'Membership in CII, FICCI, ASSOCHAM, and national infrastructure taskforces'),
('P8', 'Inclusive Growth & CSR Value Creation', 'P8-EI-01', 'Corporate Social Responsibility (CSR) Spend', 'Essential', '₹ Crores', 'Statutory 2% net profit CSR allocation disbursed in education, healthcare, and rural infrastructure'),
('P9', 'Consumer Value & Responsible Service', 'P9-EI-01', 'Client Quality Audits & Public Safety Compliance', 'Essential', '% Deliverables', 'Independent safety audit certificates and defect liability compliance ratios')
on conflict (indicator_code) do nothing;

-- Master Emission Factors (28-Factor Library Sample)
insert into public.emission_factors (fuel_name, description, factor_value, factor_unit, standard_reference, regional_variance, sector_type)
values
('High-Speed Diesel (HSD)', 'Heavy equipment, DG sets, haul trucks', 2.6865, 'kg CO2e / Litre', 'IPCC 2006 (Vol 2)', 'India All-Region Standard', 'Combustion'),
('Motor Gasoline / Petrol', 'Site inspection fleet & light carriers', 2.3140, 'kg CO2e / Litre', 'DEFRA 2024', 'National Average', 'Combustion'),
('Southern Grid (CEA v19)', 'Polavaram, Kaleshwaram, Telangana Sites', 0.7160, 'kg CO2 / kWh', 'CEA CO2 DB v19', 'Telangana / AP SEBs', 'Grid'),
('Western Grid (CEA v19)', 'Refinery & highway packages (WR)', 0.7380, 'kg CO2 / kWh', 'CEA CO2 DB v19', 'Maharashtra / Gujarat', 'Grid'),
('Northern Grid (CEA v19)', 'Zojila tunnel, UP/Haryana infrastructure', 0.7420, 'kg CO2 / kWh', 'CEA CO2 DB v19', 'Northern Regional Grid', 'Grid'),
('Piped Natural Gas (PNG)', 'City Gas Distribution networks (MEIL CGD)', 1.9820, 'kg CO2e / Nm³', 'IPCC AR6', 'Standard Composition', 'Combustion'),
('Liquefied Petroleum Gas (LPG)', 'Worker camps & pre-cast heating', 2.9830, 'kg CO2e / kg', 'IPCC 2006 (Vol 2)', 'National Commercial Blend', 'Combustion'),
('Grid Italy (Drillmec S.p.A)', 'Piacenza Manufacturing & Assembly Facility', 0.2460, 'kg CO2 / kWh', 'ISPRA National Inv.', 'Northern Italy Grid', 'International'),
('Grid Kuwait (MEIL ME EPC)', 'MEW Pumping & Desalination Packages', 0.6890, 'kg CO2 / kWh', 'IEA 2024 Country', 'MEW Kuwait Grid', 'International'),
('Furnace Oil / Fuel Oil', 'Batching plant steam generation', 3.1770, 'kg CO2e / Litre', 'IPCC 2006 (Vol 2)', 'Industrial Grade FO', 'Combustion')
on conflict (fuel_name) do nothing;

-- Initial Seed Audit Logs
insert into public.audit_logs (author, author_role, note_text, entity_ref, action_type)
values
('M. Suresh', 'Lead Auditor', 'Scope 2 emissions verified against Southern Regional Load Despatch Centre monthly billing statements. All clear for sign-off.', 'Polavaram Spillway', 'NOTE'),
('K. V. Rao', 'Chief Sustainability Officer', 'Please double check if recycled water quantity includes batching plant washout reuse.', 'Zojila Tunnel', 'NOTE'),
('S. K. Verma', 'Site Engineer', 'Batching plant fuel calibration log submitted with calibration certificate SHA-256 registered.', 'Site #108 Zojila', 'FILE_UPLOAD');

-- Initial Evidence Vault Seeds
insert into public.evidence_vault (file_name, file_size_kb, sha256_hash, attached_by, author_role, principle_ref, verification_status)
values
('DISCOM_Power_Bills_Q1_Q4_FY26.pdf', 4120.5, 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890', 'M. Suresh', 'Lead Auditor', 'P6-EI-01', 'Verified'),
('APPCB_Consent_to_Operate_Renewal.pdf', 1840.2, 'f6e5d4c3b2a10987fedcba0987654321fedcba0987654321fedcba0987654321', 'K. V. Rao', 'Chief Sustainability Officer', 'P6-EI-03', 'Verified'),
('Heavy_DG_Fuel_Logbooks_Audit.xlsx', 8900.0, '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'S. K. Verma', 'Site Engineer', 'P6-EI-02', 'Verified');
