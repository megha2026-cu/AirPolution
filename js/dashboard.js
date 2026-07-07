const locationSelect = document.getElementById('location-select');
const dateFrom       = document.getElementById('date-from');
const dateTo         = document.getElementById('date-to');
const pollutantSelect= document.getElementById('pollutant-select');
const btnApply       = document.getElementById('btn-apply');

document.getElementById('btn-logout').addEventListener('click', Auth.logout);

// Default date range: last 7 days
(function setDefaultDates() {
    const to   = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    dateTo.value   = to.toISOString().slice(0, 10);
    dateFrom.value = from.toISOString().slice(0, 10);
})();

async function loadLocations() {
    try {
        const { data } = await Api.locations();
        data.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc.id;
            opt.textContent = `${loc.city}${loc.state ? ', ' + loc.state : ''}`;
            locationSelect.appendChild(opt);
        });
        if (data.length) loadDashboard();
    } catch (e) {
        console.error('Failed to load locations:', e);
    }
}

async function loadDashboard() {
    const loc      = locationSelect.value;
    const from     = dateFrom.value + 'T00:00:00';
    const to       = dateTo.value   + 'T23:59:59';
    const pollutant= pollutantSelect.value;

    try {
        const [readRes, dailyRes, hourlyRes, catRes, fcastRes, latestRes, alertsRes] = await Promise.all([
            Api.readings(loc, from, to, pollutant),
            Api.daily(loc, from, to),
            Api.hourly(loc, from, to),
            Api.breakdown(loc, from, to),
            Api.forecast(loc),
            Api.latest(),
            Api.alerts()
        ]);

        updateKpis(readRes.data, dailyRes.data);
        renderTrendChart(readRes.data, pollutant);
        renderDailyChart(dailyRes.data);
        renderHourlyChart(hourlyRes.data);
        renderCategoryChart(catRes.data);
        renderForecastChart(fcastRes.data);
        renderCitiesTable(latestRes.data);
        renderAlerts(alertsRes.data);

        document.getElementById('last-updated').textContent =
            'Last updated: ' + new Date().toLocaleTimeString();
    } catch (e) {
        console.error('Dashboard load error:', e);
    }
}

function updateKpis(readings, daily) {
    const latest = readings[readings.length - 1];
    const kpiCard  = document.getElementById('kpi-aqi');
    const kpiVal   = kpiCard.querySelector('.kpi-value');
    const kpiCat   = kpiCard.querySelector('.kpi-category');

    if (latest) {
        const aqi = latest.aqi;
        const cat = aqiCategory(aqi);
        kpiVal.textContent = aqi;
        kpiVal.style.color = aqiColor(aqi);
        kpiCat.textContent = cat;
        kpiCat.style.background = aqiColor(aqi) + '33';
        kpiCat.style.color      = aqiColor(aqi);
    }

    if (daily.length) {
        const allAvg  = daily.map(d => d.avg_aqi);
        const allPeak = daily.map(d => d.max_aqi);
        const avg  = Math.round(allAvg.reduce((a, b) => a + b, 0) / allAvg.length);
        const peak = Math.max(...allPeak);
        const safe = daily.filter(d => d.avg_aqi <= 100).length;
        const haz  = daily.filter(d => d.avg_aqi >  300).length;

        document.getElementById('kpi-avg').textContent   = avg;
        document.getElementById('kpi-avg').style.color   = aqiColor(avg);
        document.getElementById('kpi-peak').textContent  = peak;
        document.getElementById('kpi-peak').style.color  = aqiColor(peak);
        document.getElementById('kpi-safe').textContent  = safe;
        document.getElementById('kpi-hazard').textContent= haz;
    }
}

function renderCitiesTable(data) {
    const tbody = document.getElementById('cities-tbody');
    tbody.innerHTML = '';
    data.forEach(row => {
        const cat = row.aqi_category || aqiCategory(row.aqi);
        const cls = 'badge badge-' + cat.replace(' ', '-');
        const time = row.recorded_at ? row.recorded_at.slice(0, 16).replace('T', ' ') : '—';
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><strong>${row.city}</strong>${row.state ? '<br><small style="color:#64748b">' + row.state + '</small>' : ''}</td>
                <td style="color:${aqiColor(row.aqi)};font-weight:700">${row.aqi ?? '—'}</td>
                <td><span class="${cls}">${cat}</span></td>
                <td>${row.pm25 ?? '—'}</td>
                <td>${row.pm10 ?? '—'}</td>
                <td>${row.temperature ?? '—'}</td>
                <td>${row.humidity ?? '—'}</td>
                <td style="font-size:.8rem;color:#64748b">${time}</td>
            </tr>
        `);
    });
    if (!data.length) tbody.innerHTML = '<tr><td colspan="8" style="color:#64748b;padding:.8rem">No data available</td></tr>';
}

function renderAlerts(data) {
    const list  = document.getElementById('alerts-list');
    const badge = document.getElementById('alert-badge');
    list.innerHTML = '';

    if (!data.length) {
        list.innerHTML = '<li class="no-alerts" style="background:none;border:none;color:#64748b">No active hazard alerts</li>';
        badge.classList.add('hidden');
        return;
    }

    badge.classList.remove('hidden');
    data.forEach(a => {
        list.insertAdjacentHTML('beforeend', `
            <li>&#9888; <strong>${a.city}</strong> — AQI ${a.actual_aqi} — ${a.message} <span style="margin-left:auto;font-size:.75rem;color:#94a3b8">${a.triggered_at.slice(0, 16)}</span></li>
        `);
    });
}

btnApply.addEventListener('click', loadDashboard);

// Auto-refresh every 5 minutes
setInterval(loadDashboard, 5 * 60 * 1000);

// Init
loadLocations();
