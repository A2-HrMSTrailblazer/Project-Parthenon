let members = load("members") || [];
let batches = load("batches") || [];
let currentBatch;
let currentWeekIdx = 0;
let roles;

// --- INITIALIZATION ---
function initializeData() {
    if (batches.length === 0) {
        createNewBatch("Batch 1");
    }
    currentBatch = batches.find(b => b.status === "active") || batches[batches.length - 1];
    setWeek(0);
}

function createNewBatch(name) {
    const newBatch = {
        id: name,
        status: "active",
        weeks: Array.from({ length: 4 }, () => ({ roles: createEmptyRoles() }))
    };
    batches.forEach(b => b.status = "archive"); // Archive others
    batches.push(newBatch);
    save("batches", batches);
    return newBatch;
}

function createEmptyRoles() {
    return {
        presenter: "", affirmative: [], negative: [],
        spyAff: "", spyNeg: "", noteAff: "", noteNeg: "",
        host: "", intro: "", format: "", linkSharer: "", manager: "",
        content: "", graphic: ""
    };
}

// --- CORE UI CONTROLS ---
function setWeek(idx) {
    if (!currentBatch.weeks && currentBatch.week) currentBatch.weeks = currentBatch.week;
    if (!currentBatch.weeks || !currentBatch.weeks[idx]) return;

    currentWeekIdx = idx;
    roles = currentBatch.weeks[idx].roles;

    // Toggle Section Visibility
    const isWeek4 = (idx === 3);
    document.querySelectorAll('section').forEach(sec => sec.style.display = isWeek4 ? "none" : "block");

    // Update Button Highlights
    document.querySelectorAll(".week-btn").forEach((btn, i) => {
        btn.style.backgroundColor = (i === idx) ? "#007bff" : "#ccc";
        btn.style.color = "white";
    });

    refreshAll();
}

function refreshAll() {
    const isWeek4 = (currentWeekIdx === 3);
    
    if (isWeek4) {
        renderWeek4UI();
    } else {
        const w4 = document.getElementById("week4-container");
        if (w4) w4.remove();
        
        renderPresenterList();
        renderTeamCheckboxes();
        updateSubRoleDropdowns();
        renderSupportRoles();
    }
    renderTable();
    checkArchiveStatus();
}

// --- RENDERERS ---

function renderTable() {
    const tbody = document.querySelector("#assignment-table tbody");
    if (currentWeekIdx === 3) {
        tbody.innerHTML = `
            <tr><td>Content</td><td>${roles.content || "-"}</td></tr>
            <tr><td>Graphic</td><td>${roles.graphic || "-"}</td></tr>
        `;
    } else {
        tbody.innerHTML = `
            <tr><td><strong>Presenter</strong></td><td>${roles.presenter || "-"}</td></tr>
            <tr><td><strong>Affirmative Team</strong></td><td>${roles.affirmative.join(", ") || "-"}</td></tr>
            <tr><td><strong>Negative Team</strong></td><td>${roles.negative.join(", ") || "-"}</td></tr>
            <tr><td>Spy (Aff)</td><td>${roles.spyAff || "-"}</td></tr>
            <tr><td>Note Taker (Aff)</td><td>${roles.noteAff || "-"}</td></tr>
            <tr><td>Spy (Neg)</td><td>${roles.spyNeg || "-"}</td></tr>
            <tr><td>Note Taker (Neg)</td><td>${roles.noteNeg || "-"}</td></tr>
            <tr style="border-top: 2px solid #ddd"><td>Host</td><td>${roles.host || "-"}</td></tr>
            <tr><td>Intro</td><td>${roles.intro || "-"}</td></tr>
            <tr><td>Format</td><td>${roles.format || "-"}</td></tr>
            <tr><td>Link Sharer</td><td>${roles.linkSharer || "-"}</td></tr>
            <tr><td>Weekly Manager</td><td>${roles.manager || "-"}</td></tr>
        `;
    }
}

function renderWeek4UI() {
    let container = document.getElementById("week4-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "week4-container";
        document.querySelector("h2").after(container);
    }

    container.innerHTML = `
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #90caf9;">
            <h3 style="margin-top:0; color: #0d47a1">Week 4: Break Week</h3>
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
    const available = members.filter(m => m.availability === "available");
    
    sel.innerHTML = '<option value="">-- Select Member --</option>';
    available.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.name;
        opt.textContent = m.name;
        if (m.name === roles[otherRoleKey] && m.name !== "") opt.disabled = true;
        if (m.name === roles[roleKey]) opt.selected = true;
        sel.appendChild(opt);
    });

    sel.onchange = (e) => {
        roles[roleKey] = e.target.value;
        refreshAll(); 
    };
}

// --- DEBATE ROLE HELPERS ---

function renderPresenterList() {
    const sel = document.getElementById("presenter-select");
    if (!sel) return;
    const available = members.filter(m => m.availability === "available");
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

function renderTeamCheckboxes() {
    const affDiv = document.getElementById("aff-checkboxes");
    const negDiv = document.getElementById("neg-checkboxes");
    if (!affDiv || !negDiv) return;
    affDiv.innerHTML = ""; negDiv.innerHTML = "";

    members.filter(m => m.availability === "available" && m.name !== roles.presenter).forEach(m => {
        affDiv.appendChild(createTeamCb(m.name, 'aff'));
        negDiv.appendChild(createTeamCb(m.name, 'neg'));
    });
}

// 2. Team Checkboxes (Prevents being on both teams, but allows Support Roles) 
function renderTeamCheckboxes() { 
    const affDiv = document.getElementById("aff-checkboxes"); 
    const negDiv = document.getElementById("neg-checkboxes"); 
    if (!affDiv || !negDiv) return; 
    affDiv.innerHTML = ""; negDiv.innerHTML = ""; 

    const availableMembers = members.filter(m => m.availability === "available"); 

    availableMembers.forEach(m => { 
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
    label.style.display = "block"; 
    
    const cb = document.createElement("input"); 
    cb.type = "checkbox"; 
    cb.value = name; 
    cb.checked = isChecked; 
    cb.disabled = isDisabled;

    if (isDisabled) {
        label.style.color = "#bbb";
        label.style.cursor = "not-allowed";
    }

    cb.onchange = () => { 
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
        
        save("batches", batches);
        refreshAll(); 
    }; 

    label.appendChild(cb); 
    label.append(` ${name}`); 
    return label; 
}

function renderSupportRoles() {
    const mapping = { "host-select": "host", "intro-select": "intro", "format-select": "format", "link-select": "linkSharer", "manager-select": "manager" };
    const allPicks = Object.values(mapping).map(k => roles[k]);

    Object.entries(mapping).forEach(([id, key]) => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '<option value="">-- Select --</option>';
        members.filter(m => m.availability === "available" && m.name !== roles.presenter).forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.name;
            opt.textContent = m.name;
            if (allPicks.includes(m.name) && roles[key] !== m.name) opt.disabled = true;
            if (roles[key] === m.name) opt.selected = true;
            sel.appendChild(opt);
        });
        sel.onchange = (e) => { roles[key] = e.target.value; refreshAll(); };
    });
}

function updateSubRoleDropdowns() {
    const config = [
        { id: "spy-aff", list: roles.affirmative, curr: "spyAff", other: "noteAff" },
        { id: "note-aff", list: roles.affirmative, curr: "noteAff", other: "spyAff" },
        { id: "spy-neg", list: roles.negative, curr: "spyNeg", other: "noteNeg" },
        { id: "note-neg", list: roles.negative, curr: "noteNeg", other: "spyNeg" }
    ];

    config.forEach(cfg => {
        const sel = document.getElementById(cfg.id);
        if (!sel) return;
        sel.innerHTML = '<option value="">-- Select --</option>';
        cfg.list.forEach(name => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            if (name === roles[cfg.other]) opt.disabled = true;
            if (name === roles[cfg.curr]) opt.selected = true;
            sel.appendChild(opt);
        });
        sel.onchange = (e) => { roles[cfg.curr] = e.target.value; refreshAll(); };
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

// --- BUTTON EVENTS ---

document.getElementById("new-batch-btn").onclick = () => {
    const name = prompt("Enter Batch Name:");
    if (name) {
        createNewBatch(name);
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
    let text = "";
    if (currentWeekIdx === 3) {
        text = `❗️${currentBatch.id} | Week 4 Break Week\n\nContent Creator: ${roles.content || "TBA"}\nGraphic Designer: ${roles.graphic || "TBA"}`;
    } else {
        const aff = roles.affirmative.join("\n • ") || "TBA";
        const neg = roles.negative.join("\n • ") || "TBA";
        text = `❗️${currentBatch.id} | Week ${currentWeekIdx + 1}\n\nPresenter: ${roles.presenter || "TBA"}\nHost: ${roles.host || "TBA"}\n\n✅ Affirmative:\n • ${aff}\n\n❌ Negative:\n • ${neg}`;
    }
    navigator.clipboard.writeText(text.trim()).then(() => alert("Copied!"));
};

document.getElementById("save-roles").onclick = () => {
    save("batches", batches);
    alert("Saved Successfully!");
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
function init() {
    initializeData();
    setupWeekButtons();
    renderBatchSelector();
    // refreshAll is called inside setWeek(0) which is called in initializeData
}

init();