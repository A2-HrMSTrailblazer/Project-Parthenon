let members = load("members") || [];
let roles = load("roles") || {
    presenter: "", affirmative: [], negative: [],
    spyAff: "", spyNeg: "", noteAff: "", noteNeg: "",
    host: "", intro: "", format: "", linkSharer: "", manager: ""
};

function init() {
    renderPresenterList();
    renderTeamCheckboxes();
    updateSubRoleDropdowns();
    renderSupportRoles();
    renderTable();
}

// 1. Presenter Selection (The only person truly "locked out" of other roles)
function renderPresenterList() {
    const sel = document.getElementById("presenter-select");
    sel.innerHTML = '<option value="">-- Select Presenter --</option>';
    members.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.name;
        opt.textContent = m.name;
        if (roles.presenter === m.name) opt.selected = true;
        sel.appendChild(opt);
    });

    sel.onchange = (e) => {
        roles.presenter = e.target.value;
        // Clean up: If they were in any other role, clear that role
        const keys = ["host", "intro", "format", "linkSharer", "manager", "spyAff", "spyNeg", "noteAff", "noteNeg"];
        keys.forEach(k => { if (roles[k] === roles.presenter) roles[k] = ""; });
        roles.affirmative = roles.affirmative.filter(n => n !== roles.presenter);
        roles.negative = roles.negative.filter(n => n !== roles.presenter);

        refreshAll();
    };
}

// 2. Team Checkboxes (Prevents being on both teams, but allows Support Roles)
function renderTeamCheckboxes() {
    const affDiv = document.getElementById("aff-checkboxes");
    const negDiv = document.getElementById("neg-checkboxes");
    affDiv.innerHTML = ""; negDiv.innerHTML = "";

    members.forEach(m => {
        if (m.name === roles.presenter) return;

        // Aff Checkbox
        const affCb = createCheckbox(m.name, 'aff', roles.affirmative.includes(m.name));
        if (roles.negative.includes(m.name)) affCb.querySelector('input').disabled = true;
        affDiv.appendChild(affCb);

        // Neg Checkbox
        const negCb = createCheckbox(m.name, 'neg', roles.negative.includes(m.name));
        if (roles.affirmative.includes(m.name)) negCb.querySelector('input').disabled = true;
        negDiv.appendChild(negCb);
    });
}

function createCheckbox(name, team, isChecked) {
    const label = document.createElement("label");
    label.style.display = "block";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = name;
    cb.checked = isChecked;
    cb.onchange = () => {
        if (team === 'aff') {
            roles.affirmative = [...document.querySelectorAll('#aff-checkboxes input:checked')].map(i => i.value);
        } else {
            roles.negative = [...document.querySelectorAll('#neg-checkboxes input:checked')].map(i => i.value);
        }
        refreshAll();
    };
    label.appendChild(cb);
    label.append(` ${name}`);
    return label;
}

// 3. Support Roles (Allows Team Members, but prevents Support-Support overlap)
function renderSupportRoles() {
    const mapping = {
        "host-select": "host",
        "intro-select": "intro",
        "format-select": "format",
        "link-select": "linkSharer",
        "manager-select": "manager"
    };

    const allSupportValues = Object.values(mapping).map(key => roles[key]);

    Object.entries(mapping).forEach(([id, key]) => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '<option value="">-- Select --</option>';

        members.forEach(m => {
            if (m.name === roles.presenter) return; // Presenter is never here

            const opt = document.createElement("option");
            opt.value = m.name;
            opt.textContent = m.name;

            // Logic: You can be a team member AND a host, 
            // but you can't be a host AND a manager.
            const isSelf = roles[key] === m.name;
            const isTakenByOtherSupport = allSupportValues.includes(m.name) && !isSelf;

            if (isTakenByOtherSupport) opt.disabled = true;
            if (isSelf) opt.selected = true;

            sel.appendChild(opt);
        });

        sel.onchange = (e) => {
            roles[key] = e.target.value;
            refreshAll();
        };
    });
}

function updateSubRoleDropdowns() {
    const config = [
        { id: "spy-aff", list: roles.affirmative, current: "spyAff" },
        { id: "note-aff", list: roles.affirmative, current: "noteAff" },
        { id: "spy-neg", list: roles.negative, current: "spyNeg" },
        { id: "note-neg", list: roles.negative, current: "noteNeg" }
    ];

    config.forEach(item => {
        const sel = document.getElementById(item.id);
        if (!sel) return;
        const previousVal = roles[item.current];
        sel.innerHTML = '<option value="">-- Select --</option>';

        item.list.forEach(name => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            if (name === previousVal) opt.selected = true;
            sel.appendChild(opt);
        });

        sel.onchange = (e) => {
            roles[item.current] = e.target.value;
            validateUniqueSubRoles();
        };
    });
}

function validateUniqueSubRoles() {
    if (roles.spyAff && roles.spyAff === roles.noteAff) {
        alert("Same person cannot be Spy and Note Taker!");
        roles.noteAff = "";
        updateSubRoleDropdowns();
    }
    if (roles.spyNeg && roles.spyNeg === roles.noteNeg) {
        alert("Same person cannot be Spy and Note Taker!");
        roles.noteNeg = "";
        updateSubRoleDropdowns();
    }
}

function refreshAll() {
    renderTeamCheckboxes();
    updateSubRoleDropdowns();
    renderSupportRoles();
}

document.getElementById("save-roles").onclick = () => {
    save("roles", roles);
    renderTable();
    alert("Role assignments saved!");
};

function renderTable() {
    const tbody = document.querySelector("#assignment-table tbody");
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

document.getElementById("reset-roles").onclick = () => {
    if (confirm("Are you sure you want to reset all role assignments?")) {
        roles = {
            presenter: "", affirmative: [], negative: [],
            spyAff: "", spyNeg: "", noteAff: "", noteNeg: "",
            host: "", intro: "", format: "", linkSharer: "", manager: ""
        };

        save("roles", roles);
        renderPresenterList();
        refreshAll();
        renderTable();

        alert("All role assignments have been reset.");
    }
};

document.getElementById("copy-roles").onclick = () => {
    // Format the teams as bullet points
    const affTeamList = roles.affirmative.length > 0 ? roles.affirmative.map(name => `    • ${name}`).join("\n") : "    • Yet to be assigned";
    const negTeamList = roles.negative.length > 0 ? roles.negative.map(name => `    • ${name}`).join("\n") : "    • Yet to be assigned";

    const text = `
    ❗️Today’s Roles — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} 

    Main Presenter: ${roles.presenter || "Yet to be assigned"}
    Host: ${roles.host || "Yet to be assigned"}
    Introducer: ${roles.intro || "Yet to be assigned"}
    Debate Format: ${roles.format || "Yet to be assigned"}
    Link Manager: ${roles.linkSharer || "Yet to be assigned"}
    Weekly Manager: ${roles.manager || "Yet to be assigned"}

    ✅ Affirmative Team
    ${affTeamList}

    ❌ Opposition Team
    ${negTeamList}

    Spy Judges
    - Affirmative Team: ${roles.spyAff || "Yet to be assigned"}
    - Opposition Team: ${roles.spyNeg || "Yet to be assigned"}

    Note Takers
    - Affirmative Team: ${roles.noteAff || "Yet to be assigned"}
    - Opposition Team: ${roles.noteNeg || "Yet to be assigned"}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
        alert("Role assignments copied to clipboard.");
    }).catch(err => {
        alert("Failed to copy to clipboard: " + err);
    });
};

init();