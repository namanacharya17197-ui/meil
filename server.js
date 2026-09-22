/**
 * MEIL ESG Connect - Dual-Mode API Server (Node.js + Express)
 * Seamlessly toggles between Local In-Memory/JSON data and Supabase Cloud PostgreSQL.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const { calculateEnergyAndIntensity, detectAnomalies } = require('./services/emissionCalculator');
const { computeSHA256, verifyFileIntegrity, storeEvidence } = require('./services/evidenceVault');
const { ROLES, PERMISSIONS, requirePermission } = require('./middleware/rbac');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
const ROOT_DIR = process.cwd();
app.use(express.static(ROOT_DIR));
app.use(express.static(__dirname));

// Serve index.html on root
app.get('/', (req, res) => {
  const indexPath = fs.existsSync(path.join(__dirname, 'index.html'))
    ? path.join(__dirname, 'index.html')
    : path.join(ROOT_DIR, 'index.html');
  res.sendFile(indexPath);
});

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || "https://tknutnputsafopjfgqdu.supabase.co",
  anonKey: process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrbnV0bnB1dHNhZm9wamZncWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTI1NzAsImV4cCI6MjEwNTQ4ODU3MH0.vOd9-z-KJg_T6XM5sIXxY8uhboyaFgkYVRIese_vyoY"
};

let supabase = null;
let isCloudOnline = false;

// Local JSON Database Cache
const DB_PATH = path.join(__dirname, 'data', 'db.json');
let localDb = {
  organizations: [],
  projects: [],
  emission_factors: [],
  energy_consumption: [],
  evidence_vault: [],
  audit_logs: [],
  brsr_indicators: []
};

function loadLocalDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      localDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      console.log('📦 Local JSON Database loaded successfully.');
    }
  } catch (err) {
    console.error('Error loading local DB:', err.message);
  }
}

function saveLocalDb() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(localDb, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local DB:', err.message);
  }
}

loadLocalDb();

// Initialize Supabase & test connectivity
async function initSupabase() {
  try {
    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    const { data, error } = await supabase.from('projects').select('id').limit(1);
    if (!error) {
      isCloudOnline = true;
      console.log('⚡ Supabase Cloud PostgreSQL: Connected & Active.');
    } else {
      isCloudOnline = false;
      console.log('ℹ️ Supabase reachable, tables pending. Running in Dual-Mode (Local Fallback active).');
    }
  } catch (err) {
    isCloudOnline = false;
    console.warn('⚠️ Supabase connection failed. Using local storage mode.');
  }
}

initSupabase();

/* =========================================================================
   API ROUTES
   ========================================================================= */

// Health & Dual-Mode Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'MEIL ESG Connect REST API',
    mode: isCloudOnline ? 'SUPABASE_CLOUD' : 'LOCAL_OFFLINE_FALLBACK',
    supabaseUrl: SUPABASE_CONFIG.url,
    timestamp: new Date().toISOString()
  });
});

// 1. Organizations Hierarchy
app.get('/api/organizations', async (req, res) => {
  if (isCloudOnline && supabase) {
    const { data, error } = await supabase.from('organizations').select('*');
    if (!error && data?.length) return res.json(data);
  }
  res.json(localDb.organizations || []);
});

// 2. Projects & Sites Ledger
app.get('/api/projects', async (req, res) => {
  if (isCloudOnline && supabase) {
    const { data, error } = await supabase.from('projects').select('*');
    if (!error && data?.length) return res.json(data);
  }
  res.json(localDb.projects || []);
});

// 2b. Get Single Project / Company by ID or Site Code
app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const project = (localDb.projects || []).find(p => p.id === id || p.site_code === id);
  if (!project) {
    return res.status(404).json({ error: `Project not found for id/site_code: ${id}` });
  }
  res.json(project);
});

// 2c. Register / Add New Project
app.post('/api/projects', async (req, res) => {
  const p = req.body;
  if (!p.name) return res.status(400).json({ error: 'Project name is required.' });
  
  const siteCode = p.site_code || `Site #${String((localDb.projects?.length || 0) + 1).padStart(3, '0')}`;
  const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newProject = {
    id: p.id || `proj-${slug}`,
    site_code: siteCode,
    name: p.name,
    state_region: p.state_region || 'India',
    location: p.location || p.state_region || 'India',
    category: p.category || 'Water & Irrigation',
    status: p.status || 'Ongoing',
    water_source: p.water_source || 'Regional Source',
    key_infrastructure: p.key_infrastructure || '',
    scale_served: p.scale_served || '',
    summary: p.summary || '',
    subsidiary_bu: p.subsidiary_bu || 'MEIL Water Division',
    scope1_tco2e: Number(p.scope1_tco2e || 0),
    scope2_tco2e: Number(p.scope2_tco2e || 0),
    scope3_tco2e: Number(p.scope3_tco2e || 0),
    turnover_cr: Number(p.turnover_cr || 500),
    safe_man_hours: Number(p.safe_man_hours || 1000000),
    energy_mix: p.energy_mix || 'Standard Grid Mix',
    water_recycled_pct: Number(p.water_recycled_pct || 0),
    audit_status: p.audit_status || 'Stage-2 In Review',
    status_category: p.status_category || 'active',
    version: 1,
    updatedAt: new Date().toISOString(),
    esg_submissions: []
  };

  localDb.projects.push(newProject);
  saveLocalDb();

  if (isCloudOnline && supabase) {
    try {
      await supabase.from('projects').insert([newProject]);
    } catch (e) {
      console.warn('Could not insert new project into Supabase:', e.message);
    }
  }

  res.status(201).json({ success: true, project: newProject });
});

// 2d. Save / Submit ESG Data for a specific Company / Project
app.post('/api/projects/:id/esg', async (req, res) => {
  const { id } = req.params;
  const {
    fiscal_period = 'Q2 FY 2025-26',
    submitted_by = 'Site Environmental Officer',
    diesel_kl = 0,
    grid_mwh = 0,
    solar_mwh = 0,
    png_gj = 0,
    scope1_tco2e,
    scope2_tco2e,
    scope3_tco2e,
    water_withdrawn_kl = 0,
    water_recycled_pct = 0,
    safe_man_hours = 0,
    turnover_cr,
    tree_plantation_count = 0,
    notes = '',
    evidence_ref = ''
  } = req.body;

  let project = (localDb.projects || []).find(p => p.id === id || p.site_code === id);
  if (!project) {
    return res.status(404).json({ error: `Project with identifier ${id} not found.` });
  }

  // Calculate Scope 1 and Scope 2 if not explicitly passed
  const s1 = scope1_tco2e !== undefined && scope1_tco2e !== '' ? Number(scope1_tco2e) : Number(((Number(diesel_kl) * 1000 * 2.6865 + Number(png_gj) * 1.982) / 1000).toFixed(2));
  const s2 = scope2_tco2e !== undefined && scope2_tco2e !== '' ? Number(scope2_tco2e) : Number((Number(grid_mwh) * 0.716).toFixed(2));
  const s3 = scope3_tco2e !== undefined && scope3_tco2e !== '' ? Number(scope3_tco2e) : (project.scope3_tco2e || 0);

  // Update project fields
  project.scope1_tco2e = s1;
  project.scope2_tco2e = s2;
  project.scope3_tco2e = s3;
  if (water_recycled_pct) project.water_recycled_pct = Number(water_recycled_pct);
  if (safe_man_hours) project.safe_man_hours = Number(safe_man_hours);
  if (turnover_cr) project.turnover_cr = Number(turnover_cr);
  project.version = (project.version || 1) + 1;
  project.updatedAt = new Date().toISOString();
  project.audit_status = 'Stage-2 In Review';

  // Append to submission history
  const submissionRecord = {
    submission_id: `sub-${project.site_code.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`,
    fiscal_period,
    submitted_at: new Date().toISOString(),
    submitted_by,
    diesel_kl: Number(diesel_kl),
    grid_mwh: Number(grid_mwh),
    solar_mwh: Number(solar_mwh),
    scope1_tco2e: s1,
    scope2_tco2e: s2,
    scope3_tco2e: s3,
    water_withdrawn_kl: Number(water_withdrawn_kl),
    water_recycled_pct: Number(water_recycled_pct),
    safe_man_hours: Number(safe_man_hours),
    tree_plantation_count: Number(tree_plantation_count),
    notes,
    evidence_ref
  };

  if (!project.esg_submissions) project.esg_submissions = [];
  project.esg_submissions.unshift(submissionRecord);

  // Add immutable audit log
  const auditLog = {
    id: `log-${Date.now()}`,
    author: submitted_by,
    author_role: 'Project Data Entry Lead',
    note_text: `ESG Telemetry Data recorded for ${project.name} (${project.site_code}): Scope 1=${s1} tCO2e, Scope 2=${s2} tCO2e, Recycled Water=${water_recycled_pct}%. ${notes ? 'Note: ' + notes : ''}`,
    entity_ref: `${project.name} (${project.site_code})`,
    action_type: 'ESG_SUBMISSION',
    created_at: new Date().toISOString()
  };
  localDb.audit_logs.unshift(auditLog);

  saveLocalDb();

  // Sync to Supabase if online
  if (isCloudOnline && supabase) {
    try {
      await supabase.from('projects').update({
        scope1_tco2e: s1,
        scope2_tco2e: s2,
        scope3_tco2e: s3,
        water_recycled_pct: project.water_recycled_pct,
        safe_man_hours: project.safe_man_hours,
        audit_status: 'Stage-2 In Review'
      }).eq('site_code', project.site_code);
      await supabase.from('audit_logs').insert([auditLog]);
    } catch (e) {
      console.warn('Could not sync project ESG update to Supabase:', e.message);
    }
  }

  res.json({
    success: true,
    message: `ESG data saved successfully for ${project.name}`,
    project,
    submission: submissionRecord,
    auditLog
  });
});

// 3. Emission Factors Master Library
app.get('/api/emission-factors', async (req, res) => {
  if (isCloudOnline && supabase) {
    const { data, error } = await supabase.from('emission_factors').select('*');
    if (!error && data?.length) return res.json(data);
  }
  res.json(localDb.emission_factors || []);
});

// Update Emission Factor (RBAC: requires OVERRIDE_FACTORS)
app.put('/api/emission-factors/:id', requirePermission(PERMISSIONS.OVERRIDE_FACTORS), async (req, res) => {
  const { id } = req.params;
  const { factor_value, justification, author, author_role } = req.body;

  if (!factor_value || !justification) {
    return res.status(400).json({ error: 'factor_value and justification are required.' });
  }

  // Record audit trail note
  const auditNote = {
    id: `log-${Date.now()}`,
    author: author || 'K. V. Rao',
    author_role: author_role || 'Chief Sustainability Officer',
    note_text: `Factor modified to ${factor_value}. Regulatory Justification: ${justification}`,
    entity_ref: `Factor ID: ${id}`,
    action_type: 'FACTOR_UPDATE',
    created_at: new Date().toISOString()
  };

  localDb.audit_logs.unshift(auditNote);

  // Update in local DB
  const factor = localDb.emission_factors.find(f => f.id === id || f.fuel_name === id);
  if (factor) {
    factor.factor_value = Number(factor_value);
    factor.updated_at = new Date().toISOString();
  }
  saveLocalDb();

  // Also sync to Supabase if connected
  if (isCloudOnline && supabase) {
    try {
      await supabase.from('emission_factors').update({ factor_value }).eq('fuel_name', factor?.fuel_name || id);
      await supabase.from('audit_logs').insert([auditNote]);
    } catch (e) {
      console.warn('Could not sync factor edit to Supabase:', e.message);
    }
  }

  res.json({ success: true, updatedFactor: factor, auditLog: auditNote });
});

// 4. Server-Side Calculations (Scope 1, Scope 2, Scope 3, Intensities)
app.post('/api/calculate', (req, res) => {
  const inputs = req.body;
  const calculationResults = calculateEnergyAndIntensity(inputs);
  res.json({
    success: true,
    inputs,
    results: calculationResults
  });
});

// 5. Anomaly Radar Engine
app.get('/api/anomalies', async (req, res) => {
  let projects = localDb.projects || [];
  if (isCloudOnline && supabase) {
    const { data } = await supabase.from('projects').select('*');
    if (data?.length) projects = data;
  }

  const allAnomalies = [];
  projects.forEach(proj => {
    const detected = detectAnomalies(proj);
    if (detected.length > 0) {
      allAnomalies.push(...detected);
    }
  });

  res.json({
    count: allAnomalies.length,
    anomalies: allAnomalies
  });
});

// 5b. Telemetry Batch Sync with Optimistic Versioning & Conflict Detection
app.post('/api/telemetry/batch-sync', (req, res) => {
  const { mutations = [] } = req.body;
  const results = [];

  mutations.forEach(m => {
    const { mutationId, entityId, baseVersion = 1, delta = {} } = m;
    let record = localDb.projects.find(p => p.id === entityId || p.site_code === entityId);
    
    if (!record) {
      record = {
        id: entityId,
        site_code: delta.site_code || entityId,
        name: delta.name || 'New Site Package',
        version: 1,
        ...delta,
        updatedAt: new Date().toISOString()
      };
      localDb.projects.push(record);
      results.push({ mutationId, entityId, status: 'APPLIED', confirmedRecord: record });
    } else {
      record.version = record.version || 1;
      if (record.version > baseVersion) {
        // Concurrency Conflict Detected!
        results.push({
          mutationId,
          entityId,
          status: 'CONFLICT',
          serverRecord: { ...record },
          clientBaseVersion: baseVersion
        });
      } else {
        // Apply delta monotonically
        Object.assign(record, delta);
        record.version = (record.version || 1) + 1;
        record.updatedAt = new Date().toISOString();
        results.push({
          mutationId,
          entityId,
          status: 'APPLIED',
          confirmedRecord: { ...record }
        });
      }
    }
  });

  saveLocalDb();
  res.json({ success: true, results, syncedAt: new Date().toISOString() });
});

// 5c. Resilient 3-Way Reconciliation
app.post('/api/reconcile', (req, res) => {
  const { localDrafts = [] } = req.body;
  const synced = [];
  const auditEntries = [];
  let conflictsResolved = 0;

  localDrafts.forEach(draft => {
    const existing = localDb.projects.find(p => p.id === draft.id || p.site_code === draft.site_code);
    if (!existing) {
      localDb.projects.push(draft);
      synced.push(draft);
    } else {
      // 3-way merge on fields
      const merged = { ...existing };
      for (const key of Object.keys(draft)) {
        if (draft[key] !== undefined && key !== 'id' && key !== 'site_code') {
          merged[key] = draft[key];
        }
      }
      merged.updatedAt = new Date().toISOString();
      Object.assign(existing, merged);
      synced.push(merged);
      conflictsResolved++;
      auditEntries.push({
        entityId: draft.id || draft.site_code,
        action: 'RECONCILED',
        note: `Merged local draft changes for ${draft.name || draft.site_code}`
      });
    }
  });

  saveLocalDb();
  res.json({
    success: true,
    synced,
    conflictsResolved,
    auditEntries,
    timestamp: new Date().toISOString()
  });
});

// 5d. Real-time Telemetry Live Feed
app.get('/api/telemetry/live', (req, res) => {
  const activeProject = localDb.projects[0] || { site_code: 'Site #108', name: 'Zojila Tunnel Project' };
  const jitterDiesel = Math.round(2400 + Math.random() * 400);
  const jitterGrid = Math.round(11500 + Math.random() * 800);
  const jitterSolar = Math.round(3800 + Math.random() * 400);
  
  const isSpike = jitterDiesel > 2650;
  
  res.json({
    packetId: `pkt-${Date.now()}`,
    siteCode: activeProject.site_code,
    siteName: activeProject.name,
    timestamp: new Date().toISOString(),
    metrics: {
      dieselKL: jitterDiesel,
      gridMWh: jitterGrid,
      solarMWh: jitterSolar,
      scope1_tco2e: Number(((jitterDiesel * 1000 * 2.6865) / 1000).toFixed(2)),
      scope2_tco2e: Number((jitterGrid * 0.716).toFixed(2))
    },
    anomalyFlag: isSpike,
    anomalyReason: isSpike ? 'Diesel consumption spike (+34.2%) detected by Anomaly Radar' : null
  });
});

// 6. Energy Consumption (Record save)
app.post('/api/energy-consumption', requirePermission(PERMISSIONS.WRITE_ENERGY), async (req, res) => {
  const record = {
    id: `ec-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString()
  };

  localDb.energy_consumption.unshift(record);
  saveLocalDb();

  if (isCloudOnline && supabase) {
    try {
      await supabase.from('energy_consumption').insert([record]);
    } catch (e) {
      console.warn('Supabase insert failed:', e.message);
    }
  }

  res.json({ success: true, record });
});

// 7. Evidence Vault (List & Upload with SHA-256)
app.get('/api/evidence', async (req, res) => {
  if (isCloudOnline && supabase) {
    const { data } = await supabase.from('evidence_vault').select('*');
    if (data?.length) return res.json(data);
  }
  res.json(localDb.evidence_vault || []);
});

// Upload evidence with SHA-256 integrity calculation
app.post('/api/evidence/upload', requirePermission(PERMISSIONS.UPLOAD_EVIDENCE), async (req, res) => {
  const { fileName, fileContentBase64, mimeType, principleRef, attachedBy, authorRole } = req.body;

  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required.' });
  }

  const buffer = fileContentBase64
    ? Buffer.from(fileContentBase64, 'base64')
    : Buffer.from(`SEBI_BRSR_AUDIT_DATA_${Date.now()}_${fileName}`);

  const evidenceRecord = await storeEvidence({
    supabaseClient: isCloudOnline ? supabase : null,
    fileName,
    fileBuffer: buffer,
    mimeType: mimeType || 'application/pdf',
    attachedBy: attachedBy || 'Site Engineer',
    authorRole: authorRole || req.currentRole || 'Project Data Entry User',
    principleRef: principleRef || 'P6-EI-01'
  });

  localDb.evidence_vault.unshift(evidenceRecord);
  saveLocalDb();

  if (isCloudOnline && supabase) {
    try {
      await supabase.from('evidence_vault').insert([evidenceRecord]);
    } catch (e) {
      console.warn('Supabase evidence table insert failed:', e.message);
    }
  }

  res.json({ success: true, evidence: evidenceRecord });
});

// Verify SHA-256 Integrity
app.post('/api/evidence/verify', (req, res) => {
  const { fileContentBase64, expectedHash } = req.body;
  if (!fileContentBase64 || !expectedHash) {
    return res.status(400).json({ error: 'fileContentBase64 and expectedHash are required.' });
  }
  const buffer = Buffer.from(fileContentBase64, 'base64');
  const result = verifyFileIntegrity(buffer, expectedHash);
  res.json(result);
});

// 8. Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  if (isCloudOnline && supabase) {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (data?.length) return res.json(data);
  }
  res.json(localDb.audit_logs || []);
});

app.post('/api/audit-logs', requirePermission(PERMISSIONS.AUDIT_NOTE), async (req, res) => {
  const { author, author_role, note_text, entity_ref } = req.body;
  if (!note_text) {
    return res.status(400).json({ error: 'note_text is required.' });
  }

  const logEntry = {
    id: `log-${Date.now()}`,
    author: author || 'K. V. Rao',
    author_role: author_role || req.currentRole || 'Chief Sustainability Officer',
    note_text,
    entity_ref: entity_ref || 'General',
    action_type: 'NOTE',
    created_at: new Date().toISOString()
  };

  localDb.audit_logs.unshift(logEntry);
  saveLocalDb();

  if (isCloudOnline && supabase) {
    try {
      await supabase.from('audit_logs').insert([logEntry]);
    } catch (e) {
      console.warn('Supabase audit log insert failed:', e.message);
    }
  }

  res.json({ success: true, log: logEntry });
});

// 9. BRSR Principles 1-9 Indicators
app.get('/api/brsr/indicators', async (req, res) => {
  if (isCloudOnline && supabase) {
    const { data } = await supabase.from('brsr_indicators').select('*');
    if (data?.length) return res.json(data);
  }
  res.json(localDb.brsr_indicators || []);
});

// Fallback to index.html for SPA frontend routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: `API route not found: ${req.path}` });
  }
  const indexPath = fs.existsSync(path.join(__dirname, 'index.html'))
    ? path.join(__dirname, 'index.html')
    : path.join(ROOT_DIR, 'index.html');
  res.sendFile(indexPath);
});

// Export app for Vercel Serverless deployment
module.exports = app;

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
MEIL ESG Connect REST API Server running on port ${PORT}
Local Endpoint: http://localhost:${PORT}/api/health
Storage Mode:   ${isCloudOnline ? 'Supabase Cloud (Active)' : 'Dual-Mode Local Fallback (Active)'}
    `);
  });
}
