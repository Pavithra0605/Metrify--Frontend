const DEFAULT_INSTRUMENTS = [
    {
        id: "INS-1001",
        name: "Industrial Platform Scale 150kg",
        type: "Weighing & Mass",
        owner: "Apex Logistics Ltd",
        location: "Warehouse Bay 2, Chennai",
        status: "Verified",
        calibrationDate: "2025-10-15",
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], // 3 days from now (Triggers Due Alert!)
        notes: "High precision strain gauge scale. Certified under ISO/IEC 17025."
    },
    {
        id: "INS-1002",
        name: "High Pressure Manometer 0-40 bar",
        type: "Pressure Gauge",
        owner: "Titan Petrochemicals",
        location: "Plant Unit 3, Manali",
        status: "Pending",
        calibrationDate: "2025-06-10",
        dueDate: "2026-06-10",
        notes: "Scheduled for bi-annual re-verification."
    },
    {
        id: "INS-1003",
        name: "Digital Temperature Data Logger",
        type: "Temperature Sensor",
        owner: "BioHealth Pharma",
        location: "Cold Storage Vault A",
        status: "Expired",
        calibrationDate: "2024-09-01",
        dueDate: "2025-09-01", // Overdue date
        notes: "Calibration expired. Recalibration order pending."
    },
    {
        id: "INS-1004",
        name: "Ultrasonic Flow Meter 2-inch",
        type: "Flow Meter",
        owner: "AquaFlow Systems",
        location: "Pump Station 4",
        status: "Verified",
        calibrationDate: "2025-11-20",
        dueDate: "2026-11-20",
        notes: "Calibrated with zero drift."
    },
    {
        id: "INS-1005",
        name: "Vernier Caliper Digital 150mm",
        type: "Dimensional Caliper",
        owner: "Precision Tooling Corp",
        location: "Quality Inspection Room",
        status: "Pending",
        calibrationDate: "2025-05-12",
        dueDate: "2026-05-12",
        notes: "Awaiting final metrology inspector sign-off."
    }
];

const DEFAULT_INSPECTIONS = [
    {
        date: "2025-10-15",
        instrumentId: "INS-1001",
        instrumentName: "Industrial Platform Scale 150kg",
        inspector: "Officer R. Sharma (MET-889)",
        outcome: "Passed",
        remarks: "Zero error within tolerance limits across 5 test loads."
    },
    {
        date: "2025-06-10",
        instrumentId: "INS-1002",
        instrumentName: "High Pressure Manometer 0-40 bar",
        inspector: "Officer V. Kulkarni (MET-412)",
        outcome: "Conditional",
        remarks: "Slight hysteresis observed at upper range. Needs monitoring."
    },
    {
        date: "2024-09-01",
        instrumentId: "INS-1003",
        instrumentName: "Digital Temperature Data Logger",
        inspector: "Officer A. Menon (MET-102)",
        outcome: "Failed",
        remarks: "Temperature sensor drift exceeded acceptable threshold."
    }
];

let instruments = [];
let inspections = [];

try {
    instruments = JSON.parse(localStorage.getItem('metrify_instruments')) || DEFAULT_INSTRUMENTS;
} catch (e) {
    instruments = DEFAULT_INSTRUMENTS;
}

try {
    inspections = JSON.parse(localStorage.getItem('metrify_inspections')) || DEFAULT_INSPECTIONS;
} catch (e) {
    inspections = DEFAULT_INSPECTIONS;
}

function saveData() {
    try {
        localStorage.setItem('metrify_instruments', JSON.stringify(instruments));
        localStorage.setItem('metrify_inspections', JSON.stringify(inspections));
    } catch (e) {
        console.error("Storage error:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupNavigation();
    renderDashboard();
    renderRegistry();
    renderInspectionHistory();
    populateInspectionDropdowns();
    setupEventListeners();
    checkDueAlerts();
});

function initTheme() {
    const savedTheme = localStorage.getItem('metrify_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('metrify_theme', newTheme);
            showToast(`Switched to ${newTheme} mode`, 'success');
        });
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const sections = document.querySelectorAll('.content-section');
            sections.forEach(sec => sec.classList.remove('active'));

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

function switchSection(targetId) {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(nav => {
        if (nav.getAttribute('data-target') === targetId) {
            nav.click();
        }
    });
}

function setupEventListeners() {
    const instrumentForm = document.getElementById('instrument-form');
    if (instrumentForm) {
        instrumentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const idInput = document.getElementById('reg-id');
            if (!idInput) return;
            const id = idInput.value.trim();

            if (instruments.some(inst => inst.id.toLowerCase() === id.toLowerCase())) {
                showToast(`Instrument ID "${id}" already exists in registry!`, 'error');
                return;
            }

            const newInst = {
                id: id,
                name: document.getElementById('reg-name').value.trim(),
                type: document.getElementById('reg-type').value,
                owner: document.getElementById('reg-owner').value.trim(),
                location: document.getElementById('reg-location').value.trim() || 'N/A',
                status: document.getElementById('reg-status').value,
                calibrationDate: document.getElementById('reg-calibration-date').value || new Date().toISOString().split('T')[0],
                dueDate: document.getElementById('reg-due-date').value,
                notes: document.getElementById('reg-notes').value.trim()
            };

            instruments.unshift(newInst);
            saveData();
            renderDashboard();
            renderRegistry();
            populateInspectionDropdowns();
            checkDueAlerts();

            showToast(`Instrument ${id} registered successfully!`, 'success');
            instrumentForm.reset();
            switchSection('registry-section');
        });
    }

    const registrySearch = document.getElementById('registry-search');
    const statusFilter = document.getElementById('status-filter');
    if (registrySearch) registrySearch.addEventListener('input', renderRegistry);
    if (statusFilter) statusFilter.addEventListener('change', renderRegistry);

    const globalSearch = document.getElementById('global-search-input');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = globalSearch.value.trim();
                if (query) {
                    switchSection('registry-section');
                    if (registrySearch) registrySearch.value = query;
                    renderRegistry();
                }
            }
        });
    }

    const verifyBtn = document.getElementById('verify-btn');
    const verifySearchInput = document.getElementById('verify-search-input');
    if (verifyBtn && verifySearchInput) {
        verifyBtn.addEventListener('click', () => {
            performVerification(verifySearchInput.value.trim());
        });
        verifySearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performVerification(verifySearchInput.value.trim());
        });
    }

    const inspectionForm = document.getElementById('inspection-form');
    if (inspectionForm) {
        inspectionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const instId = document.getElementById('insp-instrument').value;
            const outcome = document.getElementById('insp-result').value;
            const date = document.getElementById('insp-date').value;
            const inspector = document.getElementById('insp-inspector').value.trim();
            const remarks = document.getElementById('insp-remarks').value.trim();

            const inst = instruments.find(i => i.id === instId);
            if (!inst) return;

            if (outcome === 'Passed') inst.status = 'Verified';
            else if (outcome === 'Conditional') inst.status = 'Pending';
            else if (outcome === 'Failed') inst.status = 'Expired';

            const newInspection = {
                date: date,
                instrumentId: inst.id,
                instrumentName: inst.name,
                inspector: inspector,
                outcome: outcome,
                remarks: remarks || 'No remarks provided.'
            };

            inspections.unshift(newInspection);
            saveData();
            renderDashboard();
            renderRegistry();
            renderInspectionHistory();
            checkDueAlerts();

            showToast(`Inspection logged for ${instId}. Status updated to ${inst.status}.`, 'success');
            inspectionForm.reset();
        });
    }
}

// Due Alerts Calculation & Modal
function checkDueAlerts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today.getTime() + 7 * 86400000);

    const alerts = instruments.filter(inst => {
        if (!inst.dueDate) return false;
        const due = new Date(inst.dueDate);
        due.setHours(0, 0, 0, 0);
        return due <= sevenDaysLater || inst.status === 'Expired';
    });

    const banner = document.getElementById('due-alerts-banner');
    const badge = document.getElementById('alert-count-badge');
    const bannerDesc = document.getElementById('alert-banner-desc');

    if (alerts.length > 0) {
        if (banner) banner.classList.remove('hidden');
        if (badge) badge.textContent = alerts.length;
        if (bannerDesc) bannerDesc.textContent = `${alerts.length} instrument(s) require calibration or have expired due dates within 7 days.`;
    } else {
        if (banner) banner.classList.add('hidden');
    }
}

function openAlertsModal() {
    const modal = document.getElementById('alerts-modal');
    const tbody = document.querySelector('#alerts-modal-table tbody');
    if (!modal || !tbody) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today.getTime() + 7 * 86400000);

    const alerts = instruments.filter(inst => {
        if (!inst.dueDate) return false;
        const due = new Date(inst.dueDate);
        due.setHours(0, 0, 0, 0);
        return due <= sevenDaysLater || inst.status === 'Expired';
    });

    tbody.innerHTML = '';
    if (alerts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;">No calibration due alerts at this time. All instruments compliant.</td></tr>`;
    } else {
        alerts.forEach(inst => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${inst.id}</strong></td>
                <td>${inst.name}</td>
                <td>${inst.owner}</td>
                <td>${inst.dueDate}</td>
                <td><span class="badge ${inst.status.toLowerCase()}">${inst.status}</span></td>
                <td><button type="button" class="text-btn" onclick="closeAlertsModal(); verifyFromRegistry('${inst.id}')">View Details</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    modal.classList.remove('hidden');
}

function closeAlertsModal() {
    const modal = document.getElementById('alerts-modal');
    if (modal) modal.classList.add('hidden');
}

// Render Dashboard
function renderDashboard() {
    const total = instruments.length;
    const verified = instruments.filter(i => i.status === 'Verified').length;
    const pending = instruments.filter(i => i.status === 'Pending').length;
    const expired = instruments.filter(i => i.status === 'Expired').length;

    const elTotal = document.getElementById('stat-total');
    const elVerified = document.getElementById('stat-verified');
    const elPending = document.getElementById('stat-pending');
    const elExpired = document.getElementById('stat-expired');

    if (elTotal) elTotal.textContent = total;
    if (elVerified) elVerified.textContent = verified;
    if (elPending) elPending.textContent = pending;
    if (elExpired) elExpired.textContent = expired;

    // Summary Analytics Box
    const sumTotal = document.getElementById('summary-total');
    const sumCompliance = document.getElementById('summary-compliance');
    const sumLogs = document.getElementById('summary-logs');

    if (sumTotal) sumTotal.textContent = total;
    if (sumCompliance) sumCompliance.textContent = total > 0 ? `${Math.round((verified / total) * 100)}%` : '0%';
    if (sumLogs) sumLogs.textContent = inspections.length;

    // Recent Table
    const tbody = document.querySelector('#recent-instruments-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        instruments.slice(0, 5).forEach(inst => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${inst.id}</strong></td>
                <td>${inst.name}<br><small style="color:var(--text-secondary);">${inst.type}</small></td>
                <td>${inst.owner}</td>
                <td>${inst.calibrationDate || 'N/A'}</td>
                <td>${inst.dueDate || 'N/A'}</td>
                <td><span class="badge ${inst.status.toLowerCase()}">${inst.status}</span></td>
                <td>
                    <button type="button" class="text-btn" onclick="verifyFromRegistry('${inst.id}')">Details</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Render Registry Table
function renderRegistry() {
    const tbody = document.querySelector('#full-registry-table tbody');
    const searchQuery = document.getElementById('registry-search')?.value.toLowerCase() || '';
    const statusQuery = document.getElementById('status-filter')?.value || '';

    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = instruments.filter(inst => {
        const matchesSearch = inst.id.toLowerCase().includes(searchQuery) ||
            inst.name.toLowerCase().includes(searchQuery) ||
            inst.owner.toLowerCase().includes(searchQuery) ||
            inst.type.toLowerCase().includes(searchQuery);
        const matchesStatus = statusQuery === '' || inst.status === statusQuery;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 24px;">No matching instruments found in registry.</td></tr>`;
        return;
    }

    filtered.forEach(inst => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${inst.id}</strong></td>
            <td>${inst.name}<br><small style="color:var(--text-secondary);">${inst.type}</small></td>
            <td>${inst.owner}</td>
            <td>${inst.calibrationDate || 'N/A'}</td>
            <td>${inst.dueDate || 'N/A'}</td>
            <td><span class="badge ${inst.status.toLowerCase()}">${inst.status}</span></td>
            <td>
                <button type="button" class="text-btn" onclick="verifyFromRegistry('${inst.id}')">Verify</button> | 
                <button type="button" class="text-btn" style="color: var(--danger-text);" onclick="deleteInstrument('${inst.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function resetRegistryFilters() {
    const searchEl = document.getElementById('registry-search');
    const filterEl = document.getElementById('status-filter');
    if (searchEl) searchEl.value = '';
    if (filterEl) filterEl.value = '';
    renderRegistry();
    showToast('Filters cleared', 'success');
}

function deleteInstrument(id) {
    if (confirm(`Are you sure you want to delete instrument ${id} from registry?`)) {
        instruments = instruments.filter(i => i.id !== id);
        saveData();
        renderDashboard();
        renderRegistry();
        populateInspectionDropdowns();
        checkDueAlerts();
        showToast(`Instrument ${id} removed.`, 'success');
    }
}

function verifyFromRegistry(id) {
    switchSection('verify-section');
    const searchInput = document.getElementById('verify-search-input');
    if (searchInput) searchInput.value = id;
    performVerification(id);
}

function quickVerifyAction() {
    const val = document.getElementById('quick-verify-input')?.value.trim();
    if (val) {
        switchSection('verify-section');
        const verifyInput = document.getElementById('verify-search-input');
        if (verifyInput) verifyInput.value = val;
        performVerification(val);
    }
}

function quickSelectVerify(id) {
    const verifyInput = document.getElementById('verify-search-input');
    if (verifyInput) verifyInput.value = id;
    performVerification(id);
}

function performVerification(id) {
    const resultCard = document.getElementById('verify-result-card');
    const notFoundCard = document.getElementById('verify-not-found');

    if (!id) {
        showToast('Please enter an Instrument ID to verify.', 'error');
        return;
    }

    const inst = instruments.find(i => i.id.toLowerCase() === id.toLowerCase());

    if (inst) {
        if (notFoundCard) notFoundCard.classList.add('hidden');
        if (resultCard) resultCard.classList.remove('hidden');

        document.getElementById('res-id').textContent = inst.id;
        document.getElementById('res-name').textContent = inst.name;
        document.getElementById('res-type').textContent = inst.type;
        document.getElementById('res-owner').textContent = inst.owner;
        document.getElementById('res-location').textContent = inst.location;
        document.getElementById('res-due').textContent = inst.dueDate || 'N/A';
        document.getElementById('qr-url-text').textContent = `https://metrify.demo/verify?id=${inst.id}`;

        const banner = document.getElementById('banner-status');
        const icon = document.getElementById('banner-icon');
        const title = document.getElementById('result-title');
        const subtitle = document.getElementById('result-subtitle');

        if (inst.status === 'Verified') {
            banner.className = 'verify-status-banner';
            icon.textContent = '✓';
            title.textContent = 'VERIFIED & COMPLIANT';
            title.style.color = 'var(--success-text)';
            subtitle.textContent = 'Official METRIFY digital verification record';
        } else if (inst.status === 'Pending') {
            banner.className = 'verify-status-banner';
            banner.style.background = 'var(--warning-bg)';
            banner.style.borderColor = 'rgba(133, 77, 14, 0.2)';
            icon.textContent = '⚠';
            icon.style.background = 'var(--warning-text)';
            title.textContent = 'PENDING INSPECTION';
            title.style.color = 'var(--warning-text)';
            subtitle.textContent = 'Instrument calibration review is currently pending';
        } else {
            banner.className = 'verify-status-banner error';
            icon.textContent = '✕';
            icon.style.background = 'var(--danger-text)';
            title.textContent = 'CALIBRATION EXPIRED';
            title.style.color = 'var(--danger-text)';
            subtitle.textContent = 'Instrument validity has expired. Recalibration required.';
        }

        showToast(`Instrument ${inst.id} verified successfully.`, 'success');
    } else {
        if (resultCard) resultCard.classList.add('hidden');
        if (notFoundCard) notFoundCard.classList.remove('hidden');
        showToast(`Instrument ID "${id}" not found.`, 'error');
    }
}

// Populate Dropdowns & Timeline
function populateInspectionDropdowns() {
    const select = document.getElementById('insp-instrument');
    const timelineSelect = document.getElementById('timeline-instrument-select');

    if (select) {
        select.innerHTML = '<option value="">Choose instrument...</option>';
        instruments.forEach(inst => {
            const opt = document.createElement('option');
            opt.value = inst.id;
            opt.textContent = `${inst.id} - ${inst.name} (${inst.owner})`;
            select.appendChild(opt);
        });
    }

    if (timelineSelect) {
        const currentVal = timelineSelect.value;
        timelineSelect.innerHTML = '<option value="">Select instrument to view history...</option>';
        instruments.forEach(inst => {
            const opt = document.createElement('option');
            opt.value = inst.id;
            opt.textContent = `${inst.id} - ${inst.name}`;
            if (inst.id === currentVal) opt.selected = true;
            timelineSelect.appendChild(opt);
        });
    }

    const dateInput = document.getElementById('insp-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function renderTimelineForSelected(instId) {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    if (!instId) {
        container.innerHTML = `<div class="empty-state">Select an instrument above to inspect its audit trail and inspection history logs.</div>`;
        return;
    }

    const matchedInst = instruments.find(i => i.id === instId);
    const matchedLogs = inspections.filter(i => i.instrumentId === instId);

    if (matchedLogs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No recorded inspection history logs found for instrument <strong>${instId}</strong>.</p>
                <small style="margin-top:4px; display:block;">Current Status: <span class="badge ${matchedInst ? matchedInst.status.toLowerCase() : 'pending'}">${matchedInst ? matchedInst.status : 'Unknown'}</span></small>
            </div>`;
        return;
    }

    let html = '';
    matchedLogs.forEach(log => {
        html += `
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-header-row">
                        <strong>${log.inspector}</strong>
                        <span class="timeline-date">${log.date}</span>
                    </div>
                    <div class="timeline-body">
                        <span class="badge ${log.outcome.toLowerCase()}">${log.outcome}</span>
                        <p>${log.remarks}</p>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderInspectionHistory() {
    const tbody = document.querySelector('#inspection-history-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (inspections.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">No inspection logs recorded yet.</td></tr>`;
        return;
    }

    inspections.forEach(insp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${insp.date}</td>
            <td><strong>${insp.instrumentId}</strong><br><small style="color:var(--text-secondary);">${insp.instrumentName}</small></td>
            <td>${insp.inspector}</td>
            <td><span class="badge ${insp.outcome.toLowerCase()}">${insp.outcome}</span></td>
            <td>${insp.remarks}</td>
        `;
        tbody.appendChild(tr);
    });
}

// CSV Export Utility
function exportCSVData() {
    if (instruments.length === 0) {
        showToast('No instrument records available to export.', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Instrument ID,Instrument Name,Type,Owner,Location,Status,Calibration Date,Next Due Date,Notes\n";

    instruments.forEach(inst => {
        const row = [
            `"${inst.id}"`,
            `"${inst.name.replace(/"/g, '""')}"`,
            `"${inst.type}"`,
            `"${inst.owner.replace(/"/g, '""')}"`,
            `"${inst.location || 'N/A'}"`,
            `"${inst.status}"`,
            `"${inst.calibrationDate || 'N/A'}"`,
            `"${inst.dueDate || 'N/A'}"`,
            `"${(inst.notes || '').replace(/"/g, '""')}"`
        ];
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Metrify_Instrument_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV export downloaded successfully!', 'success');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : '⚠️'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}