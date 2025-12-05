let members = load("members") || [
    { name: "Mabel", availability: "available" },
    { name: "Nyein", availability: "available" },
    { name: "Pai", availability: "available" }
];

const tableBody = document.querySelector("#member-table tbody");

function renderMembers() {
    tableBody.innerHTML = "";
    members.forEach((m, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${m.name}</td>
            <td>
                <select data-index="${index}" class="availability">
                    <option value="available" ${m.availability === "available" ? "selected" : ""}>Available</option>
                    <option value="maybe" ${m.availability === "maybe" ? "selected" : ""}>Maybe</option>
                    <option value="unavailable" ${m.availability === "unavailable" ? "selected" : ""}>Unavailable</option>
                </select>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

document.addEventListener("change", e => {
    if (e.target.classList.contains("availability")) {
        const index = e.target.dataset.index;
        members[index].availability = e.target.value;
        save("members", members);
    }
});

// Add member button
document.getElementById("add-member").onclick = () => {
    const name = prompt("Enter member name:");
    if (!name) return;

    members.push({ name, availability: "unknown" });
    save("members", members);
    renderMembers();
};

renderMembers();
