function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function load(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
}