/**
 * GLOBAL STATE
 */
let members = [];

/**
 * INITIALIZATION
 * Fetches the latest member list from Supabase
 */
async function initMembers() {
    const main = document.querySelector("main");
    if (main) main.style.opacity = "0.5";

    // Load from Supabase
    const cloudMembers = await load("members");

    // Fallback to default list only if cloud is totally empty
    if (!cloudMembers || cloudMembers.length === 0) {
        members = [
            { name: "Mabel" }, { name: "Nyein" }, { name: "Pai" },
            { name: "Yoon" }, { name: "Ruby" }, { name: "Emily" },
            { name: "Moh Moh" }, { name: "Lucas" }, { name: "Willie" },
            { name: "Tone Tone" }, { name: "Alex" }, { name: "Steven" },
            { name: "Titi" }, { name: "Halen" }
        ];
        await save("members", members);
    } else {
        members = cloudMembers;
    }

    if (main) main.style.opacity = "1";
    renderMembers();
}

/**
 * RENDER TABLE
 */
function renderMembers() {
    const tableBody = document.querySelector("#member-table tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    // Only show members who are NOT archived in the management list
    const activeMembers = members.filter(m => !m.archived);

    activeMembers.forEach((m) => {
        const firstLetter = m.name.charAt(0);
        const row = document.createElement("tr");

        row.innerHTML = `
                <td>
                    <div class="member-identity">
                        <div class="avatar-circle">${firstLetter}</div>
                        <strong>${m.name}</strong>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-active">Active Facilitator</span>
                </td>
                <td style="text-align: right;">
                    <button class="delete-member-btn" onclick="archiveMember('${m.name}')">
                        Remove
                    </button>
                </td>
            `;
        tableBody.appendChild(row);
    });
}

/**
 * ARCHIVE MEMBER (Soft Delete)
 */
async function archiveMember(nameToArchive) {
    if (confirm(`Archive ${nameToArchive}? They will stay in past records but won't show up for new assignments.`)) {
        // Find the member by name and set archived to true
        members = members.map(m =>
            m.name === nameToArchive ? { ...m, archived: true } : m
        );

        await save("members", members);
        renderMembers();
    }
}

/**
 * ADD MEMBER
 */
document.getElementById("add-member").onclick = async () => {
    const name = prompt("Enter member name:");
    if (!name || name.trim() === "") return;

    // Check for duplicates
    if (members.some(m => m.name.toLowerCase() === name.toLowerCase().trim())) {
        alert("This name already exists!");
        return;
    }

    members.push({ name: name.trim() });

    // UI Feedback
    const btn = document.getElementById("add-member");
    btn.disabled = true;
    btn.innerText = "Saving...";

    await save("members", members);

    btn.disabled = false;
    btn.innerText = "Add Member";
    renderMembers();
};

/**
 * DELETE MEMBER
 */
async function deleteMember(index) {
    const nameToDelete = members[index].name;

    if (confirm(`Are you sure you want to remove ${nameToDelete}? This will not remove them from past batch history, but they won't appear in future selections.`)) {
        members.splice(index, 1);
        await save("members", members);
        renderMembers();
    }
}

// Start the app
initMembers();