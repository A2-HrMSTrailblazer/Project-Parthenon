/**
 * GLOBAL STATE
 */
let members = [];

/**
 * INITIALIZATION
 */
async function initMembers() {
    const tableBody = document.querySelector("#member-table tbody");
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading members...</td></tr>';

    // Load from Supabase (via storage.js)
    const cloudMembers = await load("members");

    // Fallback if empty
    if (!cloudMembers || cloudMembers.length === 0) {
        members = [
            { name: "Mabel" }, { name: "Nyein" }, { name: "Pai" },
            { name: "Yoon" }, { name: "Ruby" }, { name: "Emily" },
            { name: "Moh Moh" }, { name: "Lucas" }, { name: "Willie" },
            { name: "Tone Tone" }, { name: "Alex" }, { name: "Steven" },
            { name: "Titi" }, { name: "Halen" }
        ].map(m => ({ ...m, archived: false }));
        await save("members", members);
    } else {
        members = cloudMembers;
    }

    renderMembers();
}

/**
 * RENDER TABLE
 */
function renderMembers() {
    const tableBody = document.querySelector("#member-table tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    const activeMembers = members.filter(m => !m.archived);

    if (activeMembers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No active members found.</td></tr>';
        return;
    }

    activeMembers.forEach((m) => {
        const firstLetter = m.name.charAt(0).toUpperCase();
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
window.archiveMember = async function(nameToArchive) {
    if (confirm(`Archive ${nameToArchive}? They will stay in past records but won't show up for new assignments.`)) {
        members = members.map(m =>
            m.name === nameToArchive ? { ...m, archived: true } : m
        );

        await save("members", members);
        renderMembers();
    }
};

/**
 * ADD MEMBER
 */
document.getElementById("add-member").onclick = async () => {
    const name = prompt("Enter new facilitator name:");
    if (!name || name.trim() === "") return;

    const cleanName = name.trim();

    // Check for duplicates (including archived ones)
    if (members.some(m => m.name.toLowerCase() === cleanName.toLowerCase())) {
        alert("This name already exists in your records!");
        return;
    }

    const btn = document.getElementById("add-member");
    const originalText = btn.innerText;

    try {
        btn.disabled = true;
        btn.innerText = "Saving...";

        members.push({ name: cleanName, archived: false });
        await save("members", members);
        
        renderMembers();
    } catch (error) {
        alert("Error saving member. Please try again.");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
};

// Start the app
initMembers();