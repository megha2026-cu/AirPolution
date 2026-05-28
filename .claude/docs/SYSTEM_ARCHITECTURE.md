# System Architecture — Air Quality Monitoring & Pollution Trend Visualization Dashboard

**Group:** UG/Dr. Vandana/7/2026/15 | **Org:** Plag Pro, Noida

---

## 1. Architecture Overview

The system follows a 3-tier architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│   Browser → index.html + Chart.js + Vanilla JS          │
│   Filters: City | Date Range | Pollutant | AQI Category │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP REST (port 3000)
┌────────────────────────▼────────────────────────────────┐
│                    API LAYER (Node.js + Express)         │
│   Routes → Controllers → Joi Validation → Rate Limiter  │
│   Cron Jobs: Forecast regeneration | Alert detection    │
└────────────────────────┬────────────────────────────────┘
                         │ mysql2 connection pool
┌────────────────────────▼────────────────────────────────┐
│                   DATA LAYER (MySQL 8)                   │
│   locations | air_quality_readings | aqi_forecasts |    │
│   alerts                                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer       | Technology          | Purpose                              |
|-------------|---------------------|--------------------------------------|
| Frontend    | HTML5 + Vanilla JS  | Dashboard UI                         |
| Charts      | Chart.js            | Interactive pollutant visualizations |
| Backend     | Node.js v18 + Express | REST API server                   |
| Database    | MySQL 8             | Time-series pollution data storage   |
| Scheduling  | node-cron           | Forecast & alert automation          |
| Validation  | Joi                 | Input sanitization                   |
| Security    | Helmet + Rate Limiter | HTTP hardening                    |
| ETL         | Custom Node.js script | CSV → DB import pipeline           |

---

## 3. Database Schema

### 3.1 Table: `locations`
Stores Indian city reference data.

| Column     | Type              | Notes            |
|------------|-------------------|------------------|
| id         | INT UNSIGNED PK   | Auto-increment   |
| city       | VARCHAR(100)      | City name        |
| state      | VARCHAR(100)      | State name       |
| country    | VARCHAR(100)      | Default: India   |
| latitude   | DECIMAL(10,6)     |                  |
| longitude  | DECIMAL(10,6)     |                  |
| created_at | TIMESTAMP         |                  |

### 3.2 Table: `air_quality_readings`
Core time-series pollutant measurements.

| Column       | Type              | Notes                          |
|--------------|-------------------|--------------------------------|
| id           | BIGINT UNSIGNED PK|                                |
| location_id  | INT UNSIGNED FK   | → locations.id                 |
| recorded_at  | DATETIME          | Measurement timestamp          |
| aqi          | SMALLINT          | Air Quality Index (0–500)      |
| pm25         | DECIMAL(8,2)      | PM2.5 µg/m³                   |
| pm10         | DECIMAL(8,2)      | PM10 µg/m³                    |
| co           | DECIMAL(8,4)      | CO ppm                         |
| no2          | DECIMAL(8,4)      | NO₂ ppb                       |
| so2          | DECIMAL(8,4)      | SO₂ ppb                       |
| o3           | DECIMAL(8,4)      | O₃ ppb                        |
| temperature  | DECIMAL(5,2)      | °C                             |
| humidity     | DECIMAL(5,2)      | %                              |
| aqi_category | ENUM (generated)  | Auto-computed from AQI value   |
| source       | VARCHAR(50)       | sensor / csv_import / seed     |

**Indexes:** `(location_id, recorded_at)`, `aqi`, `recorded_at`

### 3.3 Table: `aqi_forecasts`
7-day AQI predictions per city.

| Column        | Type             | Notes                        |
|---------------|------------------|------------------------------|
| id            | BIGINT UNSIGNED  |                              |
| location_id   | FK → locations   |                              |
| forecast_date | DATE             | Unique per location+date     |
| predicted_aqi | SMALLINT         | Moving average + jitter      |
| confidence_pct| TINYINT          | 90% → 55% over 7 days        |
| model_version | VARCHAR(20)      | v1                           |

### 3.4 Table: `alerts`
Hazardous AQI events (threshold > 300).

| Column        | Type         | Notes              |
|---------------|--------------|--------------------|
| id            | INT UNSIGNED |                    |
| location_id   | FK           |                    |
| triggered_at  | DATETIME     |                    |
| aqi_threshold | SMALLINT     | Always 300         |
| actual_aqi    | SMALLINT     | Reading that fired |
| message       | VARCHAR(255) |                    |
| resolved_at   | DATETIME     | NULL if active     |

---

## 4. API Endpoints

| Method | Endpoint                              | Description                     |
|--------|---------------------------------------|---------------------------------|
| GET    | `/api/health`                         | Health check                    |
| GET    | `/api/locations`                      | List all cities                 |
| POST   | `/api/locations`                      | Add new city                    |
| GET    | `/api/readings`                       | Raw readings (filtered)         |
| GET    | `/api/readings/latest`                | Latest reading per city         |
| GET    | `/api/readings/daily`                 | Daily AQI summary               |
| GET    | `/api/readings/hourly`                | Hourly averages                 |
| GET    | `/api/readings/peak-hours`            | Peak pollution hour breakdown   |
| GET    | `/api/readings/category-breakdown`    | AQI category % distribution     |
| GET    | `/api/forecast`                       | 7-day AQI forecast              |
| GET    | `/api/alerts`                         | Active hazard alerts            |

All endpoints use parameterized SQL queries. All inputs validated via Joi.

---

## 5. KPI Definitions

| KPI                        | Calculation                                   |
|----------------------------|-----------------------------------------------|
| Average AQI                | `AVG(aqi)` over selected date range           |
| Peak AQI                   | `MAX(aqi)` over selected date range           |
| Safe Days                  | Days where daily avg AQI ≤ 100               |
| Hazardous Days             | Days where daily avg AQI > 300               |
| Peak Pollution Hour        | Hour of day with highest avg AQI             |
| Pollutant Trend            | Daily avg of pm25/pm10/co/no2/so2/o3         |

---

## 6. Forecasting Model

- **Method:** 14-day moving average with randomized jitter (±10 AQI)
- **Horizon:** 7 days ahead
- **Confidence:** Starts at 90%, decreases by ~5% per day (min 55%)
- **Schedule:** Regenerated daily at 01:00 via node-cron
- **Version:** v1 (stored in `aqi_forecasts.model_version`)

---

## 7. Alert System

- **Trigger:** AQI > 300 detected in latest reading per city
- **Check frequency:** Every 30 minutes via node-cron
- **Storage:** `alerts` table with triggered_at and message
- **Frontend:** Pulsing red badge in dashboard header

---

## 8. Data Flow

```
CSV File / IoT Sensor
        │
        ▼
  ETL Pipeline (etl_import.js)
  - Parse CSV columns
  - Clean & validate values
  - Detect outliers (clamp to valid range)
  - Batch insert (200 rows/batch)
        │
        ▼
  air_quality_readings (MySQL)
        │
        ├──► /api/readings/*   → Frontend charts
        ├──► /api/forecast     → 7-day prediction
        └──► /api/alerts       → Hazard notifications
```

---

## 9. Security Measures

- All SQL uses parameterized queries (no string interpolation)
- Joi validation on all API inputs before DB access
- Helmet middleware sets secure HTTP headers
- Rate limiting: 100 requests per 15 minutes per IP
- DB credentials stored in `.env` (gitignored)
- No secrets exposed in frontend code

---

## 10. Project Files

```
AirPolution/
├── backend/
│   ├── server.js              Express app + cron jobs
│   ├── config/db.js           MySQL connection pool
│   ├── controllers/           Business logic per resource
│   ├── middleware/            Rate limiter + Joi validator
│   └── routes/api.js          Route definitions
├── frontend/
│   ├── index.html             Main dashboard
│   ├── css/style.css          Responsive grid layout
│   └── js/                    Chart.js + API calls
├── database/
│   └── migrations/001_create_tables.sql
├── data/
│   ├── seed_sample_data.js    30-day sample data generator
│   └── etl_import.js          CSV ETL pipeline
├── tests/
│   └── test_api.js            27-test API + stream test suite
└── docs/
    ├── PROJECT_PLAN.md
    ├── SYSTEM_ARCHITECTURE.md  ← this file
    └── er_diagram.html         Visual ER diagram
```
