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
    members.forEach((m, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${m.name}</strong></td>
            <td><span style="color: #2e7d32; font-size: 0.9em; background: #e8f5e9; padding: 2px 8px; border-radius: 10px;">Facilitator</span></td>
            <td>
                <button class="delete-member-btn" onclick="deleteMember(${index})" 
                        style="color: #d32f2f; border: 1px solid #d32f2f; background: none; border-radius: 4px; cursor: pointer; padding: 4px 8px;">
                    Remove
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
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