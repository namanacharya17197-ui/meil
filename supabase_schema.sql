-- =========================================================================
-- MEIL ESG Connect Platform - Supabase PostgreSQL Schema & Migrations
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
    state_region text,
    category text,
    status text,
    water_source text,
    key_infrastructure text,
    scale_served text,
    summary text,
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


-- =========================================================================
-- 25 MEIL Major Water Infrastructure Projects Seed Data
-- =========================================================================

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #042', 'Polavaram Project', 'Andhra Pradesh', 'Andhra Pradesh - Godavari River', 'Multipurpose (Irrigation + Drinking Water + Hydropower)', 'Ongoing (MEIL since Nov 2019)', 'Godavari River', 'World''s largest spillway (1.18 km, 48 radial gates); 2.45 km earth-cum-rock-fill dam; 1,372 m diaphragm wall (95 m deep); 960 MW powerhouse (12 x 80 MW turbines)', 'Andhra Pradesh statewide irrigation drinking water and power', 'One of India''s largest multi-purpose infrastructure projects delivering irrigation drinking water and clean hydropower', 'MEIL Hydro Division', 76400, 19840, 24600, 7200.0, 16200000, '32.6% Hydro Dedicated', 52.8, 'Stage-2 Certified', 'high')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #089', 'Gangadhar Meher Lift Irrigation Project', 'Odisha (Bargarh & Sonepur districts)', 'Odisha (Bargarh & Sonepur districts) - Hirakud Dam', 'Lift Irrigation', 'Partially commissioned', 'Hirakud Dam', '20 km pipeline (4 m dia); 2 pump houses (Turunga & Kanapali); 3,000+ km pipeline network; drip irrigation on ~7,500 ha', '25000+ hectares across 130 villages', 'Won Best Infrastructure Pioneer award at 17th Water Digest World Water Awards 2023-24', 'MEIL Hydro & Irrigation Division', 18200, 8450, 6100, 1450.0, 4200000, '24.5% Renewable Mix', 61.2, 'Stage-2 Certified', 'high')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #115', 'Kalisindh Phase 2 Project', 'Madhya Pradesh (Shajapur & Rajgarh districts)', 'Madhya Pradesh (Shajapur & Rajgarh districts) - Not specified (regional river source)', 'Lift Irrigation', 'Ongoing', 'Not specified (regional river source)', '100+ km main pipeline (4.6 m wide); 7,000+ km distribution network; 100 km transmission line on 300 towers; multiple pump houses', '110000+ hectares', 'Large pipeline and distribution network to irrigate highland farm areas via pumped delivery', 'MEIL Water & Irrigation', 29400, 14100, 9800, 2600.0, 6800000, '21.0% Grid & Solar', 44.0, 'Stage-2 In Progress', 'due')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #031', 'Narmada-Kshipra-Simhastha Link Project', 'Madhya Pradesh (Ujjain & Shajapur / Malwa region)', 'Madhya Pradesh (Ujjain & Shajapur / Malwa region) - Omkareshwar Reservoir', 'River-Linking Lift Irrigation', 'Completed (2014)', 'Omkareshwar Reservoir', '3 stages, 8 machines per pump house; lifts 5 cumecs over 47 km; total machinery capacity 27.5 MW; lift range 228-576 m', 'Malwa region irrigation and socio-economic development', 'India''s first river-linking project by lift addressing water scarcity in the Chambal basin', 'MEIL Hydro Division', 14200, 28500, 4300, 1800.0, 5100000, '35.0% Hydro Clean Power', 58.0, 'Audited & Verified', 'active')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #067', 'Kadana Lift Irrigation Scheme', 'Gujarat (border districts with MP & Rajasthan)', 'Gujarat (border districts with MP & Rajasthan) - Kadana Reservoir / River Narmada', 'Lift Irrigation + Drinking Water', 'Ongoing', 'Kadana Reservoir / River Narmada', '16 machines per pump house; each motor capacity 5826 cubic metres per hour', 'Eastern Gujarat border districts', 'Lifts water from Kadana into River Mahisagar and onward to Narmada for irrigation and drinking supply', 'MEIL Water & Irrigation', 19800, 11400, 5200, 1650.0, 3900000, '28.0% Clean Mix', 49.5, 'Stage-2 In Progress', 'due')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #014', 'Gayatri Pumphouse (Kaleshwaram Lift Irrigation Project)', 'Telangana (Karimnagar district)', 'Telangana (Karimnagar district) - Godavari River (via Sripadasagar Yellampalli project)', 'Lift Irrigation', 'Completed (built in under 42 months)', 'Godavari River (via Sripadasagar Yellampalli project)', 'World''s largest irrigation pumping station; 7 machines x 139 MW = 973 MW total; underground at 178 m RSL; twin tunnels 4,133 m long, 10.5 m diameter; 4 surge pools (main surge pool 325 m)', 'Key link in the Kaleshwaram Lift Irrigation Project (KLIP)', 'Diverts Godavari water into the Mid Manair reservoir pumping ~2 TMC ft of water daily to a height of 118 m RSL', 'MEIL Hydro Division', 24310, 34100, 14200, 4100.0, 9500000, '41.0% High-Tension Renew', 55.0, 'Stage-2 Certified', 'high')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #056', 'Saurashtra Narmada Avtaran (SAUNI Yojana)', 'Gujarat (11 Saurashtra districts incl. Rajkot Jamnagar Morbi)', 'Gujarat (11 Saurashtra districts incl. Rajkot Jamnagar Morbi) - River Narmada floodwater (via Kadana & Panam dams)', 'Irrigation + Drinking Water', 'Ongoing (Phase 2 completed)', 'River Narmada floodwater (via Kadana & Panam dams)', '1,125 km pipeline network; 5 pumps, 7 motors, 66/6.6 kV substation; 2,761 million cubic feet pumping capacity', 'Fills 115+ dams; drinking water to 731 villages and 31 towns', 'Piped (not canal) delivery of Narmada floodwater to drought-prone Saurashtra region', 'MEIL Water & Irrigation', 36200, 21400, 13500, 3950.0, 8900000, '29.4% Solar/Wind Hybrid', 51.2, 'Stage-2 Certified', 'high')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #073', 'Ramthal Drip Irrigation Project', 'Karnataka (Bagalkot district)', 'Karnataka (Bagalkot district) - Narayanpura Reservoir on River Krishna', 'Drip Irrigation', 'Completed (2017)', 'Narayanpura Reservoir on River Krishna', '2,127.46 km pipeline network (48.54 km GRP + 128.89 km PVC feeder + 1,950 km PVC mains/sub-mains); pump house, surge tank, valve chambers', '28911 acres across 22 villages', 'Asia''s largest community-based automated drip irrigation project executed with Netafim', 'MEIL Micro-Irrigation', 9800, 6200, 2900, 1100.0, 3200000, '38.5% Clean Solar', 78.4, 'Audited & Verified', 'active')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #019', 'Mission Bhagiratha & GDWSS', 'Telangana', 'Telangana - Godavari River', 'Drinking Water', 'Completed', 'Godavari River', '14 key segments; Gajwel Water Grid (~1,200 km pipeline, built in 10 months); 735 MLD water treatment plant at Mallaram', '15 million+ people served (designed capacity ~20 million)', 'Brings Godavari water to Hyderabad and statewide habitations via long-distance transmission mains and reservoirs', 'MEIL Water Supply Division', 42100, 38900, 16700, 5400.0, 12400000, '34.0% Low-Carbon Grid', 65.0, 'Stage-2 Certified', 'high')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #082', 'Ganga Jal Aapurti Yojana', 'Bihar', 'Bihar - Ganga River (floodwater)', 'Drinking Water', 'Completed', 'Ganga River (floodwater)', '190 km pipeline from Hathidah intake; WTPs of 186.5 MLD (Gaya-Bodh Gaya) and 24 MLD (Rajgir Phase 1); storage reservoirs at Tetar Rajgir and Gaya', '7.5 lakh+ people', 'India''s first floodwater-to-drinking-water scheme serving Rajgir Gaya and Bodh Gaya', 'MEIL Drinking Water Division', 21500, 12300, 7400, 2100.0, 5800000, '26.0% Dedicated Grid', 48.0, 'Stage-2 Certified', 'high')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #094', 'Bhubaneswar Bulk Water Supply Scheme', 'Odisha', 'Odisha - Not specified', 'Bulk Water Supply', 'Completed (2018)', 'Not specified', '83 MLD intake well; 11 MLD MBR unit; multiple reservoirs; ~86 km MS/DI pipelines', 'Industrial hubs institutions (IIT Bhubaneswar NISER) and surrounding urban areas', 'Backbone bulk water network for industrial and municipal consumers in Bhubaneswar', 'MEIL Industrial Water', 8400, 7100, 3200, 850.0, 2400000, '31.2% Efficient Grid', 54.0, 'Audited & Verified', 'active')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #048', 'Uddanam Drinking Water Project', 'Andhra Pradesh (Srikakulam district)', 'Andhra Pradesh (Srikakulam district) - Vamsadhara River / Hiramandalam Reservoir', 'Drinking Water', 'Completed', 'Vamsadhara River / Hiramandalam Reservoir', '84 MLD water treatment plant; 1,200 km pipeline network; intake wells pumping stations overhead tanks', '~7 lakh people across 800+ villages', 'Addresses kidney-disease health crisis linked to contaminated groundwater', 'MEIL Drinking Water Division', 11200, 6800, 4100, 1250.0, 3600000, '27.5% Solar Assisted', 62.0, 'Stage-2 Certified', 'high')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #044', 'Nellore Drinking Water Project', 'Andhra Pradesh', 'Andhra Pradesh - Penna River (Sangam Barrage)', 'Drinking Water', 'Completed', 'Penna River (Sangam Barrage)', '122 MLD water treatment plant at Mahammadapuram; intake well raw-water pump house multi-zone distribution network', '~70000 families in Nellore city', 'EPC project strengthening Nellore''s long-term urban water security', 'MEIL Urban Infrastructure', 9600, 5900, 3100, 980.0, 2900000, '22.0% Regional Grid', 46.0, 'Stage-2 Certified', 'high')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #049', 'Pulivendula Drinking Water Project', 'Andhra Pradesh (YSR Kadapa district)', 'Andhra Pradesh (YSR Kadapa district) - Chitravathi Balancing Reservoir', 'Drinking Water', 'Completed', 'Chitravathi Balancing Reservoir', '65 MLD water treatment plant; pipeline and pumping/storage network', '299 villages across 7 mandals', 'Replaces dependence on vulnerable local water sources in rural Pulivendula', 'MEIL Rural Water Supply', 8200, 5100, 2400, 790.0, 2300000, '25.0% Solar Grid', 48.0, 'Audited & Verified', 'active')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #051', 'Dhone Drinking Water Project', 'Andhra Pradesh', 'Andhra Pradesh - Not specified', 'Drinking Water', 'Completed', 'Not specified', 'Upgraded intake treatment and distribution systems; new transmission pipelines', 'Dhone town', 'Urban water-supply improvement reducing dependence on stressed groundwater', 'MEIL Urban Water', 5600, 3400, 1800, 480.0, 1500000, '20.0% Standard Grid', 42.0, 'Audited & Verified', 'active')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #052', 'Proddatur Drinking Water Project', 'Andhra Pradesh', 'Andhra Pradesh - Not specified', 'Drinking Water (AMRUT scheme)', 'Completed', 'Not specified', '43 MLD water treatment plant; ~171 km of pipelines; new intake and transmission', 'Proddatur town', 'Reinforces bulk supply and distribution for reliable pressurised drinking water', 'MEIL Urban Infrastructure', 6100, 3800, 1900, 520.0, 1700000, '22.5% Grid Power', 45.0, 'Audited & Verified', 'active')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #063', 'Pillur III Drinking Water Supply Scheme', 'Tamil Nadu (Coimbatore)', 'Tamil Nadu (Coimbatore) - Bhavani River', 'Drinking Water', 'Completed', 'Bhavani River', 'New intake and raw-water pump house near Pillur; 90+ km transmission pipeline; 178.3 MLD water treatment plant', '1.6 million+ residents (city capacity raised to ~380 MLD)', 'Augments existing Pillur I & II supplies for expanded Coimbatore corporation limits', 'MEIL Water Infrastructure', 14800, 9600, 4800, 1350.0, 3900000, '30.0% Green Energy Mix', 57.0, 'Stage-2 Certified', 'high')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #099', 'Other Completed Schemes - Rajasthan Karnataka UP', 'Rajasthan, Karnataka, Uttar Pradesh', 'Rajasthan, Karnataka, Uttar Pradesh - Various local sources', 'Drinking Water', 'Completed', 'Various local sources', 'Rajasthan: Chambal-Bhilwara, Kotri Tehsil, Asind Tehsil, Jetpur-Pali, Shahpura Tehsil, Dudu-Todaraisingh. Karnataka: Hanur, Adichunchanagiri, Pavagada, TG Halli. UP: Gothura, Dhuha Talar', 'Multiple multi-village and urban systems', 'Reduced water-borne disease risk and supported urban growth industry and tourism', 'MEIL Inter-State Water Programs', 28500, 17200, 8600, 2900.0, 7400000, '26.5% Regional Mix', 50.0, 'Audited & Verified', 'active')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #121', 'Uttar Pradesh Ongoing Water Schemes', 'Uttar Pradesh', 'Uttar Pradesh - Not specified', 'Drinking Water', 'Ongoing', 'Not specified', 'Basti Rural WSS Phase 2; Ayodhya Rural WSS Phase 3; Agra Water Supply Scheme (2 segments); Unnao Cluster Phase 4 (2 segments)', 'Rural and peri-urban habitations', 'Expanding multi-village and urban drinking water networks', 'MEIL Water & Infra (North)', 38400, 18900, 12400, 3400.0, 8200000, '21.0% Grid Average', 46.5, 'Stage-2 In Progress', 'due')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #124', 'Tamil Nadu Ongoing Water Schemes', 'Tamil Nadu', 'Tamil Nadu - Not specified', 'Drinking Water', 'Ongoing', 'Not specified', 'Virudhunagar Combined Water Supply Scheme (3 segments); Tirunelveli CWSS', 'Growing municipal and rural clusters', 'Improving raw water sourcing treatment and long-distance transmission', 'MEIL Water & Infra (South)', 22100, 13400, 7800, 2150.0, 5100000, '28.0% Wind & Solar Mix', 52.0, 'Stage-2 In Progress', 'due')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #127', 'Telangana Ongoing Water Schemes', 'Telangana', 'Telangana - Not specified', 'Drinking Water', 'Ongoing', 'Not specified', 'Gajwel Extension Project; Sunkishala Drinking Water Project; AMRUT scheme works across 42 Urban Local Bodies', '42 urban local bodies plus Gajwel/Sunkishala areas', 'Upgrading treatment storage and distribution for continued urbanisation', 'MEIL Urban Infrastructure', 31200, 24500, 11200, 3100.0, 7600000, '33.5% Clean Energy Mix', 58.0, 'Stage-2 In Progress', 'due')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #130', 'Odisha Ongoing Water Schemes', 'Odisha', 'Odisha - Not specified', 'Drinking Water', 'Ongoing', 'Not specified', '21 rural water supply schemes incl. Bhadrak, Sundargarh, Keonjhar, Jajpur, Cuttack, Sambalpur, Kalahandi, Dhenkanal, Sonepur, Gajapati', 'Dispersed villages across all districts of Odisha', 'Extends organised treated water supply beyond seasonal/quality-affected local sources', 'MEIL Rural Water Division', 26800, 14200, 9100, 2750.0, 6400000, '24.0% Regional Grid', 49.0, 'Stage-2 In Progress', 'due')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #133', 'Madhya Pradesh Ongoing Water Schemes', 'Madhya Pradesh', 'Madhya Pradesh - River and reservoir sources', 'Drinking Water', 'Ongoing', 'River and reservoir sources', 'Alirajpur Multi-Village Water Supply Scheme; Mahi Multi-Village Water Supply Scheme', 'Drought-prone rural belts', 'Regional transmission and village-level distribution networks', 'MEIL Water & Irrigation', 24500, 12800, 8200, 2300.0, 5800000, '22.5% Grid Mix', 47.0, 'Stage-2 In Progress', 'due')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #136', 'Maharashtra Ongoing Water Schemes', 'Maharashtra', 'Maharashtra - Not specified', 'Drinking Water', 'Ongoing', 'Not specified', 'Latur Water Supply Scheme; augmentation works in Kolhapur Nanded and Aurangabad-Silod', 'Fast-growing towns', 'New/expanded intakes treatment capacity and transmission pipelines', 'MEIL Urban Water', 21900, 15400, 7600, 2200.0, 5300000, '27.0% Hydro/Solar Mix', 53.0, 'Stage-2 In Progress', 'due')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;

INSERT INTO public.projects (site_code, name, state_region, location, category, status, water_source, key_infrastructure, scale_served, summary, subsidiary_bu, scope1_tco2e, scope2_tco2e, scope3_tco2e, turnover_cr, safe_man_hours, energy_mix, water_recycled_pct, audit_status, status_category)
VALUES ('Site #139', 'Andhra Pradesh & Karnataka Ongoing Water Schemes', 'Andhra Pradesh and Karnataka', 'Andhra Pradesh and Karnataka - Not specified', 'Drinking Water', 'Ongoing', 'Not specified', 'West & East Godavari water supply schemes (AP); Yadgir Multi-Village WSS and Sathegala Drinking Water Project with ~11.2 km tunnel (Karnataka)', 'Multiple habitations across both states', 'Long-distance conveyance of treated river water including one of the region''s longest urban water-supply tunnels', 'MEIL Hydro & Tunneling', 34500, 22100, 11900, 3600.0, 8900000, '31.0% High-Efficiency Mix', 54.0, 'Stage-2 In Progress', 'due')
ON CONFLICT (site_code) DO UPDATE SET
  name = EXCLUDED.name,
  state_region = EXCLUDED.state_region,
  category = EXCLUDED.category,
  water_source = EXCLUDED.water_source,
  key_infrastructure = EXCLUDED.key_infrastructure,
  scale_served = EXCLUDED.scale_served,
  summary = EXCLUDED.summary;
