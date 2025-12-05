// Load members and roles
let savedMembers = load("members");
let members = (Array.isArray(savedMembers) && savedMembers.length > 0) ? savedMembers : [
    { name: "Mabel", availability: "available" },
    { name: "Nyein", availability: "available" },
    { name: "Pai", availability: "available" }
];
let roles = load("roles") || {
    presenter: "",
    host: "",
    linksharer: "",
    formatter: "",
    intro: "",
    manager: "",
    spy: [],
    notetakers: []
};

// DOM elements
const selects = {
    presenter: document.getElementById("presenter"),
    host: document.getElementById("host"),
    linksharer: document.getElementById("linksharer"),
    formatter: document.getElementById("formatter"),
    intro: document.getElementById("intro"),
    manager: document.getElementById("manager"),
    spy: document.getElementById("spy"),
    notetakers: document.getElementById("notetakers")
};

// Populate dropdowns
function populateOptions() {
    const names = members.map(m => m.name);

    Object.keys(selects).forEach(key => {
        const select = selects[key];
        select.innerHTML = "";

        names.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });

        // Restore saved assignment
        if (Array.isArray(roles[key])) {
            // Multi-select roles
            roles[key].forEach(savedName => {
                const opt = [...select.options].find(o => o.value === savedName);
                if (opt) opt.selected = true;
            });
        } else {
            // Single-select roles
            select.value = roles[key] || "";
        }
    });
}

populateOptions();

// Save logic
document.getElementById("save-roles").onclick = () => {

    roles.presenter = selects.presenter.value;
    roles.host = selects.host.value;
    roles.linksharer = selects.linksharer.value;
    roles.formatter = selects.formatter.value;
    roles.intro = selects.intro.value;
    roles.manager = selects.manager.value;

    // Multi-select values
    roles.spy = [...selects.spy.selectedOptions].map(o => o.value);
    roles.notetakers = [...selects.notetakers.selectedOptions].map(o => o.value);

    save("roles", roles);

    document.getElementById("status").textContent = "Saved!";
    setTimeout(() => {
        document.getElementById("status").textContent = "";
    }, 1500);
};
