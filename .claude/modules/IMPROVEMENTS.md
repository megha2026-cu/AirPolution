# Module Improvement Notes
# Air Quality Monitoring & Pollution Trend Visualization Dashboard

---

## How to use this folder
Add one `.md` file per module whenever you plan an improvement, bug fix, or new feature.
Each file should follow the structure below.

---

## Pending Improvements

### 1. ETL Pipeline
- Add support for real CPCB API data ingestion (live sensor feed)
- Add email/SMS notification on ETL failure
- Log import history to a separate `etl_logs` table

### 2. Forecasting Model
- Upgrade from moving average to ARIMA or Prophet model
- Add model accuracy tracking (compare predicted vs actual AQI)
- Support per-pollutant forecasting (not just AQI)

### 3. Backend API
- Add POST /api/readings endpoint for real-time sensor push
- Add pagination to /api/readings for large date ranges
- Add Swagger / OpenAPI auto-generated documentation

### 4. Frontend Dashboard
- Add city comparison view (multiple cities on one chart)
- Add map view (Leaflet.js) showing city AQI as color-coded pins
- Add dark mode toggle
- Add CSV export button for chart data

### 5. Alert System
- Add email/SMS notifications on hazard alert trigger
- Add alert resolution workflow (mark as resolved from dashboard)
- Support configurable threshold per city

### 6. Testing
- Add load testing with Artillery or k6
- Add integration tests that hit a test database
- Add frontend UI tests with Playwright

### 7. Infrastructure
- Dockerize the full stack (backend + MySQL)
- Add CI/CD pipeline (GitHub Actions)
- Add environment-based config (dev / staging / prod)

---

## Completed Modules

| Module | Status | Notes |
|--------|--------|-------|
| Database schema | ✅ Complete | 4 tables, indexed, FK constraints |
| ETL pipeline | ✅ Complete | CSV import with outlier detection |
| REST API | ✅ Complete | 11 endpoints, Joi validation, rate limiting |
| Dashboard | ✅ Complete | 6 Chart.js charts, responsive layout |
| Forecasting | ✅ Complete | 7-day moving average model |
| Alert system | ✅ Complete | Auto-check every 30 min via cron |
| Test suite | ✅ Complete | 27/27 tests passing |
| Documentation | ✅ Complete | PDF, PPT, ER diagram, architecture doc |
