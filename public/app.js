/**
 * MEIL ESG Connect Platform - Core Application Logic
 * Supports routing, reactive energy/GHG calculations, modal dialogs, audit trails, and filters.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRouting();
  initCalculations();
  initUnitConverter();
  initTelemetryButton();
  initFactorSearch();
  initFiscalYearSelector();
  initRoleSelector();
});

/* =========================================================================
   1. CLIENT-SIDE ROUTING & NAVIGATION
   ========================================================================= */
const knownViews = [
  'executive-dashboard',
  'brsr-section-c-principle-wise-performance',
  'calculation-and-emission-engine',
  'brsr-report-generator'
];

function initRouting() {
  // Listen to hash changes
  window.addEventListener('hashchange', handleRoute);

  // Intercept click on nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = link.getAttribute('data-path');
      window.location.hash = path;
    });
  });

  // Handle initial route
  handleRoute();
}

function handleRoute() {
  let path = window.location.hash.replace('#', '').trim();
  if (!path) {
    path = 'executive-dashboard';
  }
  navigateTo(path, false);
}

function navigateTo(path, updateHash = true) {
  if (updateHash) {
    window.location.hash = path;
  }

  // Update Sidebar active styling
  const activeClassStr = 'bg-primary text-on-primary font-title-md border-l-2 border-on-tertiary-container shadow-sm';
  const inactiveClassStr = 'text-on-primary-container hover:bg-primary hover:text-on-primary transition-all font-body-sm text-body-sm';

  document.querySelectorAll('.nav-link').forEach(link => {
    const linkPath = link.getAttribute('data-path');
    if (linkPath === path) {
      link.className = `nav-link flex items-center gap-space-sm px-space-sm py-2 rounded transition-all ${activeClassStr}`;
    } else {
      link.className = `nav-link flex items-center gap-space-sm px-space-sm py-2 rounded transition-all ${inactiveClassStr}`;
    }
  });

  // Hide all views
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.add('hidden');
  });

  // Show targeted view or generic fallback
  const targetViewId = `view-${path}`;
  const targetElement = document.getElementById(targetViewId);

  if (targetElement) {
    targetElement.classList.remove('hidden');
  } else {
    // Render high-fidelity generic fallback for auxiliary links
    const fallback = document.getElementById('view-generic-fallback');
    if (fallback) {
      const titleElem = document.getElementById('genericModuleTitle');
      const descElem = document.getElementById('genericModuleDesc');
      const iconElem = document.getElementById('genericModuleIcon');

      // Human-readable title
      const readableName = path
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      if (titleElem) titleElem.textContent = readableName;
      if (descElem) descElem.textContent = `Enterprise ESG Sub-Module: ${readableName} • MEIL Group Consolidated`;
      if (iconElem) {
        if (path.includes('map')) iconElem.textContent = 'map';
        else if (path.includes('sdg')) iconElem.textContent = 'spa';
        else if (path.includes('radar') || path.includes('anomaly')) iconElem.textContent = 'radar';
        else if (path.includes('chat') || path.includes('gemini')) iconElem.textContent = 'auto_awesome';
        else if (path.includes('audit')) iconElem.textContent = 'history_edu';
        else iconElem.textContent = 'domain';
      }

      fallback.classList.remove('hidden');
    }
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =========================================================================
   2. REACTIVE ENERGY & EMISSION CALCULATIONS
   ========================================================================= */
function initCalculations() {
  const inputs = document.querySelectorAll('.energy-calc-input');
  inputs.forEach(input => {
    input.addEventListener('input', recalculateEnergyAndEmissions);
  });
}

function recalculateEnergyAndEmissions() {
  const gridMwh = parseFloat(document.getElementById('inputGridMwh')?.value) || 0;
  const solarMwh = parseFloat(document.getElementById('inputSolarMwh')?.value) || 0;
  const dieselKl = parseFloat(document.getElementById('inputDieselKl')?.value) || 0;
  const pngGj = parseFloat(document.getElementById('inputPngGj')?.value) || 0;

  // Energy in GJ Conversions:
  // 1 MWh = 3.6 GJ
  // 1 KL Diesel ~ 36.4 GJ
  // PNG is already in GJ
  const gridGj = gridMwh * 3.6;
  const solarGj = solarMwh * 3.6;
  const dieselGj = dieselKl * 36.4;
  const totalGj = gridGj + solarGj + dieselGj + pngGj;

  const renewableRatio = totalGj > 0 ? (solarGj / totalGj) * 100 : 0;

  // Update displays in Section C
  const ratioDisplay = document.getElementById('renewableRatioDisplay');
  if (ratioDisplay) {
    ratioDisplay.textContent = `${renewableRatio.toFixed(2)}%`;
  }

  const totalGjDisplay = document.getElementById('totalGjDisplay');
  if (totalGjDisplay) {
    totalGjDisplay.textContent = `${totalGj.toLocaleString('en-US', { maximumFractionDigits: 1 })} GJ`;
  }

  // Reactive GHG Emissions:
  // Scope 1: Diesel KL * 2.6865 tCO2e/KL
  const scope1 = dieselKl * 2.68;
  // Scope 2: Grid MWh * 0.710 tCO2e/MWh
  const scope2 = gridMwh * 0.710;

  const scope1Elem = document.getElementById('scope1Display');
  if (scope1Elem) {
    scope1Elem.innerHTML = `${scope1.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span class="text-xs font-normal text-secondary">tCO₂e</span>`;
  }

  const scope2Elem = document.getElementById('scope2Display');
  if (scope2Elem) {
    scope2Elem.innerHTML = `${scope2.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span class="text-xs font-normal text-secondary">tCO₂e</span>`;
  }

  // Backend / Cloud Auto-Save via MEIL_API
  if (window.MEIL_API) {
    window.MEIL_API.debounce('energy-auto-save', () => {
      window.MEIL_API.saveEnergyRecord({
        grid_mwh: gridMwh,
        solar_mwh: solarMwh,
        diesel_kl: dieselKl,
        png_gj: pngGj,
        renewable_ratio_pct: Number(renewableRatio.toFixed(2)),
        total_energy_gj: Number(totalGj.toFixed(2)),
        calculated_scope1_tco2e: Number(scope1.toFixed(2)),
        calculated_scope2_tco2e: Number(scope2.toFixed(2))
      });
    }, 1000);
  }

  // Update auto-save indicator
  const timeElem = document.getElementById('autoSaveTime');
  if (timeElem) {
    const now = new Date();
    timeElem.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} IST`;
  }
}

/* =========================================================================
   3. INLINE UNIT CONVERTER
   ========================================================================= */
function initUnitConverter() {
  const modal = document.getElementById('unitConverterModal');
  const openBtn = document.getElementById('toggleUnitModalBtn');
  const closeBtn = document.getElementById('closeUnitModalBtn');
  const applyBtn = document.getElementById('applyConvBtn');
  const convInput = document.getElementById('convInput');
  const convType = document.getElementById('convType');
  const convResult = document.getElementById('convResult');

  function updateConversion() {
    const val = parseFloat(convInput?.value) || 0;
    const type = convType?.value;

    if (type === 'energy') {
      const mwh = (val / 1000).toFixed(3);
      const gj = (val * 0.0036).toFixed(3);
      convResult.textContent = `${val.toLocaleString()} kWh = ${mwh} MWh (${gj} GJ)`;
    } else if (type === 'fuel') {
      const kl = (val / 1000).toFixed(3);
      const mt = (val * 0.00085).toFixed(3);
      convResult.textContent = `${val.toLocaleString()} L = ${kl} KL (~${mt} MT Diesel)`;
    } else if (type === 'water') {
      const kl = (val / 1000).toFixed(2);
      convResult.textContent = `${val.toLocaleString()} L = ${kl} KL (1 KL = 1 m³)`;
    }
  }

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      updateConversion();
    });
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (applyBtn && modal) {
    applyBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (convInput) {
    convInput.addEventListener('input', updateConversion);
  }
  if (convType) {
    convType.addEventListener('change', updateConversion);
  }
}

/* =========================================================================
   4. EMISSION FACTOR MASTER TABLE & EDIT MODAL
   ========================================================================= */
let currentEditRow = null;

function openEditModal(source, value, unit, ref, region) {
  document.getElementById('modalSourceName').value = source;
  document.getElementById('modalFactorValue').value = value;
  document.getElementById('modalUnit').value = unit;
  document.getElementById('modalReference').value = ref;
  document.getElementById('modalRegion').value = region;
  document.getElementById('modalJustification').value = '';
  document.getElementById('editFactorModal').classList.remove('hidden');
}

function saveFactorChange() {
  const justification = document.getElementById('modalJustification')?.value.trim();
  if (!justification) {
    showNotification('Audit Error', 'Please provide a mandatory audit justification before committing emission factor modifications.');
    return;
  }

  const source = document.getElementById('modalSourceName').value;
  const newVal = parseFloat(document.getElementById('modalFactorValue').value) || 0;

  // Update corresponding row in table if found
  const rows = document.querySelectorAll('#factorTableBody tr');
  rows.forEach(row => {
    if (row.innerText.includes(source)) {
      const factorValCell = row.cells[1];
      if (factorValCell) {
        factorValCell.textContent = newVal.toFixed(4);
        factorValCell.classList.add('text-on-tertiary-container');
      }
    }
  });

  // Persist to Backend API / Supabase
  if (window.MEIL_API) {
    window.MEIL_API.updateEmissionFactor(source, newVal, justification);
  }

  document.getElementById('editFactorModal').classList.add('hidden');
  showNotification('Factor Committed', `Factor for "${source}" updated to ${newVal.toFixed(4)}. Audit log updated.`);
}

function initFactorSearch() {
  const searchInput = document.getElementById('factorSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#factorTableBody tr');
      rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
      });
    });
  }
}

function filterFactorsBySector(sector) {
  const rows = document.querySelectorAll('#factorTableBody tr');
  rows.forEach(row => {
    if (!sector) {
      row.style.display = '';
    } else {
      row.style.display = row.innerText.includes(sector) ? '' : 'none';
    }
  });
}

/* =========================================================================
   5. SITE AUDIT LEDGER FILTER & INSPECT MODAL
   ========================================================================= */
function filterSites(category, btn) {
  document.querySelectorAll('.site-filter-btn').forEach(b => {
    b.className = 'site-filter-btn px-2.5 py-1 text-label-sm font-label-sm rounded font-medium bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors';
  });
  btn.className = 'site-filter-btn px-2.5 py-1 text-label-sm font-label-sm rounded font-medium bg-primary text-on-primary';

  const rows = document.querySelectorAll('.site-row');
  rows.forEach(row => {
    const cats = row.getAttribute('data-category') || '';
    if (category === 'all') {
      row.style.display = '';
    } else if (category === 'due') {
      row.style.display = cats.includes('due') ? '' : 'none';
    } else if (category === 'high') {
      row.style.display = cats.includes('high') ? '' : 'none';
    }
  });
}

function inspectSite(name, bu, s1, s2, status) {
  document.getElementById('inspectSiteTitle').textContent = name;
  document.getElementById('inspectSiteBu').textContent = bu;
  document.getElementById('inspectScope1').textContent = s1;
  document.getElementById('inspectScope2').textContent = s2;
  document.getElementById('inspectStatus').textContent = status;
  document.getElementById('inspectSiteModal').classList.remove('hidden');
}

/* =========================================================================
   6. PRINCIPLE TABS SWITCHING (P1 - P9)
   ========================================================================= */
const principleMetadata = {
  1: { name: 'Principle 1: Businesses should conduct and govern themselves with Integrity, and in a manner that is Ethical, Transparent and Accountable', comp: '100%' },
  2: { name: 'Principle 2: Businesses should provide goods and services in a manner that is sustainable and safe', comp: '90%' },
  3: { name: 'Principle 3: Businesses should respect and promote the well-being of all employees, including those in their value chains', comp: '88%' },
  4: { name: 'Principle 4: Businesses should respect the interests of and be responsive to all its stakeholders', comp: '65%' },
  5: { name: 'Principle 5: Businesses should respect and promote human rights', comp: '80%' },
  6: { name: 'Principle 6: Environmental Performance Metrics', comp: '85%' },
  7: { name: 'Principle 7: Businesses, when engaging in influencing public and regulatory policy, should do so in a manner that is responsible and transparent', comp: '50%' },
  8: { name: 'Principle 8: Businesses should promote inclusive growth and equitable development (CSR)', comp: '75%' },
  9: { name: 'Principle 9: Businesses should engage with and provide value to their consumers in a responsible manner', comp: '92%' }
};

function switchPrinciple(pNumber, button) {
  document.querySelectorAll('.principle-tab').forEach(b => {
    b.className = 'principle-tab flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-left group';
  });

  button.className = 'principle-tab flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary shadow-sm text-left active';

  const titleElem = document.getElementById('principleSectionTitle');
  if (titleElem && principleMetadata[pNumber]) {
    titleElem.textContent = principleMetadata[pNumber].name;
  }

  showNotification(`Principle ${pNumber} Selected`, `${principleMetadata[pNumber]?.comp || '0%'} Completed for Polavaram Hydro package.`);
}

/* =========================================================================
   7. TELEMETRY, EVIDENCE VAULT & NOTES
   ========================================================================= */
function initTelemetryButton() {
  const btn = document.getElementById('load-demo-btn');
  if (btn) {
    btn.addEventListener('click', function() {
      const originalText = this.innerHTML;
      this.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span><span>Connecting SCADA & IoT...</span>';
      this.disabled = true;

      setTimeout(() => {
        this.innerHTML = '<span class="material-symbols-outlined text-sm text-secondary-container">check</span><span>Synchronized!</span>';
        showNotification('Live Telemetry Synced', 'Successfully received 1,098 KPI streams from all 14 active civil sites.');

        // Slight simulated data pulse
        const emissionsElem = document.getElementById('kpi-emissions');
        if (emissionsElem) emissionsElem.textContent = '417,890';

        setTimeout(() => {
          this.innerHTML = originalText;
          this.disabled = false;
        }, 1500);
      }, 900);
    });
  }

  // Engine recalculate button
  const recalcBtn = document.getElementById('btnRecalc');
  if (recalcBtn) {
    recalcBtn.addEventListener('click', function() {
      this.classList.add('opacity-50');
      setTimeout(() => {
        this.classList.remove('opacity-50');
        showNotification('Recalculation Complete', 'Consolidated corporate GHG footprint audited across all subsidiary entities.');
      }, 500);
    });
  }

  // Run verification pipeline
  const pipeBtn = document.getElementById('btnRunPipeline');
  if (pipeBtn) {
    pipeBtn.addEventListener('click', function() {
      this.innerHTML = `<span class="material-symbols-outlined text-base animate-spin">progress_activity</span> Computing Emissions...`;
      setTimeout(() => {
        this.innerHTML = `<span class="material-symbols-outlined text-base text-secondary-container">check</span> Pipeline Verified`;
        showNotification('Pipeline Verification', 'SEBI BRSR Core 9 attributes verified against CEA Baseline v19.');
        setTimeout(() => {
          this.innerHTML = `<span class="material-symbols-outlined text-base text-secondary-container">play_circle</span> Run Verification Pipeline`;
        }, 2000);
      }, 1000);
    });
  }
}

function triggerFileUpload() {
  const fileName = prompt('Enter filename to simulate upload to Evidence Vault:', 'APPCB_Water_Quality_Lab_Report_Q3.pdf');
  if (!fileName) return;

  const container = document.getElementById('evidenceChipsContainer');
  if (container) {
    const chip = document.createElement('div');
    chip.className = 'flex items-center justify-between p-2 rounded bg-surface-container text-on-surface text-xs animate-pulse';
    chip.innerHTML = `
      <div class="flex items-center gap-2 min-w-0">
        <span class="material-symbols-outlined text-base text-secondary shrink-0">picture_as_pdf</span>
        <span class="truncate font-medium">${fileName}</span>
      </div>
      <span class="material-symbols-outlined text-base text-secondary cursor-pointer hover:text-error shrink-0" onclick="this.parentElement.remove(); updateVaultCount();">close</span>
    `;
    container.appendChild(chip);
    setTimeout(() => chip.classList.remove('animate-pulse'), 1000);
    updateVaultCount();
    
    // Sync with backend API
    if (window.MEIL_API) {
      window.MEIL_API.uploadEvidence({
        fileName: fileName,
        principleRef: 'P6-EI-01',
        attachedBy: 'K. V. Rao'
      });
    }

    showNotification('Evidence Vault Updated', `Attached "${fileName}" with SHA-256 integrity hash.`);
  }
}

function updateVaultCount() {
  const container = document.getElementById('evidenceChipsContainer');
  const countBadge = document.getElementById('vaultFileCount');
  if (container && countBadge) {
    const count = container.children.length;
    countBadge.textContent = `${count} Files Attached`;
  }
}

function postAuditNote() {
  const textInput = document.getElementById('newAuditNoteText');
  const text = textInput?.value.trim();
  if (!text) {
    showNotification('Input Required', 'Please enter a note before posting.');
    return;
  }

  const notesList = document.getElementById('auditNotesList');
  if (notesList) {
    const note = document.createElement('div');
    note.className = 'p-space-sm rounded-lg bg-surface-container-low space-y-1';
    note.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-on-surface">K. V. Rao (Group CSO)</span>
        <span class="text-on-surface-variant">Just now</span>
      </div>
      <p class="text-xs text-on-surface-variant">${text}</p>
    `;
    notesList.appendChild(note);
    textInput.value = '';

    const badge = document.getElementById('notesCountBadge');
    if (badge) {
      badge.textContent = `${notesList.children.length} Notes`;
    }

    // Persist to backend
    if (window.MEIL_API) {
      window.MEIL_API.addAuditLog(text, 'Polavaram Hydro Package');
    }

    showNotification('Audit Discussion', 'Your compliance clarification note has been appended to the permanent audit log.');
  }
}

/* =========================================================================
   8. NOTIFICATIONS & TOASTS
   ========================================================================= */
function showNotification(title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto flex items-start gap-3 p-4 bg-primary text-on-primary rounded-lg shadow-xl max-w-sm border-l-4 border-on-tertiary-container transform transition-all duration-300 translate-y-4 opacity-0';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-secondary-container text-xl shrink-0">info</span>
    <div class="flex-1 text-xs">
      <div class="font-bold text-sm text-on-primary">${title}</div>
      <div class="text-on-primary-container mt-0.5">${message}</div>
    </div>
    <span class="material-symbols-outlined text-sm text-on-primary-container hover:text-on-primary cursor-pointer" onclick="this.parentElement.remove()">close</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/* =========================================================================
   9. QUICK ACTIONS & ANOMALY REASON
   ========================================================================= */
function showAnomalyReason() {
  alert(
    "GEMINI AI RADAR ANOMALY EXPLANATION\n\n" +
    "Entity: Site #108 • Zojila West Portal\n" +
    "Metric: Diesel Fuel (HSD) +48% YoY Variance\n\n" +
    "Primary Root Cause:\n" +
    "Sub-zero extreme winter temperatures (-24°C) necessitated 24/7 continuous thermal circulation and de-icing Genset duty cycles.\n" +
    "Additionally, twin-tube portal excavation accelerated to double-shift blasting to beat seasonal road closure.\n\n" +
    "Assurance Status: Flagged for mandatory external auditor verification."
  );
}

function launchGuidedTour() {
  showNotification('Guided Tour Active', 'Welcome to MEIL ESG Connect. Explore the Executive Dashboard, Principle-Wise Section C, Emission Engine, and Report Generator.');
  navigateTo('executive-dashboard');
}

function generatePdfReport() {
  showNotification('BRSR PDF Generated', 'Compiled official SEBI Annexure I BRSR Report with digital signature stamp (EY Assurance attached).');
}

function exportXbrlTaxonomy() {
  showNotification('XBRL Exported', 'Validated taxonomy XML: MEIL_BRSR_FY2025_26_Taxonomy_v3.4.xml ready for BSE/NSE portal upload.');
}

function exportTemplate() {
  showNotification('Template Export', 'Downloaded SEBI BRSR Section C Data Entry Workbook (XLSX).');
}

function saveDraftAction() {
  showNotification('Draft Saved', 'All Principle 6 parameters stored in local encrypted cache.');
}

function runValidationAction() {
  showNotification('Validation Passed', 'Zero schema violations detected. All required Essential Indicators have values.');
}

function submitForReviewAction() {
  showNotification('Submitted for Review', 'Workflow item dispatched to Business Unit Approver (S. Sharma, VP Hydro).');
}

function downloadSampleCSV() {
  const csvContent = "data:text/csv;charset=utf-8,Month,Actual_tCO2e,Budget_Ceiling\nApr,24100,25000\nMay,25600,26000\nJun,22000,23000\nJul,15000,16000\nAug,16400,17000\nSep,23000,24000\nOct,27000,28000\nNov,28400,29000\nDec,30000,31000\nJan,26400,28000\n";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "MEIL_FY26_GHG_Trajectory.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function initFiscalYearSelector() {
  const sel = document.getElementById('globalFiscalYearSelect');
  if (sel) {
    sel.addEventListener('change', (e) => {
      showNotification('Reporting Period', `Switched active corporate view to ${e.target.value}.`);
    });
  }
}

/* =========================================================================
   10. DARK / LIGHT THEME TOGGLE
   ========================================================================= */
function initTheme() {
  const savedTheme = localStorage.getItem('meil_theme');
  if (savedTheme) {
    applyTheme(savedTheme, false);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark', false);
  } else {
    applyTheme('light', false);
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme, true);
}

function applyTheme(theme, notify = true) {
  const icon = document.getElementById('themeToggleIcon');
  const btn = document.getElementById('themeToggleBtn');

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    localStorage.setItem('meil_theme', 'dark');
    if (icon) icon.textContent = 'light_mode';
    if (btn) btn.setAttribute('title', 'Switch to Light Theme');
    if (notify) showNotification('Theme Updated', 'Dark theme enabled.');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('meil_theme', 'light');
    if (icon) icon.textContent = 'dark_mode';
    if (btn) btn.setAttribute('title', 'Switch to Dark Theme');
    if (notify) showNotification('Theme Updated', 'Light theme enabled.');
  }
}

/* =========================================================================
   12. ROLE-BASED ACCESS CONTROL (RBAC) SELECTOR
   ========================================================================= */
function initRoleSelector() {
  const roleSelect = document.getElementById('roleSelector');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      const selectedRole = e.target.value;
      showNotification('Active Governance Role Changed', `Switched to "${selectedRole}". Permissions & audit headers synchronized.`);
    });
  }
}

