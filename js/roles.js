// Roles manager - organized and defensive

// --------------------------
// Globals & Constants
// --------------------------
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

// --------------------------
// Data constructors & migration
// --------------------------
function createEmptyRoles() {
    return {
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
        content: "", graphic: "" // For Break Week
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

    // Check every role key
    Object.keys(roles).forEach(key => {
        if (key === 'onLeave' || key === 'masterLinks') return;

        // If it's a single string role (like presenter, host, etc.)
        if (typeof roles[key] === 'string' && onLeave.includes(roles[key])) {
            roles[key] = "";
        }

        // If it's a team array (affirmative/negative)
        if (Array.isArray(roles[key])) {
            roles[key] = roles[key].filter(name => !onLeave.includes(name));
        }
    });
}

// --------------------------
// Core UI controls
// --------------------------
function setWeek(idx) {
    if (!currentBatch?.weeks?.[idx]) return;
    currentWeekIdx = idx;
    roles = currentBatch.weeks[idx].roles;

    // Update Header Display
    const display = document.getElementById('current-selection-display');
    if (display) display.innerText = `${currentBatch.id} — Week ${idx + 1} ${idx === 4 ? '(Break Week)' : ''}`;

    // Toggle Visibility for Break Week vs Normal Week
    const isBreakWeek = (idx === 4);
    document.querySelectorAll('section').forEach((sec, i) => {
        // Only hide standard role sections on break week
        if (isBreakWeek && i > 0 && sec.id !== 'break-week-container') {
            sec.style.display = 'none';
        } else if (!isBreakWeek && sec.id === 'break-week-container') {
            sec.style.display = 'none';
        } else {
            sec.style.display = 'block';
        }
    });

    // Update Button Styling
    document.querySelectorAll('.week-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
    });

    refreshAll();
}

function refreshAll() {
    if (!members || members.length === 0) return;
    const isBreakWeek = (currentWeekIdx === 4);

    // Clean up dynamic containers
    const dynamicIds = ['#break-week-container', '#topic-container', '#attendance-container'];
    dynamicIds.forEach(id => document.querySelector(id)?.remove());

    validationCleanup();
    renderParticipantDashboard();

    if (isBreakWeek) {
        renderBreakWeekUI();
    } else {
        renderTopicInput();
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

// --------------------------
// Renderers
// --------------------------
function renderTable() {
    const tbody = document.querySelector('#assignment-table tbody');
    if (!tbody) return;
    const weekTopic = currentBatch?.weeks?.[currentWeekIdx]?.topic || 'No topic set';

    if (currentWeekIdx === 4) {
        tbody.innerHTML = `
        <tr style="background: #f1f3f5">
            <td><strong>Role</strong></td>
            <td colspan="2"><strong>Assignment</strong></td>
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
        tbody.innerHTML = `\n            <tr style="background: #f1f3f5">\n                <td><strong>Topic</strong></td>\n                <td colspan="2"><strong>${weekTopic}</strong></td>\n            </tr>\n            <tr style="background: #e9ecef; font-weight: bold; font-size: 0.8em;">\n                <td>ROLE</td><td>PRIMARY</td><td>BACKUP</td>\n            </tr>\n            <tr><td><strong>Presenter</strong></td><td>${roles.presenter || '-'}</td><td>${roles.backupPresenter || '-'}</td></tr>\n            <tr><td><strong>Host</strong></td><td>${roles.host || '-'}</td><td>${roles.backupHost || '-'}</td></tr>\n            <tr><td><strong>Intro</strong></td><td>${roles.intro || '-'}</td><td>${roles.backupIntro || '-'}</td></tr>\n            <tr><td><strong>Format</strong></td><td>${roles.format || '-'}</td><td>${roles.backupFormat || '-'}</td></tr>\n            <tr><td><strong>Link Sharer</strong></td><td>${roles.linkSharer || '-'}</td><td>${roles.backupLinkSharer || '-'}</td></tr>\n            <tr><td><strong>Reminder</strong></td><td>${roles.reminder || '-'}</td><td>${roles.backupReminder || '-'}</td></tr>\n            <tr><td><strong>Manager</strong></td><td>${roles.manager || '-'}</td><td>${roles.backupManager || '-'}</td></tr>\n            <tr><td><strong>Attendance</strong></td><td>${roles.attendanceTaker || '-'}</td><td>${roles.backupAttendanceTaker || '-'}</td></tr>\n            \n            <tr style="border-top: 2px solid #ddd"><td style="color:green"><strong>✅ Aff Team</strong></td><td colspan="2">${(roles.affirmative || []).join(', ') || '-'}</td></tr>\n            <tr style="font-size:0.85em"><td>Spy Judge</td><td colspan="2">${roles.spyAff || '-'}</td></tr>\n            <tr style="font-size:0.85em"><td>Note-Taker</td><td>${roles.noteAff || '-'}</td><td style="color:#777">${roles.backupNoteAff || '-'}</td></tr>\n            \n            <tr style="border-top: 1px solid #eee"><td style="color:red"><strong>❌ Neg Team</strong></td><td colspan="2">${(roles.negative || []).join(', ') || '-'}</td></tr>\n            <tr style="font-size:0.85em"><td>Spy Judge</td><td colspan="2">${roles.spyNeg || '-'}</td></tr>\n            <tr style="font-size:0.85em"><td>Note-Taker</td><td> ${roles.noteNeg || '-'}</td><td style="color:#777"> ${roles.backupNoteNeg || '-'}</td></tr>\n        `;
    }
}

function renderWeeklyLinkEditor() {
    const container = document.getElementById('weekly-link-container');
    if (!container) return; // Guard against the HTML not being there

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

    // Inject the inputs
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

    // Add listeners
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
        <h3>🏝️ Break Week Coordination</h3>
        <div class="grid-2-col">
            <div class="form-group">
                <label>Content Creator:</label>
                <select id="content-select"></select>
            </div>
            <div class="form-group">
                <label>Graphic Designer:</label>
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
    let container = document.getElementById('topic-container');
    if (!container) {
        container = document.createElement('section');
        container.id = 'topic-container';
        document.querySelector('.control-card')?.after(container);
    }

    container.innerHTML = `
        <h3>📖 Session Topic</h3>
        <input type="text" id="topic-field" placeholder="Enter debate topic..." 
               value="${currentBatch.weeks[currentWeekIdx].topic || ''}">
    `;

    document.getElementById('topic-field').oninput = e => {
        currentBatch.weeks[currentWeekIdx].topic = e.target.value;
        save('batches', batches);
    };
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
    members.filter(m => !m.archived).forEach(m => {
        const isOff = (roles.onLeave || []).includes(m.name);
        const label = document.createElement('label');
        label.className = `status-badge ${isOff ? 'delete-member-btn' : 'status-active'}`;
        label.style.cursor = 'pointer';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !isOff;
        cb.style.display = 'none'; // Hide actual checkbox for badge feel

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
// --------------------------
// Teams & Role helpers
// --------------------------
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
function renderPresenterList() { const sel = document.getElementById('presenter-select'); if (!sel) return; const availableMembers = members.filter(m => !m.archived && !roles.onLeave.includes(m.name)); sel.innerHTML = '<option value="">-- Select Presenter --</option>'; availableMembers.forEach(m => { const opt = document.createElement('option'); opt.value = m.name; opt.textContent = m.name; if (roles.presenter === m.name) opt.selected = true; sel.appendChild(opt); }); sel.onchange = (e) => { roles.presenter = e.target.value; const keys = ['host', 'intro', 'format', 'linkSharer', 'manager', 'spyAff', 'spyNeg', 'noteAff', 'noteNeg']; keys.forEach(k => { if (roles[k] === roles.presenter) roles[k] = ''; }); roles.affirmative = roles.affirmative.filter(n => n !== roles.presenter); roles.negative = roles.negative.filter(n => n !== roles.presenter); refreshAll(); } }

function renderPostSessionReport() {
    let reportSection = document.getElementById('session-report');

    // Create the section if it doesn't exist
    if (!reportSection) {
        reportSection = document.createElement('section');
        reportSection.id = 'session-report';

        // Find where to insert it (before the action buttons)
        const main = document.querySelector('main');
        const actions = document.querySelector('.floating-actions');
        if (actions) {
            main.insertBefore(reportSection, actions);
        } else {
            main.appendChild(reportSection);
        }
    }

    const guestCount = currentBatch.weeks[currentWeekIdx].audienceCount || 0;

    // Use standard classes: 'section' (inherited), 'support-role-row', and dashboard headers
    reportSection.innerHTML = `
        <h3>📊 Post-Session Report</h3>
        <p style="font-size: 0.85rem; color: #666; margin-bottom: 20px;">
            Update this count after the session to calculate the total community impact.
        </p>
        
        <div class="support-role-row" style="border-bottom: none; background: #fcfdfe; border-radius: 10px; padding: 15px;">
            <label><strong>Final Guest Count:</strong></label>
            <div>
                <input type="number" id="guest-count-input" value="${guestCount}" min="0" 
                       style="width: 120px; font-weight: bold; font-size: 1.1rem; border: 2px solid var(--sky-primary); text-align: center;">
            </div>
            <div id="auto-save-status" style="color: var(--success); font-weight: 600; opacity: 0; transition: opacity 0.3s; font-size: 0.9rem;">
                ✓ Count Sync'd
            </div>
        </div>
    `;

    const input = document.getElementById('guest-count-input');
    const status = document.getElementById('auto-save-status');

    input.oninput = (e) => {
        const val = parseInt(e.target.value) || 0;
        currentBatch.weeks[currentWeekIdx].audienceCount = val;

        // Save to storage.js
        save('batches', batches);

        // Update the Attendance Dashboard at the top of the page immediately
        renderParticipantDashboard();

        // Show "Saved" feedback
        status.style.opacity = '1';
        setTimeout(() => { status.style.opacity = '0'; }, 1200);
    };
}
function renderTeamCheckboxes() { const affDiv = document.getElementById('aff-checkboxes'); const negDiv = document.getElementById('neg-checkboxes'); if (!affDiv || !negDiv) return; affDiv.innerHTML = ''; negDiv.innerHTML = ''; const presentMembers = members.filter(m => !roles.onLeave.includes(m.name) && !m.archived); presentMembers.forEach(m => { if (m.name === roles.presenter) return; const isDisabledInAff = roles.negative.includes(m.name); const affCb = createCheckbox(m.name, 'aff', roles.affirmative.includes(m.name), isDisabledInAff); affDiv.appendChild(affCb); const isDisabledInNeg = roles.affirmative.includes(m.name); const negCb = createCheckbox(m.name, 'neg', roles.negative.includes(m.name), isDisabledInNeg); negDiv.appendChild(negCb); }); }

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

    // Filter out members who are on leave or archived
    const availableMembers = members.filter(m => !roles.onLeave.includes(m.name) && !m.archived);

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

// --------------------------
// Batch & Week controls
// --------------------------
function renderBatchSelector() { const sel = document.getElementById('batch-select'); if (!sel) return; sel.innerHTML = ''; batches.forEach(b => { const opt = document.createElement('option'); opt.value = b.id; opt.textContent = `${b.id} ${b.status === 'active' ? '(Active)' : ''}`; if (b.id === currentBatch.id) opt.selected = true; sel.appendChild(opt); }); sel.onchange = (e) => { const selected = batches.find(b => b.id === e.target.value); if (selected) { currentBatch = selected; setWeek(0); } }; }

function setupWeekButtons() { document.querySelectorAll('.week-btn').forEach(btn => btn.onclick = e => setWeek(parseInt(e.target.dataset.week))); }

function checkArchiveStatus() { const isArchive = currentBatch?.status === 'archive'; if (!document.querySelector('main')) return; const inputs = document.querySelector('main').querySelectorAll('select, input, button'); inputs.forEach(el => { if (el.id !== 'batch-select' && el.id !== 'new-batch-btn' && !el.classList.contains('week-btn') && el.id !== 'delete-batch-btn') el.disabled = isArchive; }); document.body.style.backgroundColor = isArchive ? '#e9ecef' : '#ffffff'; }

function getAssignmentInfo(name) { if (!name) return { count: 0, label: '', rolesList: [], hasTask: false }; const tasks = []; const teams = []; Object.entries(roles).forEach(([key, value]) => { if (key === 'onLeave') return; if (key === 'affirmative' || key === 'negative') { if (value.includes(name)) teams.push(key === 'affirmative' ? 'Affirmative Team' : 'Negative Team'); return; } if (value === name) tasks.push(key); }); const firstTaskKey = tasks[0]; const friendlyLabel = ROLE_LABELS[firstTaskKey] || firstTaskKey || ''; return { count: tasks.length, label: friendlyLabel, rolesList: tasks, teamList: teams, hasTask: tasks.length > 0 }; }

// --------------------------
// Button events (safe)
// --------------------------
document.getElementById('new-batch-btn')?.addEventListener('click', async () => { const name = prompt('Enter Batch Name:'); if (name) { await createNewBatch(name); window.location.reload(); } });

document.getElementById('delete-batch-btn')?.addEventListener('click', () => { if (batches.length <= 1) return alert('Cannot delete the last batch.'); if (confirm(`Delete "${currentBatch.id}"?`)) { batches = batches.filter(b => b.id !== currentBatch.id); if (!batches.some(b => b.status === 'active')) batches[batches.length - 1].status = 'active'; save('batches', batches); window.location.reload(); } });

document.getElementById('copy-roles')?.addEventListener('click', () => {
    const weekData = currentBatch.weeks[currentWeekIdx];
    let text = `🚀 ${currentBatch.id} | Week ${currentWeekIdx + 1}\n`;

    if (currentWeekIdx === 4) {
        // Specialized Break Week Copy Format
        text += `🏝️ BREAK WEEK ASSIGNMENTS\n`;
        text += `• Content: ${roles.content || '-'}\n`;
        text += `• Graphic: ${roles.graphic || '-'}\n`;
    } else {
        // Standard Week Copy Format
        const topic = weekData.topic || 'No topic set';
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
        text += `\n Spy Judge (Affirmative): ${roles.spyAff || '-'} | Note-taker (Aff): ${roles.noteAff || '-'} (Backup: ${roles.backupNoteAff || '-'})\n`;
        text += ` Spy Judge (Negative): ${roles.spyNeg || '-'} | Note-taker (Neg): ${roles.noteNeg || '-'} (Backup: ${roles.backupNoteNeg || '-'})\n\n`;

        // Add Master Links if they exist
        // if (roles.masterLinks?.zoomLink) {
        //     text += `\n📍 Meeting Link: ${roles.masterLinks.zoomLink}`;
        // }
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

// --------------------------
// App start
// --------------------------
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