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

addBtn.onclick = () => {
    const title = document.getElementById("link-title").value.trim();
    const url = document.getElementById("link-url").value.trim();
    const category = document.getElementById("link-category").value.trim();

    if (!title || !url) {
        alert("Title and URL are required.");
        return;
    }

    links.push({ title, url, category });
    save("links", links);

    renderLinks();

    document.getElementById("link-title").value = "";
    document.getElementById("link-url").value = "";
    document.getElementById("link-category").value = "";
};

document.addEventListener("click", e => {
    if (e.target.classList.contains("delete-link")) {
        const i = e.target.dataset.index;
        links.splice(i, 1);
        save("links", links);
        renderLinks();
    }
});

renderLinks();