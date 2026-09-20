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
