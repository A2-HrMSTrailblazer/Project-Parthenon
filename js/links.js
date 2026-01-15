/**
 * GLOBAL STATE
 */
let allLinks = [];
const tbody = document.querySelector("#link-table tbody");
const searchInput = document.getElementById("link-search");
const categoryFilter = document.getElementById("category-filter");

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

/**
 * INITIALIZATION
 */
async function init() {
    const main = document.querySelector("main");
    if (main) main.style.opacity = "0.5";

    const batches = await load("batches") || [];
    allLinks = [];

    batches.forEach(batch => {
        batch.weeks.forEach((week, idx) => {
            const contextStr = `${batch.id} • Week ${idx + 1}`;
            const topicStr = week.topic || "No Topic Set";

            // 1. Extract Master Links
            if (week.roles?.masterLinks) {
                Object.entries(week.roles.masterLinks).forEach(([key, url]) => {
                    if (url && url.trim() !== "" && masterLinkConfig[key]) {
                        allLinks.push({
                            title: masterLinkConfig[key].title,
                            url: url.trim(),
                            category: masterLinkConfig[key].cat,
                            context: contextStr,
                            topic: topicStr,
                            batchId: batch.id,
                            weekIdx: idx,
                            linkKey: key,
                            isMaster: true
                        });
                    }
                });
            }

            // 2. Extract Custom Links (Old/Manual links)
            if (week.links && Array.isArray(week.links)) {
                week.links.forEach(lk => {
                    allLinks.push({
                        title: lk.title || "Custom Link",
                        url: lk.url,
                        category: lk.category || "General",
                        context: contextStr,
                        topic: topicStr,
                        batchId: batch.id,
                        weekIdx: idx,
                        linkKey: lk.url,
                        isMaster: false
                    });
                });
            }
        });
    });

    allLinks.reverse(); // Show newest first
    renderLinks();
    if (main) main.style.opacity = "1";
}

/**
 * RENDERER
 */
function renderLinks() {
    if (!tbody) return;
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
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:40px; color:#888;">No resources found matching your search.</td></tr>`;
        return;
    }

    filtered.forEach((lk) => {
        const row = document.createElement("tr");
        const categoryColor = getCategoryColor(lk.category);

        row.innerHTML = `
            <td>
                <div style="font-weight: 600; color: var(--sky-deep);">${lk.title}</div>
                <div style="font-size: 0.75rem; color: #888;">${lk.context} <span style="margin: 0 5px;">•</span> ${lk.topic}</div>
            </td>
            <td>
                <div class="url-flex-wrapper">
                    <a href="${lk.url}" target="_blank" class="truncated-url" title="${lk.url}">${lk.url}</a>
                    <div style="display: flex; gap: 8px;">
                        <button class="copy-icon-btn" onclick="copyToClipboard('${lk.url}', this)" title="Copy Link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                        <button class="delete-link-btn" onclick="deleteLinkFromBatch('${lk.batchId}', ${lk.weekIdx}, '${lk.linkKey}', ${lk.isMaster})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
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

// Helpers
function getCategoryColor(cat) {
    const colors = {
        'Presentation': '#6f42c1',
        'Meeting': '#007bff',
        'Feedback': '#28a745',
        'Intro': '#fd7e14',
        'Format': '#d4af37'
    };
    return colors[cat] || '#6c757d';
}

window.copyToClipboard = function(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        btn.classList.add("copied");
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = originalHTML;
        }, 1500);
    });
};

window.deleteLinkFromBatch = async function(batchId, weekIdx, identifier, isMaster) {
    if (!confirm("Remove this link from session records?")) return;

    const batches = await load("batches");
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    const week = batch.weeks[weekIdx];

    if (isMaster) {
        if (week.roles?.masterLinks) week.roles.masterLinks[identifier] = "";
    } else {
        week.links = (week.links || []).filter(l => l.url !== identifier);
    }

    await save("batches", batches);
    init();
};

// Event Listeners
if (searchInput) searchInput.oninput = renderLinks;
if (categoryFilter) categoryFilter.onchange = renderLinks;

init();