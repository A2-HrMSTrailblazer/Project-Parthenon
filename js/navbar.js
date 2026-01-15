function loadSidebar() {
  const navHTML = `
      <div id="sidebar-overlay" class="overlay"></div>
      <nav id="sidebar" class="sidebar active">
        <div class="sidebar-header">
            <h3>Weekly Roles</h3>
            <button id="menu-toggle" class="nav-collapse-btn">☰</button>
        </div>
        <ul class="nav-links">
            <li><a href="./index.html" id="nav-home">🏠 &nbsp; Home</a></li>
            <li><a href="./members.html" id="nav-members">👥 &nbsp; Members</a></li>
            <li><a href="./roles.html" id="nav-roles">🎭 &nbsp; Roles</a></li>
            <li><a href="./links.html" id="nav-links">🔗 &nbsp; Links</a></li>
        </ul>
      </nav>
      <button id="menu-open" class="hamburger" style="display:none;">☰</button>
    `;

  document.body.insertAdjacentHTML('afterbegin', navHTML);

  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const menuOpen = document.getElementById('menu-open');
  const overlay = document.getElementById('sidebar-overlay');
  const body = document.body;

  // Start with body shifted
  body.classList.add('sidebar-open');

  const toggleSidebar = (forceClose = false) => {
    const isOpen = sidebar.classList.contains('active');
    
    if (isOpen || forceClose) {
      sidebar.classList.remove('active');
      body.classList.remove('sidebar-open');
      menuOpen.style.display = "flex"; // Show floating button to reopen
      overlay.classList.remove('active');
    } else {
      sidebar.classList.add('active');
      body.classList.add('sidebar-open');
      menuOpen.style.display = "none"; // Hide floating button
      // Only show overlay on mobile screens
      if (window.innerWidth <= 768) overlay.classList.add('active');
    }
  };

  menuToggle.onclick = () => toggleSidebar();
  menuOpen.onclick = () => toggleSidebar();
  overlay.onclick = () => toggleSidebar(true);

  // Auto-highlight logic
  const currentPage = window.location.pathname.split("/").pop();
  const pages = { "": "nav-home", "index.html": "nav-home", "members.html": "nav-members", "roles.html": "nav-roles", "links.html": "nav-links" };
  const activeId = pages[currentPage];
  if (activeId) document.getElementById(activeId).classList.add('active');
}

loadSidebar();