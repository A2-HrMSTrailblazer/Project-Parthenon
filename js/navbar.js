/**
 * Navigation & Sidebar Component
 * Manages the persistent sidebar state and active link highlighting.
 */
function loadSidebar() {
    const navHTML = `
        <div id="sidebar-overlay" class="overlay"></div>
        <nav id="sidebar" class="sidebar active">
            <div class="sidebar-header">
                <h3>Weekly Roles</h3>
                <button id="menu-toggle" class="nav-collapse-btn" aria-label="Collapse Menu">☰</button>
            </div>
            <ul class="nav-links">
                <li><a href="./index.html" id="nav-home">🏠 &nbsp; Home</a></li>
                <li><a href="./members.html" id="nav-members">👥 &nbsp; Members</a></li>
                <li><a href="./roles.html" id="nav-roles">🎭 &nbsp; Roles</a></li>
                <li><a href="./links.html" id="nav-links">🔗 &nbsp; Links</a></li>
            </ul>
        </nav>
        <button id="menu-open" class="hamburger" style="display:none;" aria-label="Open Menu">☰</button>
    `;

    document.body.insertAdjacentHTML('afterbegin', navHTML);

    const elements = {
        sidebar: document.getElementById('sidebar'),
        menuToggle: document.getElementById('menu-toggle'),
        menuOpen: document.getElementById('menu-open'),
        overlay: document.getElementById('sidebar-overlay'),
        body: document.body
    };

    /**
     * Updates UI based on sidebar state
     * @param {boolean} shouldOpen 
     */
    const setSidebarState = (shouldOpen) => {
        if (shouldOpen) {
            elements.sidebar.classList.add('active');
            elements.body.classList.add('sidebar-open');
            elements.menuOpen.style.display = "none";
            
            // Mobile: Show overlay when sidebar opens
            if (window.innerWidth <= 768) {
                elements.overlay.classList.add('active');
            }
        } else {
            elements.sidebar.classList.remove('active');
            elements.body.classList.remove('sidebar-open');
            elements.menuOpen.style.display = "flex";
            elements.overlay.classList.remove('active');
        }
    };

    // --- Event Listeners ---

    // Toggle (Close) button inside sidebar
    elements.menuToggle.onclick = () => setSidebarState(false);

    // Hamburger (Open) button
    elements.menuOpen.onclick = () => setSidebarState(true);

    // Click overlay to close (Mobile focus)
    elements.overlay.onclick = () => setSidebarState(false);

    // Auto-close overlay if window is resized to desktop width
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && elements.sidebar.classList.contains('active')) {
            elements.overlay.classList.remove('active');
        }
    });

    // --- Initialization ---

    // 1. Set initial state: Default to Open on desktop
    setSidebarState(window.innerWidth > 768);

    // 2. Highlight Active Page
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navMap = {
        "index.html": "nav-home",
        "members.html": "nav-members",
        "roles.html": "nav-roles",
        "links.html": "nav-links"
    };

    const activeId = navMap[currentPage];
    if (activeId) {
        const activeLink = document.getElementById(activeId);
        if (activeLink) activeLink.classList.add('active');
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', loadSidebar);