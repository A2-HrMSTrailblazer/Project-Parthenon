let links = load("links") || [];

const tbody = document.querySelector("#link-table tbody");
const addBtn = document.getElementById("add-link");

function renderLinks() {
    tbody.innerHTML = "";
    
    links.forEach((lk, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${lk.title}</td>
            <td><a href="${lk.url}" target="_blank">${lk.url}</a></td>
            <td>${lk.category || "-"}</td>
            <td><button data-index="${index}" class="delete-link">X</button></td>
        `;

        tbody.appendChild(row);
    })
}