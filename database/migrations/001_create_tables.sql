-- Air Quality Monitoring Database Schema
-- Run this file to set up the database

CREATE DATABASE IF NOT EXISTS air_quality_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE air_quality_db;

-- Cities / Locations
CREATE TABLE IF NOT EXISTS locations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pollutant readings (time-series data)
CREATE TABLE IF NOT EXISTS air_quality_readings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    location_id INT UNSIGNED NOT NULL,
    recorded_at DATETIME NOT NULL,
    aqi SMALLINT UNSIGNED,
    pm25 DECIMAL(8,2),       -- PM2.5 µg/m³
    pm10 DECIMAL(8,2),       -- PM10 µg/m³
    co DECIMAL(8,4),         -- CO ppm
    no2 DECIMAL(8,4),        -- NO2 ppb
    so2 DECIMAL(8,4),        -- SO2 ppb
    o3 DECIMAL(8,4),         -- O3 ppb
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    aqi_category ENUM('Good','Satisfactory','Moderate','Poor','Very Poor','Severe') GENERATED ALWAYS AS (
        CASE
            WHEN aqi <= 50  THEN 'Good'
            WHEN aqi <= 100 THEN 'Satisfactory'
            WHEN aqi <= 200 THEN 'Moderate'
            WHEN aqi <= 300 THEN 'Poor'
            WHEN aqi <= 400 THEN 'Very Poor'
            ELSE 'Severe'
        END
    ) STORED,
    source VARCHAR(50) DEFAULT 'sensor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_readings_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    INDEX idx_location_time (location_id, recorded_at),
    INDEX idx_recorded_at (recorded_at),
    INDEX idx_aqi (aqi)
);

-- Forecasted AQI values
CREATE TABLE IF NOT EXISTS aqi_forecasts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    location_id INT UNSIGNED NOT NULL,
    forecast_date DATE NOT NULL,
    predicted_aqi SMALLINT UNSIGNED,
    confidence_pct TINYINT UNSIGNED,
    model_version VARCHAR(20) DEFAULT 'v1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_forecast_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE KEY uk_location_date (location_id, forecast_date)
);

-- Hazard alerts
CREATE TABLE IF NOT EXISTS alerts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    location_id INT UNSIGNED NOT NULL,
    triggered_at DATETIME NOT NULL,
    aqi_threshold SMALLINT UNSIGNED NOT NULL,
    actual_aqi SMALLINT UNSIGNED NOT NULL,
    message VARCHAR(255),
    resolved_at DATETIME,
    CONSTRAINT fk_alert_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    INDEX idx_alert_location_time (location_id, triggered_at)
);

-- Sample locations (Indian cities)
INSERT IGNORE INTO locations (city, state, country, latitude, longitude) VALUES
('Delhi', 'Delhi', 'India', 28.6139, 77.2090),
('Mumbai', 'Maharashtra', 'India', 19.0760, 72.8777),
('Bengaluru', 'Karnataka', 'India', 12.9716, 77.5946),
('Kolkata', 'West Bengal', 'India', 22.5726, 88.3639),
('Chennai', 'Tamil Nadu', 'India', 13.0827, 80.2707),
('Hyderabad', 'Telangana', 'India', 17.3850, 78.4867),
('Noida', 'Uttar Pradesh', 'India', 28.5355, 77.3910),
('Gurugram', 'Haryana', 'India', 28.4595, 77.0266),
('Pune', 'Maharashtra', 'India', 18.5204, 73.8567),
('Ahmedabad', 'Gujarat', 'India', 23.0225, 72.5714);
