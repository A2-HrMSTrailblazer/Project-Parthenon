async function initLanding() {
    const members = await load('members') || [];
    const batches = await load('batches') || [];
    const activeBatch = batches.find(b => b.status === 'active') || batches[batches.length - 1];

    if (!activeBatch) return;

    // 1. Update Ribbon Stats
    document.getElementById('stat-total-members').innerText = members.filter(m => !m.archived).length;
    document.getElementById('stat-active-batch').innerText = activeBatch.id;

    const today = new Date().toISOString().split('T')[0];
    const currentWeekIdx = activeBatch.weeks.findIndex(w => { return w.roles.date >= today; });
    if (currentWeekIdx === -1) currentWeekIdx = 4;
    const currentWeek = activeBatch.weeks[currentWeekIdx];
    document.getElementById('stat-next-date').innerText = currentWeek.roles.date || 'Not Set';
    document.getElementById('current-week-badge').innerText = `Week ${currentWeekIdx + 1}`;

    // 2. Session Summary
    // Replace your Session Summary section with this to handle Break Week gracefully:
    const isBreakWeek = (currentWeekIdx === 4);
    const displayTopic = isBreakWeek ? (currentWeek.roles.content || "Break Week") : (currentWeek.topic || "No Topic Assigned");
    const displayPresenter = isBreakWeek ? (currentWeek.roles.graphic || "-") : (currentWeek.roles.presenter || "-");
    const presenterLabel = isBreakWeek ? "Graphics" : "Presenter";

    document.getElementById('session-summary-content').innerHTML = `
    <div class="session-hero">
        <h2 class="session-title">${displayTopic}</h2>
    </div>
    
    <div class="session-meta-row">
        <div class="meta-item">
            <span class="meta-icon">${isBreakWeek ? '🎨' : '🎤'}</span>
            <div class="meta-text">
                <label>${presenterLabel}</label>
                <strong>${displayPresenter}</strong>
            </div>
        </div>
        <div class="meta-line-divider"></div>
        <div class="meta-item">
            <span class="meta-icon">📅</span>
            <div class="meta-text">
                <label>Date</label>
                <strong>${currentWeek.roles.date || '-'}</strong>
            </div>
        </div>
    </div>
`;
}

initLanding();