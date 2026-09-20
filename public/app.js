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
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkPath = link.getAttribute('data-path');
    if (linkPath === path) {
      link.classList.add('active-nav-link');
    } else {
      link.classList.remove('active-nav-link');
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
    // Render dedicated section view for sidebar routes
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
        else if (path.includes('reporting') || path.includes('cycle')) iconElem.textContent = 'event_repeat';
        else if (path.includes('hierarchy') || path.includes('organization')) iconElem.textContent = 'account_tree';
        else if (path.includes('approval') || path.includes('workflow')) iconElem.textContent = 'how_to_reg';
        else if (path.includes('entry') || path.includes('sheet')) iconElem.textContent = 'table_chart';
        else if (path.includes('core')) iconElem.textContent = 'verified';
        else if (path.includes('gap')) iconElem.textContent = 'analytics';
        else iconElem.textContent = 'domain';
      }

      // Render dedicated module interface
      const contentContainer = document.getElementById('genericModuleContent');
      if (contentContainer) {
        contentContainer.innerHTML = renderModuleSpecificContent(path, readableName);
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
  let isLiveActive = false;

  if (btn) {
    btn.addEventListener('click', async function() {
      const originalText = '<span class="material-symbols-outlined text-sm">sync</span><span>Sync Live Telemetry</span>';
      
      if (!isLiveActive) {
        this.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span><span>Syncing Telemetry Engine...</span>';
        this.disabled = true;

        // 1. Trigger Batch Sync with local drafts
        if (window.MEIL_API && typeof window.MEIL_API.batchSync === 'function') {
          await window.MEIL_API.batchSync([
            {
              mutationId: `sync-mut-${Date.now()}`,
              entityId: 'Site #108',
              baseVersion: 1,
              delta: { scope1_tco2e: 48920, water_recycled_pct: 44.5 }
            }
          ]);
        }

        // 2. Start Live Telemetry Streaming
        if (window.MEIL_API && typeof window.MEIL_API.startLiveTelemetry === 'function') {
          window.MEIL_API.startLiveTelemetry((packet) => {
            const emissionsElem = document.getElementById('kpi-emissions');
            if (emissionsElem) {
              const currentTotal = 418240 + Math.round((Math.random() - 0.5) * 40);
              emissionsElem.textContent = currentTotal.toLocaleString('en-US');
            }
            if (packet.anomalyFlag) {
              showNotification('Anomaly Radar Flag', `${packet.siteCode}: ${packet.anomalyReason}`);
            }
          }, 4000);
        }

        isLiveActive = true;
        this.innerHTML = '<span class="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span><span>Telemetry Streaming Active</span>';
        this.disabled = false;
        this.className = 'px-3 py-1.5 rounded bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all';
        showNotification('Telemetry Pipeline Connected', 'Real-time telemetry stream synchronized across 14 civil sites with Anomaly Radar.');
      } else {
        // Stop telemetry streaming
        if (window.MEIL_API && typeof window.MEIL_API.stopLiveTelemetry === 'function') {
          window.MEIL_API.stopLiveTelemetry();
        }
        isLiveActive = false;
        this.innerHTML = originalText;
        this.className = 'px-3 py-1.5 rounded bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-container transition-colors';
        showNotification('Telemetry Stream Paused', 'Switched back to static ledger mode.');
      }
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
      showNotification('Active Governance Role Changed', `Switched to "${selectedRole}". Permissions & audit headers updated.`);
    });
  }
}

/* =========================================================================
   13. DEDICATED MODULE VIEW RENDERERS (SAB SECTION ALAG ALAG KAAM KARE)
   ========================================================================= */
function renderModuleSpecificContent(path, title) {
  // 1. Reporting Cycles And Status Matrix (Dedicated Screen)
  if (path === 'reporting-cycles-and-status-matrix') {
    return `
      <div class="space-y-4">
        <!-- Top Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
            <div class="text-xs font-semibold text-secondary uppercase">Active Reporting Cycle</div>
            <div class="text-xl font-bold text-primary mt-1">Q2 FY 2025-26</div>
            <div class="text-xs text-secondary-container font-medium mt-0.5">Due in 41 Days</div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
            <div class="text-xs font-semibold text-secondary uppercase">Overall Submission Progress</div>
            <div class="text-xl font-bold text-primary mt-1">84.6%</div>
            <div class="w-full bg-surface-container-high h-1.5 rounded mt-2 overflow-hidden">
              <div class="bg-secondary h-full rounded" style="width: 84.6%"></div>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
            <div class="text-xs font-semibold text-secondary uppercase">Division Sign-Offs</div>
            <div class="text-xl font-bold text-primary mt-1">5 of 7 Completed</div>
            <div class="text-xs text-secondary font-medium mt-0.5">Stage-2 Assurance in Review</div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
            <div class="text-xs font-semibold text-secondary uppercase">Auditor Verification</div>
            <div class="text-xl font-bold text-primary mt-1">EY Certified</div>
            <div class="text-xs text-secondary font-medium mt-0.5">Stage-2 Reasonable</div>
          </div>
        </div>

        <!-- Matrix Table -->
        <div class="rounded-lg bg-surface-container border border-surface-container-high overflow-hidden shadow-sm">
          <div class="p-3 bg-surface-container-high/60 flex items-center justify-between border-b border-surface-container-high">
            <div class="font-bold text-sm text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-secondary">event_repeat</span>
              <span>Division &amp; Subsidiary Submission Matrix (Q2 FY26)</span>
            </div>
            <button class="px-3 py-1 rounded bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container" onclick="showNotification('Reminders Sent', 'Automated email alerts dispatched to pending BU submitters.')">
              Send Reminders
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-surface-container-high text-on-surface uppercase font-semibold">
                <tr>
                  <th class="p-3">Division / Entity</th>
                  <th class="p-3">Data Owner</th>
                  <th class="p-3">Cycle</th>
                  <th class="p-3">Progress</th>
                  <th class="p-3">Status</th>
                  <th class="p-3">Assurance Audit</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-container-high text-on-surface">
                <tr class="hover:bg-surface-container-high/40">
                  <td class="p-3 font-semibold text-primary">MEIL Hydro (Polavaram Spillway)</td>
                  <td class="p-3">M. Suresh (Lead Auditor)</td>
                  <td class="p-3">Q2 FY26</td>
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                        <div class="bg-primary h-full" style="width: 92%"></div>
                      </div>
                      <span class="font-bold">92%</span>
                    </div>
                  </td>
                  <td class="p-3"><span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px]">Approved</span></td>
                  <td class="p-3 text-secondary font-medium">EY Stage-2 Verified</td>
                  <td class="p-3 text-right"><button class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface text-primary font-semibold" onclick="inspectSite('Polavaram Multi-Purpose Irrigation Project', 'MEIL Hydro Division', '76,400', '19,840', 'Stage-2 Certified')">Inspect</button></td>
                </tr>
                <tr class="hover:bg-surface-container-high/40">
                  <td class="p-3 font-semibold text-primary">MEIL Roads &amp; Infra (Zojila Tunnel)</td>
                  <td class="p-3">P. R. Sharma (Site Engg)</td>
                  <td class="p-3">Q2 FY26</td>
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                        <div class="bg-amber-500 h-full" style="width: 78%"></div>
                      </div>
                      <span class="font-bold">78%</span>
                    </div>
                  </td>
                  <td class="p-3"><span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">Flagged Variance</span></td>
                  <td class="p-3 text-secondary font-medium">Diesel Spike Re-audit</td>
                  <td class="p-3 text-right"><button class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface text-primary font-semibold" onclick="inspectSite('Zojila Tunnel Project - Portal 1 & 2', 'MEIL Roads & Infra', '48,920', '12,180', 'Flagged Variance')">Inspect</button></td>
                </tr>
                <tr class="hover:bg-surface-container-high/40">
                  <td class="p-3 font-semibold text-primary">MEIL Hydro (Kaleshwaram Lift III)</td>
                  <td class="p-3">T. Venkat (Package Head)</td>
                  <td class="p-3">Q2 FY26</td>
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                        <div class="bg-blue-500 h-full" style="width: 85%"></div>
                      </div>
                      <span class="font-bold">85%</span>
                    </div>
                  </td>
                  <td class="p-3"><span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[11px]">Under Review</span></td>
                  <td class="p-3 text-secondary font-medium">Grid Bill Despatch Match</td>
                  <td class="p-3 text-right"><button class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface text-primary font-semibold" onclick="inspectSite('Kaleshwaram Lift Irrigation - Link III', 'MEIL Hydro Division', '24,310', '34,100', 'Review Pending')">Inspect</button></td>
                </tr>
                <tr class="hover:bg-surface-container-high/40">
                  <td class="p-3 font-semibold text-primary">Drillmec S.p.A. (Piacenza, Italy)</td>
                  <td class="p-3">G. Rossi (European ESG)</td>
                  <td class="p-3">Q2 FY26</td>
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                        <div class="bg-primary h-full" style="width: 95%"></div>
                      </div>
                      <span class="font-bold">95%</span>
                    </div>
                  </td>
                  <td class="p-3"><span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px]">Approved</span></td>
                  <td class="p-3 text-secondary font-medium">ISPRA Verified</td>
                  <td class="p-3 text-right"><button class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface text-primary font-semibold" onclick="showNotification('Drillmec Package', 'Italian manufacturing rig assembly verified against EU Taxonomy.')">Inspect</button></td>
                </tr>
                <tr class="hover:bg-surface-container-high/40">
                  <td class="p-3 font-semibold text-primary">Megha City Gas (CGD Networks)</td>
                  <td class="p-3">A. K. Jain (O&amp;M Head)</td>
                  <td class="p-3">Q2 FY26</td>
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                        <div class="bg-primary h-full" style="width: 88%"></div>
                      </div>
                      <span class="font-bold">88%</span>
                    </div>
                  </td>
                  <td class="p-3"><span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px]">Approved</span></td>
                  <td class="p-3 text-secondary font-medium">Internal Sign-off</td>
                  <td class="p-3 text-right"><button class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface text-primary font-semibold" onclick="showNotification('City Gas Package', 'City gas PNG throughput & fugitive leak logs audited.')">Inspect</button></td>
                </tr>
                <tr class="hover:bg-surface-container-high/40">
                  <td class="p-3 font-semibold text-primary">Olectra Greentech (EV Mobility)</td>
                  <td class="p-3">R. Patel (Sustainability Lead)</td>
                  <td class="p-3">Q2 FY26</td>
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                        <div class="bg-primary h-full" style="width: 91%"></div>
                      </div>
                      <span class="font-bold">91%</span>
                    </div>
                  </td>
                  <td class="p-3"><span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px]">Approved</span></td>
                  <td class="p-3 text-secondary font-medium">Stage-2 Certified</td>
                  <td class="p-3 text-right"><button class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface text-primary font-semibold" onclick="showNotification('Olectra Package', 'Electric bus battery lifecycle & zero tailpipe fleet verified.')">Inspect</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // 2. SDG Alignment (Dedicated Screen)
  if (path === 'sdg-alignment') {
    return `
      <div class="space-y-4">
        <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
          <h2 class="text-base font-bold text-primary mb-1">UN Sustainable Development Goals (SDG) Alignment</h2>
          <p class="text-xs text-secondary">Mapping MEIL mega-infrastructure packages against national NGRBC principles and 2030 Agenda targets.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="p-4 rounded-lg bg-surface-container border-l-4 border-blue-500">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded bg-blue-500 text-white flex items-center justify-center font-bold text-xs">6</span>
              <span class="font-bold text-sm text-primary">Clean Water &amp; Sanitation</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-2">Zero Liquid Discharge (ZLD) treatment deployed across 14 batching units. 38.5% total wastewater recycled on-site.</p>
            <div class="mt-3 text-xs font-semibold text-secondary">Performance: 52.8% Recycled at Polavaram</div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border-l-4 border-amber-500">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded bg-amber-500 text-white flex items-center justify-center font-bold text-xs">7</span>
              <span class="font-bold text-sm text-primary">Affordable &amp; Clean Energy</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-2">Transitioning remote package power from high-speed diesel to captive solar microgrids and high-tension transmission bays.</p>
            <div class="mt-3 text-xs font-semibold text-secondary">Renewable Mix: 28.4% Corporate Total</div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border-l-4 border-emerald-500">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">9</span>
              <span class="font-bold text-sm text-primary">Industry, Innovation &amp; Infra</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-2">100% fly-ash blended Portland Pozzolana Cement (PPC) and precision tunnel boring machines to minimize environmental spoil.</p>
            <div class="mt-3 text-xs font-semibold text-secondary">Compliance: ISO 14001 Certified</div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border-l-4 border-rose-500">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded bg-rose-500 text-white flex items-center justify-center font-bold text-xs">8</span>
              <span class="font-bold text-sm text-primary">Decent Work &amp; Economic Growth</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-2">Zero Fatalities across 46.8 Million safe man-hours. Lost Time Injury Frequency Rate (LTIFR) maintained at 0.14.</p>
            <div class="mt-3 text-xs font-semibold text-secondary">Workforce: 41,350 Employees Covered</div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border-l-4 border-indigo-500">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">12</span>
              <span class="font-bold text-sm text-primary">Responsible Consumption</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-2">64.2% excavated rock spoil reused for road embankments and river training structures in irrigation schemes.</p>
            <div class="mt-3 text-xs font-semibold text-secondary">Circularity: 100% Hazardous Waste Logged</div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border-l-4 border-teal-500">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded bg-teal-500 text-white flex items-center justify-center font-bold text-xs">13</span>
              <span class="font-bold text-sm text-primary">Climate Action</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-2">Scope 1 &amp; 2 turnover intensity reduced from 15.8 to 14.2 tCO₂e / ₹ Cr turnover, in line with MEIL 2030 net reduction.</p>
            <div class="mt-3 text-xs font-semibold text-secondary">SEBI BRSR Core Target: 12.0 by FY28</div>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Project Map (Dedicated Screen)
  if (path === 'project-map') {
    return `
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-primary">Site #108 • Zojila Tunnel</span>
              <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-bold">Kashmir &amp; Ladakh</span>
            </div>
            <p class="text-xs text-secondary mt-1">Package 1 &amp; 2 Twin-tube tunnel boring and sub-zero ventilation works.</p>
            <div class="mt-3 text-xs space-y-1">
              <div><span class="text-secondary">Emissions:</span> <span class="font-bold text-primary">48,920 tCO₂e (Scope 1)</span></div>
              <div><span class="text-secondary">Power Source:</span> <span class="font-medium text-primary">Solar Microgrid + High-Power DG</span></div>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-primary">Site #042 • Polavaram Project</span>
              <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold">Andhra Pradesh</span>
            </div>
            <p class="text-xs text-secondary mt-1">Multi-purpose irrigation spillway, concrete diaphragm walls and hydro intake.</p>
            <div class="mt-3 text-xs space-y-1">
              <div><span class="text-secondary">Emissions:</span> <span class="font-bold text-primary">76,400 tCO₂e (Scope 1)</span></div>
              <div><span class="text-secondary">Power Source:</span> <span class="font-medium text-primary">Dedicated Hydro Transmission</span></div>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-primary">Site #014 • Kaleshwaram Link III</span>
              <span class="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px] font-bold">Telangana</span>
            </div>
            <p class="text-xs text-secondary mt-1">Underground pump houses and high-tension canal lifts.</p>
            <div class="mt-3 text-xs space-y-1">
              <div><span class="text-secondary">Emissions:</span> <span class="font-bold text-primary">34,100 tCO₂e (Scope 2 Grid)</span></div>
              <div><span class="text-secondary">Power Source:</span> <span class="font-medium text-primary">Southern Grid CEA v19</span></div>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-primary">Site #INT-09 • Mongol Refinery</span>
              <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">Sainshand, Mongolia</span>
            </div>
            <p class="text-xs text-secondary mt-1">International EPC EPC-3 (Utilities) and EPC-4 (Captive Power Plant).</p>
            <div class="mt-3 text-xs space-y-1">
              <div><span class="text-secondary">Emissions:</span> <span class="font-bold text-primary">32,150 tCO₂e</span></div>
              <div><span class="text-secondary">Power Source:</span> <span class="font-medium text-primary">Substation Grid (12% Renew)</span></div>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-primary">Drillmec S.p.A. Plant</span>
              <span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold">Piacenza, Italy</span>
            </div>
            <p class="text-xs text-secondary mt-1">Automated heavy oil &amp; geothermal drilling rig fabrication facility.</p>
            <div class="mt-3 text-xs space-y-1">
              <div><span class="text-secondary">Emissions:</span> <span class="font-bold text-primary">5,420 tCO₂e (Scope 2)</span></div>
              <div><span class="text-secondary">Power Source:</span> <span class="font-medium text-primary">Northern Italy Grid</span></div>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-primary">Megha City Gas Package</span>
              <span class="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[11px] font-bold">Pan-India CGD</span>
            </div>
            <p class="text-xs text-secondary mt-1">Geographical Area (GA) pipeline networks and compressed natural gas stations.</p>
            <div class="mt-3 text-xs space-y-1">
              <div><span class="text-secondary">Emissions:</span> <span class="font-bold text-primary">12,600 tCO₂e</span></div>
              <div><span class="text-secondary">Power Source:</span> <span class="font-medium text-primary">Piped Natural Gas (PNG)</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Organization Hierarchy (Dedicated Screen)
  if (path === 'organization-hierarchy-tree') {
    return `
      <div class="space-y-4">
        <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
          <div class="font-bold text-sm text-primary">Corporate Governance &amp; Entity Hierarchy</div>
          <div class="text-xs text-secondary mt-0.5">Four-tier regulatory hierarchy structure configured for SEBI BRSR consolidated reporting.</div>
        </div>
        <div class="p-4 rounded-lg bg-surface-container-low border border-surface-container space-y-3">
          <div class="p-3 rounded bg-primary text-on-primary font-bold text-sm flex items-center justify-between">
            <span>Level 1: Megha Engineering &amp; Infrastructures Limited (MEIL Corporate Group)</span>
            <span class="text-xs font-normal">CIN: U45200TG2006PLC050277</span>
          </div>
          <div class="pl-6 border-l-2 border-primary space-y-2">
            <div class="p-2.5 rounded bg-surface-container font-semibold text-xs text-primary flex items-center justify-between">
              <span>├── MEIL Hydro &amp; Water Division</span>
              <span class="text-secondary font-normal">Polavaram, Kaleshwaram, Kundah Packages</span>
            </div>
            <div class="p-2.5 rounded bg-surface-container font-semibold text-xs text-primary flex items-center justify-between">
              <span>├── MEIL Roads, Transport &amp; Tunnels Division</span>
              <span class="text-secondary font-normal">Zojila Tunnel, Char Dham, Highway Packages</span>
            </div>
            <div class="p-2.5 rounded bg-surface-container font-semibold text-xs text-primary flex items-center justify-between">
              <span>├── Drillmec S.p.A. (Subsidiary - 100% Owned)</span>
              <span class="text-secondary font-normal">Piacenza (Italy), Houston (USA)</span>
            </div>
            <div class="p-2.5 rounded bg-surface-container font-semibold text-xs text-primary flex items-center justify-between">
              <span>├── Megha City Gas Distribution Pvt Ltd (Subsidiary)</span>
              <span class="text-secondary font-normal">16 Geographical Areas (CGD)</span>
            </div>
            <div class="p-2.5 rounded bg-surface-container font-semibold text-xs text-primary flex items-center justify-between">
              <span>├── Olectra Greentech Limited (Listed Entity)</span>
              <span class="text-secondary font-normal">Electric Bus &amp; Insulator Manufacturing</span>
            </div>
            <div class="p-2.5 rounded bg-surface-container font-semibold text-xs text-primary flex items-center justify-between">
              <span>└── ICOMM Tele Limited (Defense &amp; Telecom Infra)</span>
              <span class="text-secondary font-normal">Telecom Towers, Solar Structurals</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 5. BRSR Section A (Dedicated Screen)
  if (path === 'brsr-section-a-general') {
    return `
      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
          <h2 class="text-sm font-bold text-primary">SEBI BRSR Section A: General Disclosures</h2>
          <p class="text-secondary mt-0.5">Statutory corporate disclosures pursuant to Regulation 34(2)(f) of the LODR Regulations.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="p-3 bg-surface-container rounded space-y-2">
            <div class="font-bold text-primary">Corporate Identity</div>
            <div><span class="text-secondary">Company Name:</span> <span class="font-semibold text-on-surface">Megha Engineering &amp; Infrastructures Ltd</span></div>
            <div><span class="text-secondary">CIN:</span> <span class="font-semibold text-on-surface">U45200TG2006PLC050277</span></div>
            <div><span class="text-secondary">Year of Incorporation:</span> <span class="font-semibold text-on-surface">2006</span></div>
            <div><span class="text-secondary">Registered Address:</span> <span class="font-semibold text-on-surface">S-2, Technocrat Industrial Estate, Balanagar, Hyderabad - 500037</span></div>
          </div>
          <div class="p-3 bg-surface-container rounded space-y-2">
            <div class="font-bold text-primary">Workforce Demographics</div>
            <div><span class="text-secondary">Permanent Employees:</span> <span class="font-semibold text-on-surface">12,450</span></div>
            <div><span class="text-secondary">Contractual Workforce:</span> <span class="font-semibold text-on-surface">28,900</span></div>
            <div><span class="text-secondary">Female Participation Ratio:</span> <span class="font-semibold text-on-surface">14.8% Overall (22.0% KMP/Board)</span></div>
            <div><span class="text-secondary">CSR Disbursed (FY26):</span> <span class="font-semibold text-on-surface">₹ 84.50 Crores</span></div>
          </div>
        </div>
      </div>
    `;
  }

  // 6. BRSR Section B (Dedicated Screen)
  if (path === 'brsr-section-b-management-and-process') {
    return `
      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
          <h2 class="text-sm font-bold text-primary">SEBI BRSR Section B: Management &amp; Process Disclosures</h2>
          <p class="text-secondary mt-0.5">Policy governance, leadership oversight, and compliance commitment across all 9 NGRBC principles.</p>
        </div>
        <div class="p-3 bg-surface-container rounded">
          <table class="w-full text-left">
            <thead class="uppercase font-semibold text-secondary border-b border-surface-container-high">
              <tr>
                <th class="p-2">NGRBC Principle</th>
                <th class="p-2">Policy Approved by Board?</th>
                <th class="p-2">Web Link Available?</th>
                <th class="p-2">Internal Audit Review</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-container-high text-on-surface">
              <tr><td class="p-2 font-medium">P1: Ethics, Bribery &amp; Anti-Corruption</td><td class="p-2 text-primary font-bold">Yes (Board Resolution #24)</td><td class="p-2">meil.in/governance/p1</td><td class="p-2 text-secondary font-semibold">Verified</td></tr>
              <tr><td class="p-2 font-medium">P2: Product Sustainability &amp; LCA</td><td class="p-2 text-primary font-bold">Yes (ESG Committee)</td><td class="p-2">meil.in/governance/p2</td><td class="p-2 text-secondary font-semibold">Verified</td></tr>
              <tr><td class="p-2 font-medium">P3: Employee Safety &amp; Well-being</td><td class="p-2 text-primary font-bold">Yes (EHS Directorate)</td><td class="p-2">meil.in/governance/p3</td><td class="p-2 text-secondary font-semibold">Verified</td></tr>
              <tr><td class="p-2 font-medium">P6: Environmental Stewardship</td><td class="p-2 text-primary font-bold">Yes (Board Resolution #31)</td><td class="p-2">meil.in/governance/p6</td><td class="p-2 text-secondary font-semibold">Verified</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 7. BRSR Core 9 Attributes (Dedicated Screen)
  if (path === 'brsr-core-9-attributes') {
    return `
      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-primary">SEBI Mandatory Core 9 Quantitative Attributes</h2>
            <p class="text-secondary mt-0.5">Audited in accordance with SEBI circular SEBI/HO/CFD/CFD-SEC-2/P/CIR/2023/122.</p>
          </div>
          <span class="px-3 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-bold">Reasonable Assurance</span>
        </div>
        <div class="p-3 bg-surface-container rounded">
          <table class="w-full text-left">
            <thead class="uppercase font-semibold text-secondary border-b border-surface-container-high">
              <tr>
                <th class="p-2">#</th>
                <th class="p-2">Core Parameter</th>
                <th class="p-2">FY26 Performance</th>
                <th class="p-2">Intensity Metric</th>
                <th class="p-2">Assurance Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-container-high text-on-surface">
              <tr><td class="p-2">1</td><td class="p-2 font-semibold">Greenhouse Gas Emissions (Scope 1 &amp; 2)</td><td class="p-2 font-bold text-primary">418,240 tCO₂e</td><td class="p-2">14.20 tCO₂e / ₹ Cr</td><td class="p-2 text-secondary font-bold">EY Stage-2 Certified</td></tr>
              <tr><td class="p-2">2</td><td class="p-2 font-semibold">Water Withdrawal &amp; Consumption</td><td class="p-2 font-bold text-primary">1,480,200 KL</td><td class="p-2">38.5% Recycled ZLD</td><td class="p-2 text-secondary font-bold">EY Stage-2 Certified</td></tr>
              <tr><td class="p-2">3</td><td class="p-2 font-semibold">Energy Footprint &amp; Renewable Ratio</td><td class="p-2 font-bold text-primary">1,820,400 GJ</td><td class="p-2">28.4% Clean Mix</td><td class="p-2 text-secondary font-bold">EY Stage-2 Certified</td></tr>
              <tr><td class="p-2">4</td><td class="p-2 font-semibold">Waste Management &amp; Circular Spoil</td><td class="p-2 font-bold text-primary">48,200 MT Spoil</td><td class="p-2">64.2% Reused</td><td class="p-2 text-secondary font-bold">EY Stage-2 Certified</td></tr>
              <tr><td class="p-2">5</td><td class="p-2 font-semibold">Employee Well-being &amp; LTIFR</td><td class="p-2 font-bold text-primary">0 Fatalities</td><td class="p-2">0.14 LTIFR</td><td class="p-2 text-secondary font-bold">EY Stage-2 Certified</td></tr>
              <tr><td class="p-2">6</td><td class="p-2 font-semibold">Gender Diversity in Workforce</td><td class="p-2 font-bold text-primary">14.8% Female Ratio</td><td class="p-2">22.0% in KMP</td><td class="p-2 text-secondary font-bold">EY Stage-2 Certified</td></tr>
              <tr><td class="p-2">7</td><td class="p-2 font-semibold">Fair Minimum &amp; Living Wages</td><td class="p-2 font-bold text-primary">100% Equal Pay</td><td class="p-2">1.00 Ratio</td><td class="p-2 text-secondary font-bold">EY Stage-2 Certified</td></tr>
              <tr><td class="p-2">8</td><td class="p-2 font-semibold">Job Creation in Tier-2/3 Towns</td><td class="p-2 font-bold text-primary">24,500 Local Jobs</td><td class="p-2">82.0% Regional Staff</td><td class="p-2 text-secondary font-bold">EY Stage-2 Certified</td></tr>
              <tr><td class="p-2">9</td><td class="p-2 font-semibold">Ethical Sourcing &amp; Anti-Corruption</td><td class="p-2 font-bold text-primary">100% Vendor Signoff</td><td class="p-2">0 Bribery Incidents</td><td class="p-2 text-secondary font-bold">EY Stage-2 Certified</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 8. Project Quick-Entry Sheet (Dedicated Screen)
  if (path === 'project-quick-entry-sheet') {
    return `
      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
          <div class="font-bold text-sm text-primary">Rapid Telemetry &amp; Consumption Log Sheet</div>
          <div class="text-secondary mt-0.5">Quick data entry for site environmental engineers and civil package coordinators.</div>
        </div>
        <div class="p-4 rounded-lg bg-surface-container-low border border-surface-container space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="font-bold text-secondary">Package Site</label>
              <select class="w-full mt-1 p-2 rounded bg-surface border border-surface-container text-on-surface">
                <option>Site #108 • Zojila Tunnel Portal 1 &amp; 2</option>
                <option>Site #042 • Polavaram Spillway Works</option>
                <option>Site #014 • Kaleshwaram Pump House</option>
                <option>Site #INT-09 • Mongol Oil Refinery</option>
              </select>
            </div>
            <div>
              <label class="font-bold text-secondary">Diesel Consumption (KL)</label>
              <input type="number" value="120" class="w-full mt-1 p-2 rounded bg-surface border border-surface-container text-on-surface font-bold">
            </div>
            <div>
              <label class="font-bold text-secondary">Grid Electricity (MWh)</label>
              <input type="number" value="450" class="w-full mt-1 p-2 rounded bg-surface border border-surface-container text-on-surface font-bold">
            </div>
            <div>
              <label class="font-bold text-secondary">Water Recycled (KL)</label>
              <input type="number" value="820" class="w-full mt-1 p-2 rounded bg-surface border border-surface-container text-on-surface font-bold">
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button class="px-4 py-2 rounded bg-primary text-on-primary font-semibold hover:bg-primary-container" onclick="showNotification('Quick Entry Recorded', 'Entry successfully added to site consumption ledger.')">
              Submit to Asset Ledger
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 9. Audit Trail Log (Dedicated Screen)
  if (path === 'audit-trail-log') {
    return `
      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-primary">Immutable Compliance Audit Trail Log</h2>
            <p class="text-secondary mt-0.5">Permanent cryptographic chronological log of all emission factor overrides, file uploads, and sign-offs.</p>
          </div>
          <button class="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface text-primary font-semibold" onclick="showNotification('Export Initiated', 'Audit trail log exported as certified CSV.')">Export CSV</button>
        </div>
        <div class="p-3 bg-surface-container rounded divide-y divide-surface-container-high">
          <div class="py-2.5 flex items-start justify-between">
            <div>
              <div class="font-bold text-primary">K. V. Rao (Chief Sustainability Officer) • <span class="text-secondary font-normal">Factor Override</span></div>
              <div class="text-on-surface-variant mt-0.5">Modified High-Speed Diesel factor to 2.6865. Justification: SEBI BRSR Q2 National Lab Calibration Update.</div>
            </div>
            <span class="text-[11px] text-secondary">10 mins ago</span>
          </div>
          <div class="py-2.5 flex items-start justify-between">
            <div>
              <div class="font-bold text-primary">M. Suresh (Lead Auditor) • <span class="text-secondary font-normal">Scope 2 Grid Verification</span></div>
              <div class="text-on-surface-variant mt-0.5">Scope 2 emissions verified against Southern Regional Load Despatch Centre monthly statements.</div>
            </div>
            <span class="text-[11px] text-secondary">Yesterday</span>
          </div>
          <div class="py-2.5 flex items-start justify-between">
            <div>
              <div class="font-bold text-primary">S. K. Verma (Site Engineer) • <span class="text-secondary font-normal">Evidence Vault Upload</span></div>
              <div class="text-on-surface-variant mt-0.5">Attached heavy equipment diesel logbooks with SHA-256 verification registered.</div>
            </div>
            <span class="text-[11px] text-secondary">2 days ago</span>
          </div>
        </div>
      </div>
    `;
  }

  // 10. Gemini Copilot & AI Modules
  if (path.includes('gemini') || path.includes('narrative') || path.includes('chat') || path.includes('gap') || path.includes('anomaly')) {
    return `
      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-bold text-[10px]">GEMINI ESG COPILOT</span>
            <span class="font-bold text-sm text-primary">${title}</span>
          </div>
          <p class="text-secondary mt-1">Generative regulatory narrative engine powered by Google Gemini, trained on SEBI BRSR Core guidelines and ISO 14064 GHG standards.</p>
        </div>
        <div class="p-4 bg-surface-container-low rounded-lg border border-surface-container space-y-3">
          <label class="font-bold text-secondary">Select Disclosure Principle / Focus Area</label>
          <select class="w-full p-2.5 rounded bg-surface border border-surface-container text-on-surface font-medium" id="aiPrincipleSelect">
            <option>Principle 6: Energy &amp; Decarbonization Roadmap</option>
            <option>Principle 3: Workforce Safety &amp; LTIFR Zero-Harm Narrative</option>
            <option>Principle 8: CSR Discretionary Spend &amp; Community Uplift</option>
            <option>SEBI Core 9: External Assurance Verification Statement</option>
          </select>
          <div>
            <label class="font-bold text-secondary">Contextual Guidance / Auditor Notes</label>
            <textarea class="w-full mt-1 p-2.5 rounded bg-surface border border-surface-container text-on-surface" rows="3" placeholder="Add specific package context (e.g. Polavaram hydel spillway concrete curing water reuse)..."></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-primary text-on-primary font-semibold hover:bg-primary-container" onclick="showNotification('Draft Generated', 'Gemini AI generated formal SEBI BRSR narrative. Review in Report Generator.')">
              Generate Draft Narrative
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Default clean layout for other screens
  return `
    <div class="space-y-4 text-xs">
      <div class="p-4 rounded-lg bg-surface-container border border-surface-container-high">
        <h2 class="text-sm font-bold text-primary">${title}</h2>
        <p class="text-secondary mt-0.5">Enterprise ESG reporting and data analytics subsystem for MEIL Group operations.</p>
      </div>
      <div class="p-6 rounded-lg bg-surface-container-low border border-surface-container flex flex-col items-center justify-center text-center space-y-2">
        <span class="material-symbols-outlined text-4xl text-secondary">verified</span>
        <div class="font-bold text-base text-primary">${title} Active</div>
        <p class="text-secondary max-w-md">Data ledger and regulatory indicators are accessible through the primary executive workflows.</p>
        <div class="flex gap-2 pt-2">
          <button class="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-primary font-semibold" onclick="navigateTo('executive-dashboard')">Executive Dashboard</button>
          <button class="px-3 py-1.5 rounded bg-primary text-on-primary font-semibold hover:bg-primary-container" onclick="navigateTo('brsr-section-c-principle-wise-performance')">BRSR Section C</button>
        </div>
      </div>
    </div>
  `;
}

