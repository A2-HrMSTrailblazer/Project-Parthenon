function loadSidebar() {
    const navHTML = `
      <button id="menu-toggle" class="hamburger">☰</button>
      <div id="sidebar-overlay" class="overlay"></div>
      <nav id="sidebar" class="sidebar">
        <div class="sidebar-header"><h3>Weekly Roles</h3></div>
        <ul class="nav-links">
            <li><a href="./index.html" id="nav-home">🏠 &nbsp; Home</a></li>
            <li><a href="./members.html" id="nav-members">👥 &nbsp; Members</a></li>
            <li><a href="./roles.html" id="nav-roles">🎭 &nbsp; Roles</a></li>
            <li><a href="./links.html" id="nav-links">🔗 &nbsp; Links</a></li>
        </ul>
      </nav>
    `;

    // Insert it at the very start of the body
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // Setup Toggle Logic
    const menuBtn = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    menuBtn.onclick = (e) => {
        sidebar.classList.toggle('active');
        menuBtn.innerText = sidebar.classList.contains('active') ? '✕' : '☰';
        e.stopPropagation();
    };

    // Auto-highlight the active page
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "index.html" || currentPage === "") document.getElementById('nav-home').classList.add('active');
    if (currentPage === "members.html") document.getElementById('nav-members').classList.add('active');
    if (currentPage === "roles.html") document.getElementById('nav-roles').classList.add('active');
    if (currentPage === "links.html") document.getElementById('nav-links').classList.add('active');
}

// Run it immediately
loadSidebar();