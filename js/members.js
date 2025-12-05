let members = load("members") || [
    { name: "Nyein", availability: "available" },
    { name: "Mabel", availability: "available" },
    { name: "Yoon", availability: "unavailable" },
    { name: "Emily", availability: "unavailable" },
    { name: "Alex", availability: "available" }
];

const tableBody = document.querySelector("#member-table tbody");

function renderMembers() {
    tableBody.innerHTML = "";
    members.forEach((m, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${m.name}</td>
            <td>
                <select data-index="${index}" class="availability-select">
                    <option value="available" ${m.availability === "available" ? "selected" : ""}>Available</option>
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

    members.push({ name, availability: "available" });
    save("members", members);
    renderMembers();
};

renderMembers();