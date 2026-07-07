async function apiFetch(path) {
    const res = await fetch(API_BASE + path, {
        headers: { 'Authorization': 'Bearer ' + Auth.getToken() }
    });

    if (res.status === 401) {
        Auth.logout();
        throw new Error('Session expired, please sign in again');
    }
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json();
}

const Api = {
    locations: () => apiFetch('/locations'),
    latest:    () => apiFetch('/readings/latest'),
    alerts:    () => apiFetch('/alerts'),

    readings: (loc, from, to, pollutant) =>
        apiFetch(`/readings?location_id=${loc}&from=${from}&to=${to}&pollutant=${pollutant}`),

    daily: (loc, from, to) =>
        apiFetch(`/readings/daily?location_id=${loc}&from=${from}&to=${to}&pollutant=aqi`),

    hourly: (loc, from, to) =>
        apiFetch(`/readings/peak-hours?location_id=${loc}&from=${from}&to=${to}&pollutant=aqi`),

    breakdown: (loc, from, to) =>
        apiFetch(`/readings/category-breakdown?location_id=${loc}&from=${from}&to=${to}&pollutant=aqi`),

    forecast: (loc) =>
        apiFetch(`/forecast?location_id=${loc}`)
};
