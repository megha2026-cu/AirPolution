# Air Quality Monitoring & Pollution Trend Visualization Dashboard

**Enrolled:** 01/04/2026 | **Group:** UG/Dr. Vandana/7/2026/15 | **Organization:** Plag Pro, Noida

---

## Project Objectives
Design and implement an interactive air quality monitoring dashboard that visualizes pollution levels, AQI, and pollutant concentration trends across regions and time periods. Supports environmental monitoring, public awareness, and policy decision-making via real-time or historical data analytics.

---

## Milestones (6 total)

| # | Title | Deliverable |
|---|-------|-------------|
| 1 | Data Collection & Preprocessing | Cleaned dataset (CSV), outlier report |
| 2 | Database Design & ETL | ER diagram, SQL schema, ETL pipeline |
| 3 | Backend API | Node.js REST API + docs |
| 4 | Frontend Dashboard | Interactive HTML/JS dashboard |
| 5 | Forecasting & Alerts | 7-day AQI prediction, alert system |
| 6 | Testing, Docs & Final Report | Test report, final documentation |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | MySQL 8 |
| Frontend | Vanilla JS + Chart.js |
| Scheduling | node-cron |
| Data Source | CPCB / WHO / Simulated IoT |

---

## Key KPIs
- Average AQI (daily / period)
- Peak pollution hours
- Safe vs hazardous day count
- Pollutant concentration trends (PM2.5, PM10, CO, NO₂, SO₂, O₃)

---

## Setup Instructions

### 1. Database
```sql
-- Run once:
mysql -u root -p < database/migrations/001_create_tables.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in DB credentials
npm install
node ../data/seed_sample_data.js   # optional: load sample data
npm start
```

### 3. Frontend
Open `frontend/index.html` in a browser (or serve via any HTTP server).
Update `frontend/js/config.js → API_BASE` if backend runs on a different host/port.

---

## Security Notes
- Never commit `backend/.env` — it is in `.gitignore`
- All API inputs are validated with Joi before reaching the database
- Rate limiting is enforced on all `/api` routes (100 req / 15 min by default)
- SQL queries use parameterized statements only — no string interpolation
