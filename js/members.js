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
/**
 * UNIFIED RENDER WITH FILTERING
 */
function renderMembers() {
    const tableBody = document.querySelector("#member-table tbody");
    const filterValue = document.getElementById("member-filter").value; // 'active' or 'archived'
    const searchQuery = document.getElementById("member-search").value.toLowerCase();

    if (!tableBody) return;
    tableBody.innerHTML = "";

    // Apply Filters
    const filtered = members.filter(m => {
        const matchesStatus = (filterValue === "archived") ? m.archived : !m.archived;
        const matchesSearch = m.name.toLowerCase().includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    const counterEl = document.getElementById('member-count');
    if (counterEl) {
        counterEl.innerText = `${filtered.length} ${filterValue === 'active' ? 'Active' : 'Archived'} Member${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="empty-state-cell">
            No ${filterValue} members found.
        </td></tr>`;
        return;
    }

    filtered.forEach((m) => {
        const isArchived = m.archived;
        const firstLetter = m.name.charAt(0).toUpperCase();
        const colors = ['#00b4db', '#0083b0', '#28a745', '#ffc107', '#dc3545', '#6610f2'];
        const colorIdx = m.name.length % colors.length;
        const avatarBg = isArchived ? '#ccc' : colors[colorIdx];
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="member-identity">
                    <div class="avatar-circle" style="background: ${avatarBg}; transform: scale(1.1);">
                        ${firstLetter}
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <strong>${m.name}</strong>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${isArchived ? 'status-archived' : 'status-active'}">
                    ${isArchived ? 'Archived' : 'Active Facilitator'}
                </span>
            </td>
            <td style="text-align: right;">
                <button class="${isArchived ? 'restore-btn' : 'delete-member-btn'}" 
                        onclick="toggleMemberStatus('${m.name}')">
                    ${isArchived ? 'Restore' : 'Archive'}
                </button>
                ${isArchived ? `<button class="perm-delete-btn" onclick="permanentlyDeleteMember('${m.name}')" style="margin-left:8px; background:none; border:none; color:red; cursor:pointer; font-size:0.8em;">Perma-Delete</button>` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * TOGGLE STATUS (Archive/Restore)
 */
window.toggleMemberStatus = async function (name) {
    const member = members.find(m => m.name === name);
    const action = member.archived ? "Restore" : "Archive";

    if (confirm(`${action} ${name}?`)) {
        member.archived = !member.archived;
        await save("members", members);
        renderMembers();
    }
};

// Event Listeners for Filtering
document.getElementById("member-filter").onchange = renderMembers;
document.getElementById("member-search").oninput = renderMembers;

/**
 * ADD MEMBER
 */
document.getElementById("add-member").onclick = async () => {
    const name = prompt("Enter facilitator name:");
    if (!name || name.trim() === "") return;
    const cleanName = name.trim();

    const existing = members.find(m => m.name.toLowerCase() === cleanName.toLowerCase());

    if (existing) {
        if (!existing.archived) {
            alert("This member is already active!");
        } else {
            if (confirm(`${cleanName} exists in archives. Restore them?`)) {
                existing.archived = false;
                await save("members", members);
                // Switch view to active so user sees the restored member
                document.getElementById("member-filter").value = "active";
                renderMembers();
            }
        }
        return;
    }

    // Truly new member
    members.push({ name: cleanName, archived: false });
    await save("members", members);
    renderMembers();
};

window.permanentlyDeleteMember = async function (nameToDelete) {
    if (confirm(`Warning: This will remove ${nameToDelete} from the entire system. Past records will show empty slots. Proceed?`)) {
        members = members.filter(m => m.name !== nameToDelete);
        await save("members", members);
        renderMembers();
    }
}

// Start the app
initMembers();