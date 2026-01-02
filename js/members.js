let members = load("members") || [
    { name: "Mabel", availability: "available" },
    { name: "Nyein", availability: "available" },
    { name: "Pai", availability: "available" },
    { name: "Yoon", availability: "available" },
    { name: "Ruby", availability: "available" },
    { name: "Emily", availability: "available" },
    { name: "Moh Moh", availability: "available" },
    { name: "Lucas", availability: "available" },
    { name: "Willie", availability: "available" },
    { name: "Tone Tone", availability: "available" },
    { name: "Alex", availability: "available" },
    { name: "Steven", availability: "available" },
    { name: "Titi", availability: "available" },
    { name: "Halen", availability: "available" },
];

save("members", members);

const tableBody = document.querySelector("#member-table tbody");

// Members list table
function renderMembers() {
    tableBody.innerHTML = "";
    members.forEach((m, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${m.name}</td>
            <td>
                <select data-index="${index}" class="availability">
                    <option value="available" ${m.availability === "available" ? "selected" : ""}>Available</option>
                    <option value="unavailable" ${m.availability === "unavailable" ? "selected" : ""}>Unavailable</option>
                </select>
            </td>
            <td><button data-index="${index}" class="delete-member">Remove</button></td>
        `;

        tableBody.appendChild(row);
    });
}

// Change availability
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

// Delete member
document.addEventListener("click", e => {
    if (e.target.classList.contains("delete-member")) {
        const i = e.target.dataset.index;
        members.splice(i, 1);
        save("members", members);
        renderMembers();
    }
})

renderMembers();
