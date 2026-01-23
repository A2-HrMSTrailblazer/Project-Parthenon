// Globals & Constants
let members = [];
let batches = [];
let currentBatch = null;
let currentWeekIdx = 0;
let roles = null;

const ROLE_LABELS = {
    presenter: "Main Presenter",
    backupPresenter: "Backup Presenter",
    host: "Host / Facilitator",
    backupHost: "Backup Host",
    intro: "Intro Presenter",
    backupIntro: "Backup Intro",
    format: "Format Explainer",
    backupFormat: "Backup Format",
    linkSharer: "Link Dropper",
    backupLinkSharer: "Backup Link Dropper",
    reminder: "Weekly Reminder",
    backupReminder: "Backup Reminder",
    manager: "Weekly Manager",
    backupManager: "Backup Manager",
    attendanceTaker: "Attendance Taker",
    backupAttendanceTaker: "Backup Attendance",
    spyAff: "Spy Judge (Aff)",
    noteAff: "Note-taker (Aff)",
    backupNoteAff: "Backup Note-taker (Aff)",
    spyNeg: "Spy Judge (Neg)",
    noteNeg: "Note-taker (Neg)",
    backupNoteNeg: "Backup Note-taker (Neg)",
    content: "Break Week Content",
    graphic: "Break Week Graphic"
};

// Data constructors & migration
function createEmptyRoles() {
    return {
        date: "",
        presenter: "", backupPresenter: "",
        host: "", backupHost: "",
        intro: "", backupIntro: "",
        format: "", backupFormat: "",
        linkSharer: "", backupLinkSharer: "",
        manager: "", backupManager: "",
        reminder: "", backupReminder: "",
        attendanceTaker: "HR", backupAttendanceTaker: "",
        affirmative: [],
        spyAff: "", noteAff: "", backupNoteAff: "",
        negative: [],
        spyNeg: "", noteNeg: "", backupNoteNeg: "",
        masterLinks: {
            zoomLink: "", membershipForm: "", topicSlides: "",
            introSlides: "", formatSlides: "", zoomBackground: "",
            feedbackForm: "", sotdLink: ""
        },
        onLeave: [],
        content: "", graphic: ""
    };
}

async function migrateData() {
    let needsSave = false;
    batches.forEach(batch => {
        if (!batch.weeks) return;
        batch.weeks.forEach(week => {
            if (!week.roles) { week.roles = createEmptyRoles(); needsSave = true; }
            if (!week.roles.onLeave) { week.roles.onLeave = []; needsSave = true; }

            const empty = createEmptyRoles();
            Object.keys(empty).forEach(key => {
                if (week.roles[key] === undefined) {
                    week.roles[key] = empty[key];
                    needsSave = true;
                }
            });
        });
    });
    if (needsSave) await save("batches", batches);
}

async function createNewBatch(name) {
    const newBatch = {
        id: name,
        status: "active",
        weeks: Array.from({ length: 5 }, () => ({ topic: "", audienceCount: 0, roles: createEmptyRoles() }))
    };
    batches.forEach(b => b.status = "archive");
    batches.push(newBatch);
    await save("batches", batches);
    return newBatch;
}

async function initializeData() {
    if (batches.length === 0) await createNewBatch("Batch 1");
    await migrateData();
    currentBatch = batches.find(b => b.status === "active") || batches[batches.length - 1];
    setWeek(0);
}

function validationCleanup() {
    const onLeave = roles.onLeave || [];

    Object.keys(roles).forEach(key => {
        if (key === 'onLeave' || key === 'masterLinks') return;

        if (typeof roles[key] === 'string' && onLeave.includes(roles[key])) {
            roles[key] = "";
        }

        if (Array.isArray(roles[key])) {
            roles[key] = roles[key].filter(name => !onLeave.includes(name));
        }
    });
}

// Core UI controls
function setWeek(idx) {
    if (!currentBatch?.weeks?.[idx]) return;
    currentWeekIdx = idx;
    roles = currentBatch.weeks[idx].roles;

    const display = document.getElementById('current-selection-display');
    if (display) display.innerText = `${currentBatch.id} — Week ${idx + 1} ${idx === 4 ? '(Break Week)' : ''}`;

    const isBreakWeek = (idx === 4);
    document.querySelectorAll('section').forEach((sec) => {
        // If we are in break week, hide everything except the break container AND the summary
        if (isBreakWeek) {
            if (sec.id === 'break-week-container' || sec.id === 'summary-section' || sec.classList.contains('control-card')) {
                sec.style.display = 'block';
            } else {
                sec.style.display = 'none';
            }
        } else {
            // Standard week logic: Hide break container, show others
            if (sec.id === 'break-week-container') {
                sec.style.display = 'none';
            } else {
                sec.style.display = 'block';
            }
        }
    });

    document.querySelectorAll('.week-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
    });

    refreshAll();
}

function refreshAll() {
    if (!members || members.length === 0) return;
    const isBreakWeek = (currentWeekIdx === 4);

    const dynamicIds = ['#break-week-container', '#topic-container', '#attendance-container', '#session-report'];
    dynamicIds.forEach(id => document.querySelector(id)?.remove());

    validationCleanup();
    renderParticipantDashboard();
    renderTopicInput();

    if (isBreakWeek) {
        renderBreakWeekUI();
    } else {
        renderAttendanceToggles();
        renderPresenterList();
        renderTeamCheckboxes();
        updateSubRoleDropdowns();
        renderSupportRoles();
        renderWeeklyLinkEditor();
        renderPostSessionReport();
    }

    renderTable();
    checkArchiveStatus();
}

// Renderers
function renderTable() {
    const tbody = document.querySelector('#assignment-table tbody');
    if (!tbody) return;

    const weekObj = currentBatch?.weeks?.[currentWeekIdx];
    const roles = weekObj.roles;
    const weekTopic = weekObj?.topic || 'No topic set';
    const weekDate = roles?.date || "";

    if (currentWeekIdx === 4) {
        // --- Break Week View ---
        tbody.innerHTML = `
            <tr class="break-week-header">
                <td style="color: var(--sky-deep)"><strong>Break Week</strong></td>
                <td colspan="2"><strong>${weekDate}</strong></td>
            </tr>
            <tr>
                <td><strong>Content</strong></td>
                <td colspan="2">${roles.content || '-'}</td>
            </tr>
            <tr>
                <td><strong>Graphic</strong></td>
                <td colspan="2">${roles.graphic || '-'}</td>
            </tr>
        `;
    } else {
        // --- Standard Session View ---
        tbody.innerHTML = `
            <tr style="background: var(--sky-light)">
                <td style="color: var(--sky-deep)"><strong>Session</strong></td>
                <td colspan="2">${weekTopic}</td>
            </tr>
            <tr style="background: var(--sky-light)">
                <td style="color: var(--sky-deep)"><strong>Date</strong></td>
                <td colspan="2">${weekDate}</td>
            </tr>
            <tr style="background: #f8f9fa; font-weight: bold; font-size: 0.75rem; color: #666;">
                <td>ROLE</td><td>PRIMARY</td><td>BACKUP</td>
            </tr>
            <tr><td><strong>Presenter</strong></td><td>${roles.presenter || '-'}</td><td>${roles.backupPresenter || '-'}</td></tr>
            <tr><td><strong>Host</strong></td><td>${roles.host || '-'}</td><td>${roles.backupHost || '-'}</td></tr>
            <tr><td><strong>Intro</strong></td><td>${roles.intro || '-'}</td><td>${roles.backupIntro || '-'}</td></tr>
            <tr><td><strong>Format</strong></td><td>${roles.format || '-'}</td><td>${roles.backupFormat || '-'}</td></tr>
            <tr><td><strong>Link Sharer</strong></td><td>${roles.linkSharer || '-'}</td><td>${roles.backupLinkSharer || '-'}</td></tr>
            <tr><td><strong>Reminder</strong></td><td>${roles.reminder || '-'}</td><td>${roles.backupReminder || '-'}</td></tr>
            <tr><td><strong>Manager</strong></td><td>${roles.manager || '-'}</td><td>${roles.backupManager || '-'}</td></tr>
            <tr><td><strong>Attendance</strong></td><td>${roles.attendanceTaker || '-'}</td><td>${roles.backupAttendanceTaker || '-'}</td></tr>
            
            <tr style="border-top: 2px solid var(--border-light)">
                <td style="color: var(--success)"><strong>✅ Aff Team</strong></td>
                <td colspan="2">${(roles.affirmative || []).join(', ') || '-'}</td>
            </tr>
            <tr style="font-size:0.85em; color: #555;">
                <td><i>Sub-roles</i></td>
                <td colspan="2">Spy: ${roles.spyAff || '-'} | Notes: ${roles.noteAff || '-'}</td>
            </tr>
            
            <tr style="border-top: 1px solid var(--border-light)">
                <td style="color: var(--danger)"><strong>❌ Neg Team</strong></td>
                <td colspan="2">${(roles.negative || []).join(', ') || '-'}</td>
            </tr>
            <tr style="font-size:0.85em; color: #555;">
                <td><i>Sub-roles</i></td>
                <td colspan="2">Spy: ${roles.spyNeg || '-'} | Notes: ${roles.noteNeg || '-'}</td>
            </tr>
        `;
    }
}

function renderWeeklyLinkEditor() {
    const container = document.getElementById('weekly-link-container');
    if (!container) return;

    if (!roles.masterLinks) roles.masterLinks = createEmptyRoles().masterLinks;
    const m = roles.masterLinks;

    const linkMap = [
        { key: "zoomLink", label: "Meeting Link (Zoom/G-Meet)" },
        { key: "membershipForm", label: "Membership Form Link" },
        { key: "topicSlides", label: "Topic Presentation Slides" },
        { key: "introSlides", label: "Introduction Slides" },
        { key: "formatSlides", label: "Debate Format Slides" },
        { key: "zoomBackground", label: "Zoom Background Graphics" },
        { key: "feedbackForm", label: "Feedback Form Link" },
        { key: "sotdLink", label: "SOTD Link (Canva)" }
    ];

    container.innerHTML = linkMap.map(link => `
        <div style="margin-bottom: 10px;">
            <label style="font-size: 0.8em; font-weight: bold; color: #856404;">${link.label}</label><br>
            <input type="text" 
                   class="m-link" 
                   data-key="${link.key}" 
                   value="${m[link.key] || ''}" 
                   placeholder="https://..." 
                   style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
    `).join('');

    container.querySelectorAll('.m-link').forEach(input => {
        input.onchange = async (e) => {
            roles.masterLinks[e.target.dataset.key] = e.target.value;
            await save('batches', batches);
            console.log("Link saved:", e.target.dataset.key);
        };
    });
}

window.deleteWeeklyLink = async (i) => {
    if (!currentBatch?.weeks?.[currentWeekIdx]?.links) return;
    currentBatch.weeks[currentWeekIdx].links.splice(i, 1);
    await save('batches', batches);
    refreshAll();
};

function renderBreakWeekUI() {
    let container = document.getElementById('break-week-container');
    if (!container) {
        container = document.createElement('section');
        container.id = 'break-week-container';
        document.querySelector('.control-card')?.after(container);
    }
    container.innerHTML = `
        <h3>🏝️ Break Week Assignment</h3>
        <div class="grid-2-col">
            <div class="form-group">
                <label>Content:</label>
                <select id="content-select"></select>
            </div>
            <div class="form-group">
                <label>Graphic:</label>
                <select id="graphic-select"></select>
            </div>
        </div>
    `;
    setupDropdown('content-select', 'content', 'graphic');
    setupDropdown('graphic-select', 'graphic', 'content');
}

function setupDropdown(elementId, roleKey, otherRoleKey) {
    const sel = document.getElementById(elementId);
    if (!sel) return;
    const availableMembers = members.filter(m => !m.archived);
    sel.innerHTML = '<option value="">-- Select Member --</option>';
    availableMembers.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = m.name;
        if (m.name === roles[otherRoleKey] && m.name !== '') opt.disabled = true;
        if (m.name === roles[roleKey]) opt.selected = true;
        sel.appendChild(opt);
    });
    sel.onchange = async (e) => {
        roles[roleKey] = e.target.value;
        await save('batches', batches);
        refreshAll();
    };
}

function renderTopicInput() {
    // 1. Handle Container
    let container = document.getElementById('topic-container');
    if (!container) {
        container = document.createElement('section');
        container.id = 'topic-container';
        document.querySelector('.control-card')?.after(container);
    }

    const isBreakWeek = (currentWeekIdx === 4);
    const labelText = isBreakWeek ? "Break Notes (Optional)" : "Debate Topic";
    const placeholderText = isBreakWeek ? "Enter notes..." : "Enter topic...";
    const week = currentBatch.weeks[currentWeekIdx];

    // 2. Render HTML
    container.innerHTML = `
        <h3>📖 Session Details</h3>
        <div class="grid-2-col">
            <div class="form-group date-group">
                <label style="font-size: 0.8rem; font-weight: bold; color: var(--sky-deep);">
                    ${isBreakWeek ? 'Break Start Date' : 'Session Date'}
                </label>
                <input style="margin-top: 5px; border: 2px solid var(--sky-light);"
                       type="date"
                       id="date-field"
                       value="${week.roles.date || ''}" />
            </div>
            <div class="form-group">
                <label style="font-size: 0.8rem; font-weight: bold; color: var(--sky-deep);">
                    ${labelText}
                </label>
                <input type="text" id="topic-field" placeholder="${placeholderText}" 
                       value="${week.topic || ''}" style="margin-top: 5px;">
            </div>
        </div>
    `;

    // 3. Attach Listeners correctly
    const dateInput = document.getElementById('date-field');
    const topicInput = document.getElementById('topic-field');

    if (dateInput) {
        dateInput.onchange = async (e) => {
            week.roles.date = e.target.value;
            await save('batches', batches);
            renderTable(); // Update table instantly
        };
    }

    if (topicInput) {
        topicInput.oninput = async (e) => {
            week.topic = e.target.value;
            await save('batches', batches);
            renderTable(); // Update table instantly
        };
    }
}

function renderParticipantDashboard() { const totalMembers = members.length; const facilitatorsPresent = totalMembers - (roles?.onLeave?.length || 0); const guestCount = currentBatch.weeks[currentWeekIdx].audienceCount || 0; const totalAttendance = facilitatorsPresent + guestCount; let dashboard = document.getElementById('participant-dashboard'); if (!dashboard) { dashboard = document.createElement('div'); dashboard.id = 'participant-dashboard'; document.querySelector('main')?.prepend(dashboard); } dashboard.innerHTML = `\n        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 25px;">\n            <div style="background: #e3f2fd; border: 1px solid #2196f3; padding: 12px; border-radius: 8px; text-align: center;">\n                <span style="font-size: 0.75em; color: #0d47a1; font-weight: bold; text-transform: uppercase;">Total Attendance</span>\n                <div style="font-size: 1.6em; font-weight: bold; color: #0d47a1;">${totalAttendance}</div>\n            </div>\n            <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 12px; border-radius: 8px; text-align: center;">\n                <span style="font-size: 0.75em; color: #495057; font-weight: bold; text-transform: uppercase;">Facilitators</span>\n                <div style="font-size: 1.6em; font-weight: bold;">${facilitatorsPresent}</div>\n            </div>\n            <div style="background: #fff3e0; border: 1px solid #ffe0b2; padding: 12px; border-radius: 8px; text-align: center;">\n                <span style="font-size: 0.75em; color: #e65100; font-weight: bold; text-transform: uppercase;">Guest Audience</span>\n                <div style="font-size: 1.6em; font-weight: bold; color: #e65100;">${guestCount}</div>\n            </div>\n        </div>\n    `; }

function renderAttendanceToggles() {
    let container = document.getElementById('attendance-container');
    if (!container) {
        container = document.createElement('section');
        container.id = 'attendance-container';
        document.getElementById('topic-container')?.after(container);
    }

    const assignedNames = getAllAssignedNames();
    container.innerHTML = `
        <h3>🕒 Availability (Week ${currentWeekIdx + 1})</h3>
        <div class="checkbox-grid" id="attendance-grid"></div>
    `;

    const grid = document.getElementById('attendance-grid');
    getAvailableMembersForCurrentWeek().forEach(m => {
        const isOff = (roles.onLeave || []).includes(m.name);
        const label = document.createElement('label');
        label.className = `status-badge ${isOff ? 'delete-member-btn' : 'status-active'}`;
        label.style.cursor = 'pointer';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !isOff;
        cb.style.display = 'none';

        cb.onchange = async () => {
            if (!cb.checked) {
                if (!roles.onLeave.includes(m.name)) roles.onLeave.push(m.name);
            } else {
                roles.onLeave = roles.onLeave.filter(n => n !== m.name);
            }
            await save('batches', batches);
            refreshAll();
        };

        label.append(cb, `${m.name}${assignedNames.includes(m.name) ? ' 👤' : ''}`);
        grid.appendChild(label);
    });
}

// Teams & Role helpers
function getAllAssignedNames() {
    const list = [];
    if (!roles) return list;
    Object.entries(roles).forEach(([k, v]) => {
        if (k === 'onLeave' || k === 'masterLinks') return;
        if (Array.isArray(v)) list.push(...v);
        else if (v && typeof v === 'string') list.push(v);
    });
    return [...new Set(list)];
}

function renderPresenterList() { const sel = document.getElementById('presenter-select'); if (!sel) return; const availableMembers = getAvailableMembersForCurrentWeek().filter(m => !roles.onLeave.includes(m.name)); sel.innerHTML = '<option value="">-- Select Presenter --</option>'; availableMembers.forEach(m => { const opt = document.createElement('option'); opt.value = m.name; opt.textContent = m.name; if (roles.presenter === m.name) opt.selected = true; sel.appendChild(opt); }); sel.onchange = (e) => { roles.presenter = e.target.value; const keys = ['host', 'intro', 'format', 'linkSharer', 'manager', 'spyAff', 'spyNeg', 'noteAff', 'noteNeg']; keys.forEach(k => { if (roles[k] === roles.presenter) roles[k] = ''; }); roles.affirmative = roles.affirmative.filter(n => n !== roles.presenter); roles.negative = roles.negative.filter(n => n !== roles.presenter); refreshAll(); } }

function renderPostSessionReport() {
    let reportSection = document.getElementById('session-report');

    if (!reportSection) {
        reportSection = document.createElement('section');
        reportSection.id = 'session-report';

        const main = document.querySelector('main');
        const actions = document.querySelector('.floating-actions');
        if (actions) {
            main.insertBefore(reportSection, actions);
        } else {
            main.appendChild(reportSection);
        }
    }

    const guestCount = currentBatch.weeks[currentWeekIdx].audienceCount || 0;

    reportSection.innerHTML = `
        <h3>📊 Post-Session Report</h3>
        <div class="support-role-row" style="border-bottom: none; background: #fcfdfe; border-radius: 10px; padding: 15px;">
            <label><strong>Final Guest Count:</strong></label>
            <div>
                <input type="number" id="guest-count-input" value="${guestCount}" min="0" 
                       style="width: 120px; font-weight: bold; font-size: 1.1rem; border: 2px solid var(--sky-primary); text-align: center;">
            </div>
            <div id="auto-save-status" style="color: var(--success); font-weight: 600; opacity: 0; transition: opacity 0.3s; font-size: 0.9rem;">
                Saved
            </div>
        </div>
    `;

    const input = document.getElementById('guest-count-input');
    const status = document.getElementById('auto-save-status');

    input.oninput = (e) => {
        const val = parseInt(e.target.value) || 0;
        currentBatch.weeks[currentWeekIdx].audienceCount = val;

        save('batches', batches);

        renderParticipantDashboard();

        status.style.opacity = '1';
        setTimeout(() => { status.style.opacity = '0'; }, 1200);
    };
}

function getAvailableMembersForCurrentWeek() {
    const assignedInWeek = getAllAssignedNames();

    return members.filter(m => {
        return !m.archived || assignedInWeek.includes(m.name);
    });
}

function renderTeamCheckboxes() { const affDiv = document.getElementById('aff-checkboxes'); const negDiv = document.getElementById('neg-checkboxes'); if (!affDiv || !negDiv) return; affDiv.innerHTML = ''; negDiv.innerHTML = ''; const presentMembers = getAvailableMembersForCurrentWeek().filter(m => !roles.onLeave.includes(m.name)); presentMembers.forEach(m => { if (m.name === roles.presenter) return; const isDisabledInAff = roles.negative.includes(m.name); const affCb = createCheckbox(m.name, 'aff', roles.affirmative.includes(m.name), isDisabledInAff); affDiv.appendChild(affCb); const isDisabledInNeg = roles.affirmative.includes(m.name); const negCb = createCheckbox(m.name, 'neg', roles.negative.includes(m.name), isDisabledInNeg); negDiv.appendChild(negCb); }); }

function createCheckbox(name, team, isChecked, isDisabled) { const label = document.createElement('label'); const info = getAssignmentInfo(name); label.style.display = 'block'; label.style.padding = '6px 10px'; label.style.margin = '4px 0'; label.style.borderRadius = '6px'; label.style.fontSize = '0.85em'; label.style.transition = 'all 0.2s ease'; const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = name; cb.checked = isChecked; cb.disabled = isDisabled; if (isDisabled) label.style.color = '#bbb'; cb.onchange = async () => { if (team === 'aff') { if (cb.checked) roles.negative = roles.negative.filter(n => n !== name); roles.affirmative = [...document.querySelectorAll('#aff-checkboxes input:checked')].map(i => i.value); } else { if (cb.checked) roles.affirmative = roles.affirmative.filter(n => n !== name); roles.negative = [...document.querySelectorAll('#neg-checkboxes input:checked')].map(i => i.value); } await save('batches', batches); refreshAll(); }; label.appendChild(cb); label.append(` ${name}`); return label; }

function renderSupportRoles() {
    const mapping = {
        'host-select': 'host',
        'intro-select': 'intro',
        'format-select': 'format',
        'link-select': 'linkSharer',
        'manager-select': 'manager',
        'reminder-select': 'reminder',
        'attendance-select': 'attendanceTaker',
        'backup-presenter-select': 'backupPresenter',
        'backup-host-select': 'backupHost',
        'backup-intro-select': 'backupIntro',
        'backup-format-select': 'backupFormat',
        'backup-link-select': 'backupLinkSharer',
        'backup-manager-select': 'backupManager',
        'backup-reminder-select': 'backupReminder',
        'backup-attendance-select': 'backupAttendanceTaker'
    };

    const availableMembers = getAvailableMembersForCurrentWeek().filter(m => !roles.onLeave.includes(m.name));

    Object.entries(mapping).forEach(([id, key]) => {
        const sel = document.getElementById(id);
        if (!sel) return;

        sel.innerHTML = '<option value="">-- Select --</option>';
        availableMembers.forEach(m => {
            const info = getAssignmentInfo(m.name);
            const opt = document.createElement('option');
            opt.value = m.name;

            const isAlreadyAssignedElseWhere = info.hasTask && roles[key] !== m.name;
            opt.textContent = isAlreadyAssignedElseWhere ? `${m.name} (Assigned: ${info.label})` : m.name;

            if (roles[key] === m.name) opt.selected = true;
            sel.appendChild(opt);
        });

        sel.onchange = async (e) => {
            roles[key] = e.target.value;
            await save('batches', batches);
            refreshAll();
        };
    });
}
function updateSubRoleDropdowns() { const config = [{ id: 'spy-aff', list: roles.affirmative, curr: 'spyAff' }, { id: 'note-aff', list: roles.affirmative, curr: 'noteAff' }, { id: 'backup-note-aff', list: roles.affirmative, curr: 'backupNoteAff' }, { id: 'spy-neg', list: roles.negative, curr: 'spyNeg' }, { id: 'note-neg', list: roles.negative, curr: 'noteNeg' }, { id: 'backup-note-neg', list: roles.negative, curr: 'backupNoteNeg' }]; config.forEach(cfg => { const sel = document.getElementById(cfg.id); if (!sel) return; sel.innerHTML = '<option value="">-- Select --</option>'; (cfg.list || []).forEach(name => { const info = getAssignmentInfo(name); const opt = document.createElement('option'); opt.value = name; const otherSubRoles = info.rolesList.filter(r => r !== cfg.curr); const label = otherSubRoles.length > 0 ? `${name} (${ROLE_LABELS[otherSubRoles[0]] || otherSubRoles[0]})` : name; opt.textContent = label; if (name === roles[cfg.curr]) opt.selected = true; sel.appendChild(opt); }); sel.onchange = async (e) => { roles[cfg.curr] = e.target.value; await save('batches', batches); refreshAll(); }; }); }

// Batch & Week controls
function renderBatchSelector() { const sel = document.getElementById('batch-select'); if (!sel) return; sel.innerHTML = ''; batches.forEach(b => { const opt = document.createElement('option'); opt.value = b.id; opt.textContent = `${b.id} ${b.status === 'active' ? '(Active)' : ''}`; if (b.id === currentBatch.id) opt.selected = true; sel.appendChild(opt); }); sel.onchange = (e) => { const selected = batches.find(b => b.id === e.target.value); if (selected) { currentBatch = selected; setWeek(0); } }; }

function setupWeekButtons() { document.querySelectorAll('.week-btn').forEach(btn => btn.onclick = e => setWeek(parseInt(e.target.dataset.week))); }

function checkArchiveStatus() { const isArchive = currentBatch?.status === 'archive'; if (!document.querySelector('main')) return; const inputs = document.querySelector('main').querySelectorAll('select, input, button'); inputs.forEach(el => { if (el.id !== 'batch-select' && el.id !== 'new-batch-btn' && !el.classList.contains('week-btn') && el.id !== 'delete-batch-btn') el.disabled = isArchive; }); document.body.style.backgroundColor = isArchive ? '#e9ecef' : '#ffffff'; }

function getAssignmentInfo(name) { if (!name) return { count: 0, label: '', rolesList: [], hasTask: false }; const tasks = []; const teams = []; Object.entries(roles).forEach(([key, value]) => { if (key === 'onLeave') return; if (key === 'affirmative' || key === 'negative') { if (value.includes(name)) teams.push(key === 'affirmative' ? 'Affirmative Team' : 'Negative Team'); return; } if (value === name) tasks.push(key); }); const firstTaskKey = tasks[0]; const friendlyLabel = ROLE_LABELS[firstTaskKey] || firstTaskKey || ''; return { count: tasks.length, label: friendlyLabel, rolesList: tasks, teamList: teams, hasTask: tasks.length > 0 }; }

// Button events (safe)
document.getElementById('new-batch-btn')?.addEventListener('click', async () => { const name = prompt('Enter Batch Name:'); if (name) { await createNewBatch(name); window.location.reload(); } });

document.getElementById('delete-batch-btn')?.addEventListener('click', async () => {
    if (batches.length <= 1) return alert('Cannot delete the last batch.');

    if (confirm(`Are you sure you want to delete "${currentBatch.id}"? This cannot be undone.`)) {
        const deletedId = currentBatch.id;
        batches = batches.filter(b => b.id !== deletedId);

        if (!batches.some(b => b.status === 'active')) {
            batches[batches.length - 1].status = 'active';
        }

        currentBatch = batches.find(b => b.status === 'active');

        await save('batches', batches);

        window.location.reload();
    }
});
document.getElementById('copy-roles')?.addEventListener('click', () => {
    const weekData = currentBatch.weeks[currentWeekIdx];
    const weekDate = weekData.roles.date || 'TBD';
    const topic = weekData.topic || 'No topic set';

    let text = `🚀 ${currentBatch.id} | Week ${currentWeekIdx + 1}\n`;
    text += `📅 Date: ${weekDate}\n`; // Now includes the date in the copy string

    if (currentWeekIdx === 4) {
        text += `🏝️ BREAK WEEK ASSIGNMENTS\n`;
        text += `• Content: ${roles.content || '-'}\n`;
        text += `• Graphic: ${roles.graphic || '-'}\n`;
    } else {
        const aff = (roles.affirmative || []).join(', ') || '-';
        const neg = (roles.negative || []).join(', ') || '-';

        text += `📌 Topic: ${topic}\n\n`;
        text += `🎤 Presenter: ${roles.presenter || '-'} (Backup: ${roles.backupPresenter || '-'})\n`;
        text += `🎙️ Host: ${roles.host || '-'} (Backup: ${roles.backupHost || '-'})\n`;
        text += `👋 Intro: ${roles.intro || '-'} (Backup: ${roles.backupIntro || '-'})\n`;
        text += `📋 Format: ${roles.format || '-'} (Backup: ${roles.backupFormat || '-'})\n`;
        text += `🔗 Links: ${roles.linkSharer || '-'} (Backup: ${roles.backupLinkSharer || '-'})\n`;
        text += `⚙️ Manager: ${roles.manager || '-'} (Backup: ${roles.backupManager || '-'})\n\n`;
        text += `✅ Affirmative Team: ${aff}\n`;
        text += `❌ Negative Team: ${neg}\n`;
        text += `\n Spy Judge (Aff): ${roles.spyAff || '-'} | Note-taker (Aff): ${roles.noteAff || '-'}\n`;
        text += ` Spy Judge (Neg): ${roles.spyNeg || '-'} | Note-taker (Neg): ${roles.noteNeg || '-'}\n\n`;
    }

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => alert('Assignments copied to clipboard!'));
    } else {
        prompt('Copy these assignments:', text);
    }
});

document.getElementById('save-roles')?.addEventListener('click', async () => {
    const btn = document.getElementById('save-roles');
    btn.innerText = '⌛ Saving...';
    await save('batches', batches);
    btn.innerText = '💾 Save Assignments';
    alert('Success: All assignments synced to cloud.');
});
document.getElementById('reset-roles')?.addEventListener('click', () => { if (confirm('Reset assignments for this week?')) { currentBatch.weeks[currentWeekIdx].roles = createEmptyRoles(); roles = currentBatch.weeks[currentWeekIdx].roles; save('batches', batches); refreshAll(); } });

// App start
async function init() {
    const main = document.querySelector('main');
    if (main) main.style.opacity = '0.5';

    members = await load('members') || [];
    batches = await load('batches') || [];

    if (batches.length === 0) {
        const newBatch = {
            id: "Batch 1",
            status: "active",
            weeks: Array.from({ length: 5 }, () => ({ topic: "", audienceCount: 0, roles: createEmptyRoles() }))
        };
        batches.push(newBatch);
        await save("batches", batches);
    }

    currentBatch = batches.find(b => b.status === "active") || batches[batches.length - 1];

    setupWeekButtons();
    renderBatchSelector();
    setWeek(0);

    if (main) main.style.opacity = '1';
}

init();