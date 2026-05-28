Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#2d3148';

const chartInstances = {};

function destroyChart(id) {
    if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function renderTrendChart(data, pollutant) {
    destroyChart('trend');
    const labels = data.map(r => r.recorded_at.slice(0, 16).replace('T', ' '));
    const values = data.map(r => r[pollutant] ?? r.aqi);
    const colors = values.map(v => aqiColor(v));

    chartInstances['trend'] = new Chart(document.getElementById('trend-chart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: pollutant.toUpperCase(),
                data: values,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,.15)',
                pointBackgroundColor: colors,
                pointRadius: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { maxTicksLimit: 12 } } }
        }
    });
}

function renderDailyChart(data) {
    destroyChart('daily');
    chartInstances['daily'] = new Chart(document.getElementById('daily-chart'), {
        type: 'bar',
        data: {
            labels: data.map(r => r.date),
            datasets: [
                {
                    label: 'Avg AQI',
                    data: data.map(r => r.avg_aqi),
                    backgroundColor: data.map(r => aqiColor(r.avg_aqi)),
                    borderRadius: 4
                },
                {
                    label: 'Max AQI',
                    data: data.map(r => r.max_aqi),
                    type: 'line',
                    borderColor: '#f87171',
                    backgroundColor: 'transparent',
                    pointRadius: 3,
                    tension: 0.3
                }
            ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
}

function renderHourlyChart(data) {
    destroyChart('hourly');
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const map = Object.fromEntries(data.map(r => [r.hour_of_day, r.avg_aqi]));
    const values = hours.map((_, i) => map[i] ?? null);

    chartInstances['hourly'] = new Chart(document.getElementById('hourly-chart'), {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                label: 'Avg AQI by Hour',
                data: values,
                backgroundColor: values.map(v => v ? aqiColor(v) : '#2d3148'),
                borderRadius: 3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { maxTicksLimit: 12 } } }
        }
    });
}

function renderCategoryChart(data) {
    destroyChart('category');
    chartInstances['category'] = new Chart(document.getElementById('category-chart'), {
        type: 'doughnut',
        data: {
            labels: data.map(r => r.aqi_category),
            datasets: [{
                data: data.map(r => r.count),
                backgroundColor: data.map(r => AQI_COLORS[r.aqi_category] || '#555'),
                borderWidth: 1,
                borderColor: '#1a1d27'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.raw} (${data[ctx.dataIndex].pct}%)`
                    }
                }
            }
        }
    });
}

function renderForecastChart(data) {
    destroyChart('forecast');
    chartInstances['forecast'] = new Chart(document.getElementById('forecast-chart'), {
        type: 'line',
        data: {
            labels: data.map(r => r.forecast_date),
            datasets: [{
                label: 'Predicted AQI',
                data: data.map(r => r.predicted_aqi),
                borderColor: '#a78bfa',
                backgroundColor: 'rgba(167,139,250,.15)',
                pointBackgroundColor: data.map(r => aqiColor(r.predicted_aqi)),
                pointRadius: 5,
                tension: 0.35,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: ctx => `Confidence: ${data[ctx.dataIndex].confidence_pct}%`
                    }
                }
            }
        }
    });
}
