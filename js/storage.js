// 1. Initialize Supabase
const supabaseUrl = 'https://hsusuvqdjqklfrgfwuzx.supabase.co';
const supabaseKey = 'sb_publishable_m3UdjeXLlXk1ivVZTAjEag_yvXGOSPN'; 
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

/**
 * Saves data to Supabase site_data table
 */
async function save(key, data) {
    // Keep a local copy for speed
    localStorage.setItem(key, JSON.stringify(data));

    try {
        const { error } = await _supabase
            .from('site_data')
            .upsert({ id: key, content: data });

        if (error) throw error;
    } catch (err) {
        console.error("Cloud Save Failed:", err.message);
    }
}

/**
 * Loads data from Supabase site_data table
 */
async function load(key) {
    try {
        const { data, error } = await _supabase
            .from('site_data')
            .select('content')
            .eq('id', key)
            .single();

        if (error) throw error;
        return data ? data.content : null;
    } catch (err) {
        console.warn(`Cloud Load Failed for ${key}, checking LocalStorage...`);
        const localData = localStorage.getItem(key);
        return localData ? JSON.parse(localData) : null;
    }
}