/**
 * GLOBAL STATE
 */
let allLinks = []; // This will hold everything extracted from batches

const tbody = document.querySelector("#link-table tbody");
const searchInput = document.getElementById("link-search");

// --- INITIALIZATION ---

async function init() {
    const main = document.querySelector("main");
    if (main) main.style.opacity = "0.5";

    const batches = await load("batches") || [];

    allLinks = [];

    // Mapping keys to readable Titles and Categories
    const masterLinkConfig = {
        zoomLink: { title: "Meeting Link", cat: "Meeting" },
        membershipForm: { title: "Membership Form", cat: "Feedback" },
        topicSlides: { title: "Topic Slides", cat: "Presentation" },
        introSlides: { title: "Intro Slides", cat: "Intro" },
        formatSlides: { title: "Format Slides", cat: "Format" },
        zoomBackground: { title: "Zoom Background", cat: "Meeting" },
        feedbackForm: { title: "Feedback Form", cat: "Feedback" },
        sotdLink: { title: "SOTD Canva", cat: "Presentation" }
    };

    batches.forEach(batch => {
        batch.weeks.forEach((week, idx) => {
            const contextStr = `${batch.id} | Week ${idx + 1}`;
            const topicStr = week.topic || "No Topic Set";

            // 1. Extract the OLD Custom Links (if any exist)
            if (week.links && week.links.length > 0) {
                week.links.forEach(lk => {
                    allLinks.push({
                        ...lk,
                        context: contextStr,
                        topic: topicStr
                    });
                });
            }

            // 2. Extract the NEW Master Links (The 8 specialized ones)
            if (week.roles && week.roles.masterLinks) {
                Object.entries(week.roles.masterLinks).forEach(([key, url]) => {
                    // Only add to list if there is actually a URL saved
                    if (url && url.trim() !== "" && masterLinkConfig[key]) {
                        allLinks.push({
                            title: masterLinkConfig[key].title,
                            url: url,
                            category: masterLinkConfig[key].cat,
                            context: contextStr,
                            topic: topicStr
                        });
                    }
                });
            }
        });
    });

    // Show newest links first
    allLinks.reverse();

    renderLinks();

    if (main) main.style.opacity = "1";
    console.log("Master Links and Custom Links synced from batches.");
}

// --- RENDERER ---

const categoryFilter = document.getElementById("category-filter");

function renderLinks() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCat = categoryFilter.value;
    
    tbody.innerHTML = "";

    const filtered = allLinks.filter(lk => {
        const matchesSearch = 
            lk.title.toLowerCase().includes(searchTerm) ||
            lk.context.toLowerCase().includes(searchTerm) ||
            lk.topic.toLowerCase().includes(searchTerm);
        
        const matchesCategory = (selectedCat === "all" || lk.category === selectedCat);

        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:30px; color:#888;">No links match your filters.</td></tr>`;
        return;
    }

    filtered.forEach((lk) => {
        const row = document.createElement("tr");
        const categoryColor = getCategoryColor(lk.category);

        row.innerHTML = `
            <td>
                <div style="font-weight: 600; color: var(--sky-deep);">${lk.title}</div>
                <div style="font-size: 0.75rem; color: #888;">${lk.context}</div>
            </td>
            <td>
                <div class="url-flex-wrapper">
                    <a href="${lk.url}" target="_blank" class="truncated-url" title="${lk.url}">${lk.url}</a>
                    <button class="copy-icon-btn" onclick="copyToClipboard('${lk.url}', this)" title="Copy Link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                </div>
            </td>
            <td>
                <span class="category-badge" style="background-color: ${categoryColor}15; color: ${categoryColor}; border-color: ${categoryColor}40;">
                    ${lk.category}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Event Listeners
if (searchInput) searchInput.oninput = renderLinks;
if (categoryFilter) categoryFilter.onchange = renderLinks;

// --- HELPERS ---

function getCategoryColor(cat) {
    const colors = {
        'Presentation': '#6f42c1',
        'Meeting': '#007bff',
        'Feedback': '#28a745',
        'Intro': '#fd7e14',
        'Format': '#d4af37' // Use hex for gold for consistency
    };
    return colors[cat] || '#6c757d';
}

function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        // Add the 'copied' class for styling
        btn.classList.add("copied");
        
        // Change icon temporarily to a checkmark if you like, 
        // or just rely on the color flash
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

        setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = originalHTML;
        }, 1500);
    });
}

init();