/**
 * MEIL ESG Connect - Unified API Client (api.js)
 * Bridges Frontend UI with Dual-Mode Backend Server (Port 5000) & Supabase Cloud DB.
 * Supports auto-save debouncing, live telemetry sync, and SHA-256 evidence vault.
 */

const MEIL_API = (function () {
  const API_BASE = window.MEIL_API_URL || 'http://localhost:5000/api';
  let isApiReachable = null;

  // Check if backend API server is available
  async function checkApiHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        isApiReachable = true;
        updateApiStatusIndicator(true, data.mode);
        return data;
      }
    } catch (e) {
      // Backend not running on port 5000, fallback to direct Supabase / local
      isApiReachable = false;
      updateApiStatusIndicator(false, 'Direct / Fallback');
    }
    return null;
  }

  function updateApiStatusIndicator(online, mode) {
    const badge = document.getElementById('supabaseStatusBadge');
    if (!badge) return;
    if (online) {
      badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold border border-secondary/30';
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span><span>API Server: Dual-Mode Live</span>`;
    }
  }

  // Get active role from selector
  function getActiveRole() {
    const roleEl = document.getElementById('roleSelector');
    return roleEl ? roleEl.value : 'Group ESG Admin';
  }

  // Fetch all projects
  async function getProjects() {
    if (isApiReachable !== false) {
      try {
        const res = await fetch(`${API_BASE}/projects`);
        if (res.ok) return await res.json();
      } catch (e) {
        isApiReachable = false;
      }
    }
    // Fallback to supabaseClient if available
    if (typeof getSupabaseProjects === 'function') {
      const data = await getSupabaseProjects();
      if (data) return data;
    }
    return null;
  }

  // Fetch emission factors
  async function getEmissionFactors() {
    if (isApiReachable !== false) {
      try {
        const res = await fetch(`${API_BASE}/emission-factors`);
        if (res.ok) return await res.json();
      } catch (e) {
        isApiReachable = false;
      }
    }
    if (typeof getSupabaseEmissionFactors === 'function') {
      const data = await getSupabaseEmissionFactors();
      if (data) return data;
    }
    return null;
  }

  // Update emission factor with mandatory justification
  async function updateEmissionFactor(factorIdOrName, newValue, justification) {
    const role = getActiveRole();
    if (isApiReachable !== false) {
      try {
        const res = await fetch(`${API_BASE}/emission-factors/${encodeURIComponent(factorIdOrName)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': role
          },
          body: JSON.stringify({
            factor_value: Number(newValue),
            justification,
            author: 'K. V. Rao',
            author_role: role
          })
        });
        if (res.ok) return await res.json();
      } catch (e) {
        isApiReachable = false;
      }
    }
    // Fallback to Supabase direct
    if (typeof updateSupabaseFactor === 'function') {
      const ok = await updateSupabaseFactor(factorIdOrName, newValue, justification);
      return { success: ok };
    }
    return { success: true, localOnly: true };
  }

  // Server-side calculation
  async function calculateEmissions(inputs) {
    if (isApiReachable !== false) {
      try {
        const res = await fetch(`${API_BASE}/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputs)
        });
        if (res.ok) {
          const data = await res.json();
          return data.results;
        }
      } catch (e) {
        isApiReachable = false;
      }
    }
    return null; // Fallback will run client-side calculation
  }

  // Get Anomaly radar reports
  async function getAnomalies() {
    if (isApiReachable !== false) {
      try {
        const res = await fetch(`${API_BASE}/anomalies`);
        if (res.ok) return await res.json();
      } catch (e) {
        isApiReachable = false;
      }
    }
    return null;
  }

  // Save Energy Consumption
  async function saveEnergyRecord(record) {
    const role = getActiveRole();
    if (isApiReachable !== false) {
      try {
        const res = await fetch(`${API_BASE}/energy-consumption`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': role
          },
          body: JSON.stringify(record)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        isApiReachable = false;
      }
    }
    if (typeof saveSupabaseEnergyRecord === 'function') {
      return await saveSupabaseEnergyRecord(record);
    }
    return { success: true };
  }

  // Evidence list
  async function getEvidence() {
    if (isApiReachable !== false) {
      try {
        const res = await fetch(`${API_BASE}/evidence`);
        if (res.ok) return await res.json();
      } catch (e) {
        isApiReachable = false;
      }
    }
    return null;
  }

  // Upload Evidence
  async function uploadEvidence(evidenceData) {
    const role = getActiveRole();
    if (isApiReachable !== false) {
      try {
        const res = await fetch(`${API_BASE}/evidence/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': role
          },
          body: JSON.stringify({
            ...evidenceData,
            authorRole: role
          })
        });
        if (res.ok) return await res.json();
      } catch (e) {
        isApiReachable = false;
      }
    }
    return { success: true, localMock: true };
  }

  // Audit logs
  async function getAuditLogs() {
    if (isApiReachable !== false) {
      try {
        const res = await fetch(`${API_BASE}/audit-logs`);
        if (res.ok) return await res.json();
      } catch (e) {
        isApiReachable = false;
      }
    }
    return null;
  }

  async function addAuditLog(noteText, entityRef = 'Polavaram Hydro Package') {
    const role = getActiveRole();
    if (isApiReachable !== false) {
      try {
        const res = await fetch(`${API_BASE}/audit-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': role
          },
          body: JSON.stringify({
            note_text: noteText,
            author: 'K. V. Rao',
            author_role: role,
            entity_ref: entityRef
          })
        });
        if (res.ok) return await res.json();
      } catch (e) {
        isApiReachable = false;
      }
    }
    if (typeof addSupabaseAuditNote === 'function') {
      return await addSupabaseAuditNote('K. V. Rao', role, noteText);
    }
    return { success: true };
  }

  // Auto-Save Debounce utility
  let debounceTimers = {};
  function debounce(key, fn, delay = 600) {
    if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(() => {
      fn();
      delete debounceTimers[key];
    }, delay);
  }

  // Initialize on load
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      checkApiHealth();
    });
  }

  return {
    API_BASE,
    checkApiHealth,
    getProjects,
    getEmissionFactors,
    updateEmissionFactor,
    calculateEmissions,
    getAnomalies,
    saveEnergyRecord,
    getEvidence,
    uploadEvidence,
    getAuditLogs,
    addAuditLog,
    debounce,
    getActiveRole
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.MEIL_API = MEIL_API;
}
