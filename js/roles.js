/**
 * GLOBAL STATE
 * Initialized as empty; populated by the async init() function.
 */
let members = [];
let batches = [];
let currentBatch;
let currentWeekIdx = 0;
let roles;
const ROLE_LABELS = {
    presenter: "Presenter",
    host: "Host",
    intro: "Introducer",
    format: "Format Manager",
    linkSharer: "Link Sharer",
    manager: "Weekly Manager",
    spyAff: "Spy Judge (Aff)",
    noteAff: "Note-taker (Aff)",
    spyNeg: "Spy Judge (Neg)",
    noteNeg: "Note-taker (Neg)",
    content: "Content Creator",
    graphic: "Graphic Designer",
    backupPresenter: "Backup Presenter",
    backupHost: "Backup Host",
    backupIntro: "Backup Intro",
    backupFormat: "Backup Format",
    backupLinkSharer: "Backup Link Sharer",
    backupManager: "Backup Weekly Manager",
    backupSpyAff: "Backup Spy Judge (Aff)",
    backupNoteAff: "Backup Note-taker (Aff)",
    backupSpyNeg: "Backup Spy Judge (Neg)",
    backupNoteNeg: "Backup Note-taker (Neg)"
};

// --- INITIALIZATION ---

async function migrateData() {
    let needsSave = false;
    batches.forEach(batch => {
        if (batch.weeks) {
            batch.weeks.forEach(week => {
                if (!week.roles) {
                    week.roles = createEmptyRoles();
                    needsSave = true;
                }

                if (!week.roles.onLeave) {
                    week.roles.onLeave = [];
                    needsSave = true;
                }

                const empty = createEmptyRoles();
                Object.keys(empty).forEach(key => {
                    if (week.roles[key] === undefined) {
                        week.roles[key] = empty[key];
                        needsSave = true;
                    }
                });
            });
        }
    });
    if (needsSave) await save("batches", batches);
}

// Initialization to call the migration
async function initializeData() {
    // If no batches exist, create the first one
    if (batches.length === 0) {
        await createNewBatch("Batch 1");
    }

    // Fix old data structures immediately
    await migrateData();

    // Set active batch
    currentBatch = batches.find(b => b.status === "active") || batches[batches.length - 1];
    setWeek(0);
}

async function createNewBatch(name) {
    const newBatch = {
        id: name,
        status: "active",
        weeks: Array.from({ length: 5 }, () => ({
            topic: "",
            audienceCount: 0,
            roles: createEmptyRoles()
        }))
    };
    // Archive previous batches
    batches.forEach(b => b.status = "archive");
    batches.push(newBatch);
    await save("batches", batches);
    return newBatch;
}

function createEmptyRoles() {
    return {
        presenter: "", affirmative: [], negative: [],
        spyAff: "", spyNeg: "", noteAff: "", noteNeg: "",
        host: "", intro: "", format: "", linkSharer: "", manager: "",
        content: "", graphic: "",
        backupPresenter: "", backupHost: "", backupManager: "",
        backupLinkSharer: "", backupIntro: "", backupFormat: "",
        backupSpyAff: "", backupNoteAff: "",
        backupSpyNeg: "", backupNoteNeg: "",
        onLeave: []
    };
}

// --- CORE UI CONTROLS ---
function setWeek(idx) {
    if (!currentBatch.weeks || !currentBatch.weeks[idx]) return;

    currentWeekIdx = idx;
    roles = currentBatch.weeks[idx].roles;

    // Toggle Section Visibility
    const isBreakWeek = (idx === 4);
    document.querySelectorAll('section').forEach(sec => sec.style.display = isBreakWeek ? "none" : "block");

    // Update Button Highlights
    document.querySelectorAll(".week-btn").forEach((btn, i) => {
        btn.style.backgroundColor = (i === idx) ? "#007bff" : "#ccc";
    });

    refreshAll();
}

function refreshAll() {
    if (members.length === 0) return;
    const isBreakWeek = (currentWeekIdx === 4);

    // Clean dynamic containers
    ["#break-week-container", "#topic-container", "#session-report", "#attendance-container", "#participant-dashboard"].forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.remove();
    });

    renderParticipantDashboard();

    if (isBreakWeek) {
        renderBreakWeekUI();
    } else {
        renderTopicInput();
        renderAttendanceToggles();

        // Populate all Dropdowns
        if (document.getElementById("presenter-select")) {
            renderPresenterList();
            renderTeamCheckboxes();
            updateSubRoleDropdowns();
            renderSupportRoles();
        }
        renderPostSessionReport();
    }
    renderTable();
    checkArchiveStatus();
}

// --- RENDERERS ---
function renderTable() {
    const tbody = document.querySelector("#assignment-table tbody");
    const weekTopic = currentBatch.weeks[currentWeekIdx].topic || "No topic set";

    if (currentWeekIdx === 4) {
        tbody.innerHTML = `
            <tr><td>Content</td><td colspan="2">${roles.content || "-"}</td></tr>
            <tr><td>Graphic</td><td colspan="2">${roles.graphic || "-"}</td></tr>
        `;
    } else {
        tbody.innerHTML = `
            <tr style="background: #f1f3f5">
                <td><strong>Topic</strong></td>
                <td colspan="2"><strong>${weekTopic}</strong></td>
            </tr>
            <tr style="background: #e9ecef; font-weight: bold; font-size: 0.8em;">
                <td>ROLE</td><td>PRIMARY</td><td>BACKUP</td>
            </tr>
            <tr><td><strong>Presenter</strong></td><td>${roles.presenter || "-"}</td><td>${roles.backupPresenter || "-"}</td></tr>
            <tr><td><strong>Host</strong></td><td>${roles.host || "-"}</td><td>${roles.backupHost || "-"}</td></tr>
            <tr><td><strong>Intro</strong></td><td>${roles.intro || "-"}</td><td>${roles.backupIntro || "-"}</td></tr>
            <tr><td><strong>Format</strong></td><td>${roles.format || "-"}</td><td>${roles.backupFormat || "-"}</td></tr>
            <tr><td><strong>Link Sharer</strong></td><td>${roles.linkSharer || "-"}</td><td>${roles.backupLinkSharer || "-"}</td></tr>
            <tr><td><strong>Manager</strong></td><td>${roles.manager || "-"}</td><td>${roles.backupManager || "-"}</td></tr>
            
            <tr style="border-top: 2px solid #ddd"><td style="color:green"><strong>✅ Aff Team</strong></td><td colspan="2">${roles.affirmative.join(", ") || "-"}</td></tr>
            <tr style="font-size:0.85em"><td>Spy Judge</td><td>${roles.spyAff || "-"}</td><td style="color:#777">${roles.backupSpyAff || "-"}</td></tr>
            <tr style="font-size:0.85em"><td>Note-Taker</td><td>${roles.noteAff || "-"}</td><td style="color:#777">${roles.backupNoteAff || "-"}</td></tr>
            
            <tr style="border-top: 1px solid #eee"><td style="color:red"><strong>❌ Neg Team</strong></td><td colspan="2">${roles.negative.join(", ") || "-"}</td></tr>
            <tr style="font-size:0.85em"><td>Spy Judge</td><td>${roles.spyNeg || "-"}</td><td style="color:#777">${roles.backupSpyNeg || "-"} </td></tr>
            <tr style="font-size:0.85em"><td>Note-Taker</td><td> ${roles.noteNeg || "-"}</td><td style="color:#777"> ${roles.backupNoteNeg || "-"}</td></tr>
        `;
    }
}

function renderBreakWeekUI() {
    let container = document.getElementById("break-week-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "break-week-container";
        document.querySelector("h2").after(container);
    }

    container.innerHTML = `
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #90caf9;">
            <h3 style="margin-top:0; color: #0d47a1">Break Week</h3>
            <div style="margin-bottom: 15px">
                <label><strong>Content:</strong></label><br>
                <select id="content-select" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:1px solid #ccc;"></select>
            </div>
            <div>
                <label><strong>Graphic:</strong></label><br>
                <select id="graphic-select" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:1px solid #ccc;"></select>
            </div>
        </div>
    `;

    setupDropdown("content-select", "content", "graphic");
    setupDropdown("graphic-select", "graphic", "content");
}

function setupDropdown(elementId, roleKey, otherRoleKey) {
    const sel = document.getElementById(elementId);
    const available = members.filter(m => !roles.onLeave.includes(m.name));

    sel.innerHTML = '<option value="">-- Select Member --</option>';
    available.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.name;
        opt.textContent = m.name;
        if (m.name === roles[otherRoleKey] && m.name !== "") opt.disabled = true;
        if (m.name === roles[roleKey]) opt.selected = true;
        sel.appendChild(opt);
    });

    sel.onchange = async (e) => {
        roles[roleKey] = e.target.value;
        await save("batches", batches);
        refreshAll();
    };
}

function renderTopicInput() {
    let container = document.getElementById("topic-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "topic-container";
        document.querySelector("h2").after(container);
    }

    container.innerHTML = `
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 5px solid #007bff;">
            <label><strong>Debate Topic:</strong></label><br>
            <input type="text" id="topic-field"
                   placeholder="Enter debate topic here..."
                   style="width: 100%; padding: 10px; margin-top: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
                   value="${currentBatch.weeks[currentWeekIdx].topic || ''}">
        </div>
    `;

    const input = document.getElementById("topic-field");
    input.oninput = e => {
        currentBatch.weeks[currentWeekIdx].topic = e.target.value;
        save("batches", batches);
    }
}

function renderParticipantDashboard() {
    // 1. Calculate Facilitators (Total members minus those on leave)
    const totalMembers = members.length;
    const facilitatorsPresent = totalMembers - (roles.onLeave ? roles.onLeave.length : 0);

    // 2. Get Guests from the current week's data
    const guestCount = currentBatch.weeks[currentWeekIdx].audienceCount || 0;

    // 3. Total Combined
    const totalAttendance = facilitatorsPresent + guestCount;

    let dashboard = document.getElementById("participant-dashboard");
    if (!dashboard) {
        dashboard = document.createElement("div");
        dashboard.id = "participant-dashboard";
        document.querySelector("main").prepend(dashboard);
    }

    dashboard.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 25px;">
            <div style="background: #e3f2fd; border: 1px solid #2196f3; padding: 12px; border-radius: 8px; text-align: center;">
                <span style="font-size: 0.75em; color: #0d47a1; font-weight: bold; text-transform: uppercase;">Total Attendance</span>
                <div style="font-size: 1.6em; font-weight: bold; color: #0d47a1;">${totalAttendance}</div>
            </div>
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 12px; border-radius: 8px; text-align: center;">
                <span style="font-size: 0.75em; color: #495057; font-weight: bold; text-transform: uppercase;">Facilitators</span>
                <div style="font-size: 1.6em; font-weight: bold;">${facilitatorsPresent}</div>
            </div>
            <div style="background: #fff3e0; border: 1px solid #ffe0b2; padding: 12px; border-radius: 8px; text-align: center;">
                <span style="font-size: 0.75em; color: #e65100; font-weight: bold; text-transform: uppercase;">Guest Audience</span>
                <div style="font-size: 1.6em; font-weight: bold; color: #e65100;">${guestCount}</div>
            </div>
        </div>
    `;
}

function renderAttendanceToggles() {
    let container = document.createElement("div");
    container.id = "attendance-container";
    document.querySelector("#topic-container").after(container);

    const assignedNames = Object.values(roles).flat();

    container.innerHTML = `
        <div style="background: #fdfdfe; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin:0 0 10px 0;">Attendance (Week ${currentWeekIdx + 1})</h4>
            <div id="attendance-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;"></div>
        </div>
    `;

    const grid = document.getElementById("attendance-grid");
    members.forEach(m => {
        const isCurrentlyOnLeave = roles.onLeave.includes(m.name);
        const isAssigned = assignedNames.includes(m.name);

        const label = document.createElement("label");
        label.className = "attendance-label";
        label.style.cssText = `padding:8px; border-radius:6px; border:1px solid ${isCurrentlyOnLeave ? '#ffcdd2' : '#c8e6c9'}; background:${isCurrentlyOnLeave ? '#ffebee' : '#f1fbf1'}; cursor:pointer; font-size:0.8em;`;

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !isCurrentlyOnLeave;
        cb.style.marginRight = "5px";

        cb.onchange = async () => {
            if (!cb.checked) {
                if (!roles.onLeave.includes(m.name)) roles.onLeave.push(m.name);
            } else {
                roles.onLeave = roles.onLeave.filter(name => name !== m.name);
            }
            await save("batches", batches);
            refreshAll();
        };

        label.append(cb, `${m.name}${isAssigned ? ' 👤' : ''}`);
        grid.appendChild(label);
    });
}

// --- DEBATE ROLE HELPERS ---

function renderPresenterList() {
    const sel = document.getElementById("presenter-select");
    if (!sel) return;
    const available = members.filter(m => !roles.onLeave.includes(m.name));
    sel.innerHTML = '<option value="">-- Select Presenter --</option>';
    available.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.name;
        opt.textContent = m.name;
        if (roles.presenter === m.name) opt.selected = true;
        sel.appendChild(opt);
    });
    sel.onchange = (e) => {
        roles.presenter = e.target.value;
        const keys = ["host", "intro", "format", "linkSharer", "manager", "spyAff", "spyNeg", "noteAff", "noteNeg"];
        keys.forEach(k => { if (roles[k] === roles.presenter) roles[k] = ""; });
        roles.affirmative = roles.affirmative.filter(n => n !== roles.presenter);
        roles.negative = roles.negative.filter(n => n !== roles.presenter);
        refreshAll();
    };
}

function renderPostSessionReport() {
    let reportDiv = document.getElementById("session-report");
    if (!reportDiv) {
        reportDiv = document.createElement("div");
        reportDiv.id = "session-report";
        document.querySelector("main").appendChild(reportDiv);
    }

    const guestCount = currentBatch.weeks[currentWeekIdx].audienceCount || 0;

    reportDiv.innerHTML = `
        <div style="margin-top: 40px; padding: 20px; border-top: 2px dashed #ccc; background: #fffcf5; border-radius: 8px;">
            <h3 style="color: #856404; margin-top: 0;">📊 Post-Session Report</h3>
            <p style="font-size: 0.9em; color: #666;">Total attendance dashboard updates live as you type.</p>
            
            <div style="display: flex; align-items: center; gap: 15px;">
                <label><strong>Final Guest Count:</strong></label>
                <input type="number" id="guest-count-input" value="${guestCount}" min="0"
                       style="width: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 1.1em;">
                <span id="auto-save-status" style="font-size: 0.8em; color: green; opacity: 0; transition: opacity 0.3s;">✓ Saved</span>
            </div>
        </div>
    `;

    const input = document.getElementById("guest-count-input");
    const status = document.getElementById("auto-save-status");

    input.oninput = (e) => {
        // 1. Update the data
        const val = parseInt(e.target.value) || 0;
        currentBatch.weeks[currentWeekIdx].audienceCount = val;

        // 2. Save to storage immediately
        save("batches", batches);

        // 3. Update the Top Dashboard immediately
        renderParticipantDashboard();

        // 4. Show a quick "Saved" visual feedback
        status.style.opacity = "1";
        setTimeout(() => { status.style.opacity = "0"; }, 1000);
    };
}

// 2. Team Checkboxes
function renderTeamCheckboxes() {
    const affDiv = document.getElementById("aff-checkboxes");
    const negDiv = document.getElementById("neg-checkboxes");
    if (!affDiv || !negDiv) return;
    affDiv.innerHTML = ""; negDiv.innerHTML = "";

    const presentMembers = members.filter(m => !roles.onLeave.includes(m.name));

    presentMembers.forEach(m => {
        if (m.name === roles.presenter) return;

        // Aff Checkbox: Disabled if they are already in the Negative team
        const isDisabledInAff = roles.negative.includes(m.name);
        const affCb = createCheckbox(m.name, 'aff', roles.affirmative.includes(m.name), isDisabledInAff);
        affDiv.appendChild(affCb);

        // Neg Checkbox: Disabled if they are already in the Affirmative team
        const isDisabledInNeg = roles.affirmative.includes(m.name);
        const negCb = createCheckbox(m.name, 'neg', roles.negative.includes(m.name), isDisabledInNeg);
        negDiv.appendChild(negCb);
    });
}

function createCheckbox(name, team, isChecked, isDisabled) {
    const label = document.createElement("label");
    const info = getAssignmentInfo(name);

    label.style.display = "block";
    label.style.padding = "6px 10px";
    label.style.margin = "4px 0";
    label.style.borderRadius = "6px";
    label.style.fontSize = "0.85em";
    label.style.transition = "all 0.2s ease";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = name;
    cb.checked = isChecked;
    cb.disabled = isDisabled;

    if (isDisabled) {
        label.style.color = "#bbb";
    }

    cb.onchange = async () => {
        if (team === 'aff') {
            if (cb.checked) {
                roles.negative = roles.negative.filter(n => n !== name);
            }
            roles.affirmative = [...document.querySelectorAll('#aff-checkboxes input:checked')].map(i => i.value);
        } else {
            if (cb.checked) {
                roles.affirmative = roles.affirmative.filter(n => n !== name);
            }
            roles.negative = [...document.querySelectorAll('#neg-checkboxes input:checked')].map(i => i.value);
        }

        await save("batches", batches);
        refreshAll();
    };

    label.appendChild(cb);
    label.append(` ${name}`);
    return label;
}

function renderSupportRoles() {
    const mapping = {
        "host-select": "host", "intro-select": "intro", "format-select": "format",
        "link-select": "linkSharer", "manager-select": "manager",
        "backup-presenter-select": "backupPresenter", "backup-host-select": "backupHost",
        "backup-intro-select": "backupIntro", "backup-format-select": "backupFormat",
        "backup-link-select": "backupLinkSharer", "backup-manager-select": "backupManager"
    };

    const presentMembers = members.filter(m => !roles.onLeave.includes(m.name));

    Object.entries(mapping).forEach(([id, key]) => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '<option value="">-- Select --</option>';

        presentMembers.forEach(m => {
            const info = getAssignmentInfo(m.name);
            // const rList = info.rolesList || [];
            const opt = document.createElement("option");
            opt.value = m.name;

            const isAlreadyAssignedElseWhere = info.hasTask && roles[key] !== m.name;

            opt.disabled = isAlreadyAssignedElseWhere;
            opt.textContent = isAlreadyAssignedElseWhere ? `${m.name} (Assigned: ${info.label})` : m.name;

            if (roles[key] === m.name) opt.selected = true;
            sel.appendChild(opt);
        });

        sel.onchange = async (e) => {
            roles[key] = e.target.value;
            await save("batches", batches);
            refreshAll();
        };
    });
}

function updateSubRoleDropdowns() {
    const config = [
        { id: "spy-aff", list: roles.affirmative, curr: "spyAff" },
        { id: "note-aff", list: roles.affirmative, curr: "noteAff" },
        { id: "backup-spy-aff", list: roles.affirmative, curr: "backupSpyAff" },
        { id: "backup-note-aff", list: roles.affirmative, curr: "backupNoteAff" },
        { id: "spy-neg", list: roles.negative, curr: "spyNeg" },
        { id: "note-neg", list: roles.negative, curr: "noteNeg" },
        { id: "backup-spy-neg", list: roles.negative, curr: "backupSpyNeg" },
        { id: "backup-note-neg", list: roles.negative, curr: "backupNoteNeg" }
    ];

    // const allAssigned = Object.values(roles).flat();

    config.forEach(cfg => {
        const sel = document.getElementById(cfg.id);
        if (!sel) return;
        sel.innerHTML = '<option value="">-- Select --</option>';
        cfg.list.forEach(name => {
            const info = getAssignmentInfo(name);
            // const rList = info.rolesList || [];
            const opt = document.createElement("option");
            opt.value = name;

            const otherRoles = info.rolesList.filter(r => r !== cfg.curr);
            const isBusy = otherRoles.length > 0;

            opt.disabled = isBusy;
            const otherFriendlyLabel = ROLE_LABELS[otherRoles[0]] || otherRoles[0];
            opt.textContent = isBusy ? `${name} (Assigned: ${otherFriendlyLabel})` : name;
            if (name === roles[cfg.curr]) opt.selected = true;
            sel.appendChild(opt);
        });
        sel.onchange = async (e) => {
            roles[cfg.curr] = e.target.value;
            await save("batches", batches);
            renderTable();
            refreshAll();
        };
    });
}

// --- BATCH & WEEK CONTROLS ---

function renderBatchSelector() {
    const sel = document.getElementById("batch-select");
    if (!sel) return;
    sel.innerHTML = "";
    batches.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b.id;
        opt.textContent = `${b.id} ${b.status === 'active' ? '(Active)' : ''}`;
        if (b.id === currentBatch.id) opt.selected = true;
        sel.appendChild(opt);
    });
    sel.onchange = (e) => {
        const selected = batches.find(b => b.id === e.target.value);
        if (selected) {
            currentBatch = selected;
            setWeek(0);
        }
    };
}

function setupWeekButtons() {
    document.querySelectorAll(".week-btn").forEach(btn => {
        btn.onclick = e => setWeek(parseInt(e.target.dataset.week));
    });
}

function checkArchiveStatus() {
    const isArchive = currentBatch.status === "archive";
    const inputs = document.querySelectorAll("select, input, button");
    inputs.forEach(el => {
        if (el.id !== "batch-select" && el.id !== "new-batch-btn" && !el.classList.contains("week-btn") && el.id !== "delete-batch-btn") {
            el.disabled = isArchive;
        }
    });
    document.body.style.backgroundColor = isArchive ? "#e9ecef" : "#ffffff";
}

function getAssignmentInfo(name) {
    if (!name) return { count: 0, label: "", rolesList: [], hasTask: false };
    const tasks = [];
    const teams = [];

    Object.entries(roles).forEach(([key, value]) => {
        if (key === 'onLeave') return;
        if (key === 'affirmative'  || key === 'negative') {
            if (value.includes(name)) teams.push(key === 'affirmative' ? 'Affirmative Team' : 'Negative Team');
            return;
        }

        if ( value === name ) {
            tasks.push(key);
        }
    });

    const firstTaskKey = tasks[0];
    const friendlyLabel = ROLE_LABELS[firstTaskKey] || firstTaskKey || "";

    return {
        count: tasks.length,
        label: friendlyLabel,
        rolesList: tasks,
        teamList: teams,
        hasTask: tasks.length > 0
    };
}

// --- BUTTON EVENTS ---
document.getElementById("new-batch-btn").onclick = async () => {
    const name = prompt("Enter Batch Name:");
    if (name) {
        await createNewBatch(name);
        window.location.reload();
    }
};

document.getElementById("delete-batch-btn").onclick = () => {
    if (batches.length <= 1) return alert("Cannot delete the last batch.");
    if (confirm(`Delete "${currentBatch.id}"?`)) {
        batches = batches.filter(b => b.id !== currentBatch.id);
        if (!batches.some(b => b.status === "active")) batches[batches.length - 1].status = "active";
        save("batches", batches);
        window.location.reload();
    }
};

document.getElementById("copy-roles").onclick = () => {
    const weekData = currentBatch.weeks[currentWeekIdx];
    const topic = weekData.topic || " ";

    let text = `❗️ ${currentBatch.id} | Week ${currentWeekIdx + 1}\n`;
    text += `📌 Topic: ${topic}\n\n`;

    if (currentWeekIdx === 4) {
        text += `Break Week Assignments:\n• Content: ${roles.content}\n• Graphic: ${roles.graphic}`;
    }

    else {
        const aff = roles.affirmative.join(", ") || " ";
        const neg = roles.negative.join(", ") || " ";

        text += `Presenter: ${roles.presenter || " "} (Backup: ${roles.backupPresenter || " "})\n`;
        text += `Host: ${roles.host || " "} (Backup: ${roles.backupHost || " "})\n`;
        text += `Introducer: ${roles.intro || " "} (Backup: ${roles.backupIntro || " "})\n`;
        text += `Format Manager: ${roles.format || " "} (Backup: ${roles.backupFormat || " "})\n`;
        text += `Link Sharer: ${roles.linkSharer || " "} (Backup: ${roles.backupLinkSharer || " "})\n`;
        text += `Manager: ${roles.manager || " "} (Backup: ${roles.backupManager || " "})\n\n`;
        text += `✅ Aff: ${aff}\n❌ Neg: ${neg}\n\n`;
        text += `Affirmative Spy Judge: ${roles.spyAff || " "} (Backup: ${roles.backupSpyAff || " "})\n`;
        text += `Affirmative Note-taker: ${roles.noteAff || " "} (Backup: ${roles.backupNoteAff || " "})\n`;
        text += `Negative Spy Judge: ${roles.spyNeg || " "} (Backup: ${roles.backupSpyNeg || " "})\n`;
        text += `Negative Note-taker: ${roles.noteNeg || " "} (Backup: ${roles.backupNoteNeg || " "})\n`;
    }

    navigator.clipboard.writeText(text).then(() => alert("Assignments copied to clipboard."));
};

document.getElementById("save-roles").onclick = async () => {
    const btn = document.getElementById("save-roles");
    btn.innerText = "Saving...";
    await save("batches", batches);
    btn.innerText = "Save";
    alert("Saved to Cloud!");
};

document.getElementById("reset-roles").onclick = () => {
    if (confirm("Reset assignments for this week?")) {
        currentBatch.weeks[currentWeekIdx].roles = createEmptyRoles();
        roles = currentBatch.weeks[currentWeekIdx].roles;
        save("batches", batches);
        refreshAll();
    }
};

// --- START APP ---
async function init() {
    const main = document.querySelector("main");
    main.style.opacity = "0.5"; // Visual feedback while loading

    // Load from Supabase
    const cloudMembers = await load("members");
    const cloudBatches = await load("batches");

    members = cloudMembers || [];
    batches = cloudBatches || [];

    await initializeData();
    setupWeekButtons();
    renderBatchSelector();

    main.style.opacity = "1";
    console.log("Supabase Sync Complete.");
}

init();