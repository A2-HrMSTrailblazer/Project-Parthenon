let members = load("members") || [];
let roles = load("roles") || { 
    presenter: "", affirmative: [], negative: [], 
    spyAff: "", spyNeg: "", noteAff: "", noteNeg: "" 
};

function init() {
    renderPresenterList();
    renderTeamCheckboxes();
    updateSubRoleDropdowns();
}

// 1. Presenter Selection
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
        // If presenter was in a team, remove them
        roles.affirmative = roles.affirmative.filter(n => n !== roles.presenter);
        roles.negative = roles.negative.filter(n => n !== roles.presenter);
        renderTeamCheckboxes();
        updateSubRoleDropdowns();
    };
}

// 2. Team Checkboxes with Mutual Exclusion
function renderTeamCheckboxes() {
    const affDiv = document.getElementById("aff-checkboxes");
    const negDiv = document.getElementById("neg-checkboxes");
    affDiv.innerHTML = ""; negDiv.innerHTML = "";

    members.forEach(m => {
        if (m.name === roles.presenter) return;

        // Aff Checkbox
        const affCb = createCheckbox(m.name, 'aff', roles.affirmative.includes(m.name));
        // Disable if already in Neg
        if (roles.negative.includes(m.name)) affCb.querySelector('input').disabled = true;
        affDiv.appendChild(affCb);

        // Neg Checkbox
        const negCb = createCheckbox(m.name, 'neg', roles.negative.includes(m.name));
        // Disable if already in Aff
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
        renderTeamCheckboxes(); // Refresh to disable the other side
        updateSubRoleDropdowns();
    };
    label.appendChild(cb);
    label.append(` ${name}`);
    return label;
}

// 3. Populate Spy/Note Takers based on chosen team members
function updateSubRoleDropdowns() {
    const config = [
        { id: "spy-aff", list: roles.affirmative, current: "spyAff" },
        { id: "note-aff", list: roles.affirmative, current: "noteAff" },
        { id: "spy-neg", list: roles.negative, current: "spyNeg" },
        { id: "note-neg", list: roles.negative, current: "noteNeg" }
    ];

    config.forEach(item => {
        const sel = document.getElementById(item.id);
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

// 4. Ensure Spy Judge and Note Taker aren't the same person
function validateUniqueSubRoles() {
    // Simple alert if user picks same person for both roles on one team
    if (roles.spyAff && roles.spyAff === roles.noteAff) {
        alert("One person cannot be both Spy Judge and Note Taker for the Affirmative team!");
        roles.noteAff = "";
        updateSubRoleDropdowns();
    }
    if (roles.spyNeg && roles.spyNeg === roles.noteNeg) {
        alert("One person cannot be both Spy Judge and Note Taker for the Negative team!");
        roles.noteNeg = "";
        updateSubRoleDropdowns();
    }
}

document.getElementById("save-roles").onclick = () => {
    save("roles", roles);
    renderTable();
};

function renderTable() {
    const tbody = document.querySelector("#assignment-table tbody");
    tbody.innerHTML = `
        <tr><td>Presenter</td><td>${roles.presenter}</td></tr>
        <tr><td>Affirmative Team</td><td>${roles.affirmative.join(", ")}</td></tr>
        <tr><td>Negative Team</td><td>${roles.negative.join(", ")}</td></tr>
        <tr><td>Spy (Aff)</td><td>${roles.spyAff}</td></tr>
        <tr><td>Note Taker (Aff)</td><td>${roles.noteAff}</td></tr>
        <tr><td>Spy (Neg)</td><td>${roles.spyNeg}</td></tr>
        <tr><td>Note Taker (Neg)</td><td>${roles.noteNeg}</td></tr>
    `;
}

init();