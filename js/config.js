// Change this to your backend URL when deployed
const API_BASE = 'http://10.10.10.145:3000/api';

const AQI_COLORS = {
    Good:         '#00b050',
    Satisfactory: '#92d050',
    Moderate:     '#ffbf00',
    Poor:         '#ff6600',
    'Very Poor':  '#cc0000',
    Severe:       '#7b0000'
};

function aqiColor(aqi) {
    if (aqi <= 50)  return AQI_COLORS.Good;
    if (aqi <= 100) return AQI_COLORS.Satisfactory;
    if (aqi <= 200) return AQI_COLORS.Moderate;
    if (aqi <= 300) return AQI_COLORS.Poor;
    if (aqi <= 400) return AQI_COLORS['Very Poor'];
    return AQI_COLORS.Severe;
}

function aqiCategory(aqi) {
    if (aqi <= 50)  return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
}
