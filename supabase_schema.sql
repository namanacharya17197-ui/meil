-- =========================================================================
-- MEIL ESG Connect Platform - Supabase PostgreSQL Schema & Migrations
-- Designed for SEBI BRSR Core Mandate & ISO 14064 GHG Accounting
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Organizations & Corporate Structure
create table if not exists public.organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    cin text,
    code text unique not null,
    entity_type text default 'Subsidiary', -- Group, Subsidiary, JV, BU
    headquarters text,
    parent_org_id uuid references public.organizations(id),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Infrastructure Projects / Asset Sites
create table if not exists public.projects (
    id uuid primary key default uuid_generate_v4(),
    site_code text unique not null,
    name text not null,
    location text not null,
    subsidiary_bu text not null,
    scope1_tco2e numeric(12, 2) default 0,
    scope2_tco2e numeric(12, 2) default 0,
    energy_mix text,
    water_recycled_pct numeric(5, 2) default 0,
    audit_status text default 'Stage-2 Certified',
    status_category text default 'active', -- active, due, high
    latitude numeric(10, 6),
    longitude numeric(10, 6),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Emission Factor Master Library
create table if not exists public.emission_factors (
    id uuid primary key default uuid_generate_v4(),
    fuel_name text unique not null,
    description text,
    factor_value numeric(10, 4) not null,
    factor_unit text not null,
    standard_reference text not null,
    regional_variance text not null,
    sector_type text default 'Combustion', -- Combustion, Grid, International
    last_verified date default current_date,
    audit_locked boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Energy Consumption Ledger (Principle 6 - EI 01)
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
    reported_by text default 'K. V. Rao',
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Evidence Vault Attachments
create table if not exists public.evidence_vault (
    id uuid primary key default uuid_generate_v4(),
    file_name text not null,
    file_size_kb numeric(10, 2),
    mime_type text default 'application/pdf',
    storage_path text,
    sha256_hash text,
    attached_by text default 'Lead Auditor',
    principle_ref text default 'P6-EI-01',
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Audit Logs & Discussion Trail
create table if not exists public.audit_logs (
    id uuid primary key default uuid_generate_v4(),
    author text not null,
    author_role text not null,
    note_text text not null,
    entity_ref text default 'Polavaram Hydro Package',
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. BRSR Statutory Filings
create table if not exists public.brsr_filings (
    id uuid primary key default uuid_generate_v4(),
    fiscal_year text not null,
    reporting_entity text not null,
    filing_format text default 'SEBI Annexure I PDF',
    scope1_total numeric(14, 2),
    scope2_total numeric(14, 2),
    intensity_ratio numeric(8, 2),
    assurance_provider text default 'Ernst & Young LLP',
    assurance_status text default 'Stage-2 Reasonable Assurance',
    digital_signature_hash text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Open for anon read & insert for seamless client connectivity
-- =========================================================================
alter table public.organizations enable row level security;
alter table public.projects enable row level security;
alter table public.emission_factors enable row level security;
alter table public.energy_consumption enable row level security;
alter table public.evidence_vault enable row level security;
alter table public.audit_logs enable row level security;
alter table public.brsr_filings enable row level security;

create policy "Allow public read on organizations" on public.organizations for select using (true);
create policy "Allow public all on projects" on public.projects for all using (true) with check (true);
create policy "Allow public all on emission_factors" on public.emission_factors for all using (true) with check (true);
create policy "Allow public all on energy_consumption" on public.energy_consumption for all using (true) with check (true);
create policy "Allow public all on evidence_vault" on public.evidence_vault for all using (true) with check (true);
create policy "Allow public all on audit_logs" on public.audit_logs for all using (true) with check (true);
create policy "Allow public all on brsr_filings" on public.brsr_filings for all using (true) with check (true);

-- =========================================================================
-- INITIAL SEED DATA
-- =========================================================================

-- Projects / Mega Sites
insert into public.projects (site_code, name, location, subsidiary_bu, scope1_tco2e, scope2_tco2e, energy_mix, water_recycled_pct, audit_status, status_category)
values
('Site #108', 'Zojila Tunnel Project - Portal 1 & 2', 'Kashmir & Ladakh Connectivity', 'MEIL Roads & Infra', 48920, 12180, '18.4% Solar Microgrid', 44.2, 'Flagged Variance', 'due high'),
('Site #042', 'Polavaram Multi-Purpose Irrigation Project', 'Andhra Pradesh Spillway & Hydel Works', 'MEIL Hydro Division', 76400, 19840, '32.6% Hydro Dedicated', 52.8, 'Stage-2 Certified', 'high'),
('Site #014', 'Kaleshwaram Lift Irrigation - Link III', 'Telangana Underground Pump Houses', 'MEIL Hydro Division', 24310, 34100, '41.0% High-Tension Renew', 31.0, 'Review Pending', 'due'),
('Site #INT-09', 'Mongol Oil Refinery EPC-3 & EPC-4', 'Sainshand, Mongolia International EPC', 'MEIL Industrial Plant', 32150, 15400, '12.0% Substation Grid', 26.5, 'Stage-2 Certified', 'active')
on conflict (site_code) do nothing;

-- Master Emission Factors
insert into public.emission_factors (fuel_name, description, factor_value, factor_unit, standard_reference, regional_variance, sector_type)
values
('High-Speed Diesel (HSD)', 'Heavy equipment, DG sets, haul trucks', 2.6865, 'kg CO2e / Litre', 'IPCC 2006 (Vol 2)', 'India All-Region Standard', 'Combustion'),
('Motor Gasoline / Petrol', 'Site inspection fleet & light carriers', 2.3140, 'kg CO2e / Litre', 'DEFRA 2024', 'National Average', 'Combustion'),
('Southern Grid (CEA v19)', 'Polavaram, Kaleshwaram, Telangana Sites', 0.7160, 'kg CO2 / kWh', 'CEA CO2 DB v19', 'Telangana / AP SEBs', 'Grid'),
('Western Grid (CEA v19)', 'Refinery & highway packages (WR)', 0.7380, 'kg CO2 / kWh', 'CEA CO2 DB v19', 'Maharashtra / Gujarat', 'Grid'),
('Piped Natural Gas (PNG)', 'City Gas Distribution networks (MEIL CGD)', 1.9820, 'kg CO2e / Nm³', 'IPCC AR6', 'Standard Composition', 'Combustion'),
('Grid Italy (Drillmec S.p.A)', 'Piacenza Manufacturing & Assembly Facility', 0.2460, 'kg CO2 / kWh', 'ISPRA National Inv.', 'Northern Italy Grid', 'Grid'),
('Grid Kuwait (MEIL ME EPC)', 'MEW Pumping & Desalination Packages', 0.6890, 'kg CO2 / kWh', 'IEA 2024 Country', 'MEW Kuwait Grid', 'Grid')
on conflict (fuel_name) do nothing;

-- Audit Notes Seed
insert into public.audit_logs (author, author_role, note_text)
values
('M. Suresh', 'Lead Auditor', 'Scope 2 emissions verified against Southern Regional Load Despatch Centre monthly billing statements. All clear for sign-off.'),
('K. V. Rao', 'Chief Sustainability Officer', 'Please double check if recycled water quantity includes batching plant washout reuse.');

-- Evidence Vault Seed
insert into public.evidence_vault (file_name, file_size_kb, sha256_hash)
values
('DISCOM_Power_Bills_Q1_Q4_FY26.pdf', 4120.5, 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890'),
('APPCB_Consent_to_Operate_Renewal.pdf', 1840.2, 'f6e5d4c3b2a10987fedcba0987654321fedcba0987654321fedcba0987654321'),
('Heavy_DG_Fuel_Logbooks_Audit.xlsx', 8900.0, '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
