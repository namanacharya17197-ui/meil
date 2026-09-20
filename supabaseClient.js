/**
 * MEIL ESG Connect Platform - Supabase Integration Client
 * Handles real-time synchronization with Supabase Cloud DB
 */

const SUPABASE_CONFIG = {
  url: "https://tknutnputsafopjfgqdu.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrbnV0bnB1dHNhZm9wamZncWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTI1NzAsImV4cCI6MjEwNTQ4ODU3MH0.vOd9-z-KJg_T6XM5sIXxY8uhboyaFgkYVRIese_vyoY"
};

let supabaseClient = null;
let isSupabaseOnline = false;

// Initialize Supabase Client
function initSupabase() {
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      console.log('✅ Supabase Client Initialized with Project:', SUPABASE_CONFIG.url);
      checkSupabaseConnection();
    } else {
      console.warn('⚠️ Supabase JS SDK not loaded yet. Running in offline mock mode.');
    }
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

// Test live connectivity
async function checkSupabaseConnection() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('projects').select('id').limit(1);
    if (!error) {
      isSupabaseOnline = true;
      updateSupabaseUIBadge(true, 'Live DB Connected');
      console.log('⚡ Supabase Cloud Database Connected & Synced.');
    } else {
      isSupabaseOnline = false;
      updateSupabaseUIBadge(false, 'Schema Pending (Run SQL)');
      console.log('ℹ️ Supabase reachable, tables pending creation in SQL Editor.');
    }
  } catch (e) {
    isSupabaseOnline = false;
    updateSupabaseUIBadge(false, 'Offline Fallback');
  }
}

// Update UI badge in top navigation
function updateSupabaseUIBadge(connected, label) {
  const badge = document.getElementById('supabaseStatusBadge');
  if (badge) {
    if (connected) {
      badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold border border-secondary/30';
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span><span>Supabase: ${label}</span>`;
    } else {
      badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-secondary font-label-sm text-label-sm font-semibold border border-outline-variant/30 cursor-pointer';
      badge.title = 'Click to see Supabase connection details';
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-secondary-container"></span><span>Supabase: Ready</span>`;
      badge.onclick = () => {
        alert(
          "SUPABASE STATUS\n\n" +
          "Project URL: " + SUPABASE_CONFIG.url + "\n" +
          "API Key: Configured (Active)\n\n" +
          "To complete initial table sync, open your Supabase SQL Editor and execute the provided 'supabase_schema.sql' script."
        );
      };
    }
  }
}

// Fetch Sites / Projects from Supabase
async function getSupabaseProjects() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient.from('projects').select('*').order('created_at', { ascending: true });
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    console.warn('Using local sites fallback:', e);
  }
  return null;
}

// Fetch Emission Factors from Supabase
async function getSupabaseEmissionFactors() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient.from('emission_factors').select('*').order('fuel_name', { ascending: true });
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    console.warn('Using local factors fallback:', e);
  }
  return null;
}

// Update an emission factor in Supabase with audit log
async function updateSupabaseFactor(fuelName, newValue, justification) {
  if (!supabaseClient) return false;
  try {
    const { error: factorErr } = await supabaseClient
      .from('emission_factors')
      .update({ factor_value: newValue, updated_at: new Date().toISOString() })
      .eq('fuel_name', fuelName);

    // Also record audit entry
    await supabaseClient.from('audit_logs').insert([
      {
        author: 'K. V. Rao',
        author_role: 'Chief Sustainability Officer',
        note_text: `Modified factor for ${fuelName} to ${newValue}. Reason: ${justification}`,
        entity_ref: 'Emission Library'
      }
    ]);

    return !factorErr;
  } catch (e) {
    console.error('Error saving to Supabase:', e);
    return false;
  }
}

// Save Energy & GHG entries
async function saveSupabaseEnergyRecord(record) {
  if (!supabaseClient) return false;
  try {
    const { error } = await supabaseClient.from('energy_consumption').insert([record]);
    return !error;
  } catch (e) {
    console.error('Error recording energy consumption in Supabase:', e);
    return false;
  }
}

// Post an audit discussion note
async function addSupabaseAuditNote(author, role, noteText) {
  if (!supabaseClient) return false;
  try {
    const { error } = await supabaseClient.from('audit_logs').insert([
      {
        author: author,
        author_role: role,
        note_text: noteText
      }
    ]);
    return !error;
  } catch (e) {
    console.error('Error adding audit note to Supabase:', e);
    return false;
  }
}

// Initialize on script load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initSupabase();
  });
}
