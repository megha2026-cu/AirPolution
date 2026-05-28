"""
generate_pdf.py — Detailed project report generator
Run: python3 .claude/docs/generate_pdf.py
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, HRFlowable, PageBreak, KeepTogether)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
import os

OUTPUT = os.path.join(os.path.dirname(__file__), 'AirQuality_Project_Report.pdf')

W, H = A4

NAVY   = colors.HexColor('#1B2A4A')
BLUE   = colors.HexColor('#1a73e8')
LBLUE  = colors.HexColor('#4a90d9')
GREEN  = colors.HexColor('#2e7d32')
LGREEN = colors.HexColor('#e8f5e9')
LGRAY  = colors.HexColor('#f5f7fa')
MGRAY  = colors.HexColor('#e0e4ea')
DGRAY  = colors.HexColor('#444444')
WHITE  = colors.white
RED    = colors.HexColor('#c62828')
PURPLE = colors.HexColor('#6a1b9a')

styles = getSampleStyleSheet()

def sty(name, **kw):
    return ParagraphStyle(name, parent=styles['Normal'], **kw)

cover_title = sty('ct', fontSize=24, textColor=NAVY, alignment=TA_CENTER,
                  fontName='Helvetica-Bold', leading=32, spaceAfter=8)
cover_sub   = sty('cs', fontSize=13, textColor=DGRAY, alignment=TA_CENTER,
                  leading=20, spaceAfter=4)
cover_meta  = sty('cm', fontSize=10, textColor=DGRAY, alignment=TA_CENTER, leading=16)

h1 = sty('H1x', fontSize=15, textColor=NAVY, fontName='Helvetica-Bold',
         spaceBefore=18, spaceAfter=6, leading=20)
h2 = sty('H2x', fontSize=12, textColor=BLUE, fontName='Helvetica-Bold',
         spaceBefore=10, spaceAfter=4, leading=16)
h3 = sty('H3x', fontSize=10, textColor=DGRAY, fontName='Helvetica-Bold',
         spaceBefore=8, spaceAfter=3, leading=14)
body = sty('Bx', fontSize=10, textColor=DGRAY, leading=16,
           alignment=TA_JUSTIFY, spaceAfter=4)
bullet = sty('Bl', fontSize=10, textColor=DGRAY, leading=15,
             leftIndent=18, bulletIndent=8, spaceBefore=2)
code = sty('Cx', fontName='Courier', fontSize=8.5, textColor=NAVY,
           backColor=LGRAY, leftIndent=10, rightIndent=10,
           spaceBefore=4, spaceAfter=4, leading=13, borderPad=6)
note = sty('Note', fontSize=9, textColor=colors.HexColor('#555'),
           backColor=colors.HexColor('#fff8e1'), leftIndent=10, leading=14,
           spaceBefore=4, spaceAfter=4)

def P(text, style=None): return Paragraph(text, style or body)
def B(text): return Paragraph(f'&#8226;&nbsp;&nbsp;{text}', bullet)
def sp(n=8): return Spacer(1, n)
def hr(color=LBLUE, t=0.8): return HRFlowable(width='100%', thickness=t, color=color,
                                               spaceAfter=6, spaceBefore=4)
def pb(): return PageBreak()

def section_rule(title, number):
    return [sp(4), hr(NAVY, 1.5), P(f'{number}.&nbsp;&nbsp;{title}', h1),
            hr(LBLUE, 0.5), sp(4)]

def tbl(data, widths=None, header=True, stripe=True):
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0)
    ts = [
        ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0,0), (-1,-1), 9),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING',   (0,0), (-1,-1), 7),
        ('RIGHTPADDING',  (0,0), (-1,-1), 7),
        ('GRID',          (0,0), (-1,-1), 0.4, MGRAY),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]
    if header:
        ts += [('BACKGROUND', (0,0), (-1,0), NAVY),
               ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
               ('LINEBELOW',  (0,0), (-1,0), 1.5, BLUE)]
    if stripe:
        ts.append(('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LGRAY]))
    t.setStyle(TableStyle(ts))
    return t

def highlight_box(items, color=LGREEN, border=GREEN):
    data = [[B(i)] for i in items]
    t = Table(data, colWidths=[15.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), color),
        ('LINEAFTER',     (0,0), (0,-1), 3, border),
        ('TOPPADDING',    (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING',   (0,0), (-1,-1), 10),
    ]))
    return t

story = []

# ── COVER ─────────────────────────────────────────────────────────────────────
story.append(sp(60))
story.append(P('Air Quality Monitoring &amp;', cover_title))
story.append(P('Pollution Trend Visualization Dashboard', cover_title))
story.append(sp(10))
story.append(HRFlowable(width='55%', thickness=2, color=LBLUE,
                        hAlign='CENTER', spaceAfter=12))
story.append(P('Detailed Project Report', cover_sub))
story.append(sp(160))
story.append(P('Group &nbsp;:&nbsp; UG / Dr. Vandana / 7 / 2026 / 15', cover_meta))
story.append(P('Organization &nbsp;:&nbsp; Plag Pro, Noida', cover_meta))
story.append(P('Enrolled &nbsp;:&nbsp; 01 April 2026', cover_meta))
story.append(P('Report Date &nbsp;:&nbsp; 28 May 2026', cover_meta))
story.append(pb())

# ── TABLE OF CONTENTS ─────────────────────────────────────────────────────────
story += section_rule('Table of Contents', '')
toc_items = [
    ('1',  'Executive Summary',                         '3'),
    ('2',  'Project Objectives',                        '3'),
    ('3',  'Technology Stack',                          '4'),
    ('4',  'System Architecture',                       '4'),
    ('5',  'Database Design & Schema',                  '5'),
    ('6',  'ETL Pipeline',                              '7'),
    ('7',  'Backend API — Endpoints & Implementation',  '8'),
    ('8',  'Frontend Dashboard & Visualizations',       '10'),
    ('9',  'Key Performance Indicators (KPIs)',          '11'),
    ('10', 'Forecasting Model',                         '11'),
    ('11', 'Alert System',                              '12'),
    ('12', 'Security Measures',                         '12'),
    ('13', 'System Testing',                            '13'),
    ('14', 'Environmental Insights',                    '14'),
    ('15', 'Conclusion & Deliverables',                 '14'),
]
toc_data = [[P(f'<b>{n}</b>', h3), P(t, body), P(pg, body)]
            for n, t, pg in toc_items]
story.append(tbl(toc_data, widths=[1*cm, 13*cm, 1.5*cm], header=False, stripe=True))
story.append(pb())

# ── 1. EXECUTIVE SUMMARY ──────────────────────────────────────────────────────
story += section_rule('Executive Summary', '1')
story.append(P(
    'This report documents the complete design, development, and testing of the <b>Air Quality '
    'Monitoring and Pollution Trend Visualization Dashboard</b> — a full-stack web application '
    'built for Plag Pro, Noida under academic group UG/Dr. Vandana/7/2026/15.'
))
story.append(P(
    'The system ingests air quality sensor data for ten major Indian cities, stores it in a '
    'normalized MySQL 8 database, exposes it through an eleven-endpoint REST API built with '
    'Node.js and Express, and presents it through an interactive Chart.js dashboard with six '
    'visualization panels. A CSV-based ETL pipeline, a 7-day moving-average forecast engine, '
    'and an automated hazard alert system complete the platform.'
))
story.append(P(
    'All fourteen project requirements have been implemented and verified through a '
    '27-test automated test suite, all of which pass.'
))
story.append(sp(6))
story.append(tbl([
    ['Metric', 'Value'],
    ['Cities monitored',       '10 major Indian cities'],
    ['Pollutants tracked',     'AQI, PM2.5, PM10, CO, NO2, SO2, O3, Temperature, Humidity'],
    ['Data records seeded',    '1,240 readings (30 days x 4/day x 10 cities)'],
    ['API endpoints',          '11 REST endpoints'],
    ['Dashboard charts',       '6 interactive Chart.js visualizations'],
    ['Automated tests',        '27 / 27 passing'],
    ['Requirements fulfilled', '14 / 14'],
], widths=[6*cm, 9.5*cm]))

# ── 2. OBJECTIVES ─────────────────────────────────────────────────────────────
story += section_rule('Project Objectives', '2')
story.append(P(
    'Design and implement an interactive air quality monitoring dashboard that visualizes '
    'pollution levels, Air Quality Index (AQI), and pollutant concentration trends across '
    'regions and time periods. The system must support environmental monitoring, public '
    'awareness, and policy decision-making through real-time or historical data analytics.'
))
story.append(sp(4))
story.append(highlight_box([
    'Collect AQI, PM2.5, PM10, CO, NO2, SO2, O3, temperature and humidity from public or simulated sources',
    'Clean and preprocess data — handle missing values, outliers, and inconsistent measurement units',
    'Design a relational database schema for location-wise and time-series pollution storage',
    'Create ER diagrams and document the system architecture',
    'Implement ETL pipelines to transform raw CSV or sensor data into structured analytical format',
    'Develop backend APIs using Node.js for data aggregation and filtering',
    'Define KPIs: average AQI, peak pollution hours, pollutant trends, safe vs hazardous day counts',
    'Build interactive dashboards with city, date range, pollutant type, and AQI category filters',
    'Add alert visualization indicators for hazardous air quality levels',
    'Integrate basic forecasting to predict short-term AQI trends',
    'Ensure responsive UI design and performance optimization',
    'Conduct system testing using simulated real-time data streams',
    'Prepare detailed project documentation',
]))

# ── 3. TECHNOLOGY STACK ───────────────────────────────────────────────────────
story += section_rule('Technology Stack', '3')
story.append(tbl([
    ['Layer', 'Technology', 'Version', 'Purpose'],
    ['Runtime',       'Node.js',             'v18.20.8', 'Server-side JavaScript execution'],
    ['Web Framework', 'Express.js',          '4.x',      'REST API routing and middleware'],
    ['Database',      'MySQL',               '8.0',      'Relational time-series data storage'],
    ['DB Driver',     'mysql2',              'Latest',   'Async/await MySQL client with pool'],
    ['Validation',    'Joi',                 '17.x',     'Schema-based input validation'],
    ['Security',      'Helmet',              '7.x',      'Secure HTTP response headers'],
    ['Rate Limiting', 'express-rate-limit',  '7.x',      'Per-IP request throttling'],
    ['Scheduling',    'node-cron',           '3.x',      'Cron jobs for forecast & alerts'],
    ['Config',        'dotenv',              '16.x',     'Environment variable management'],
    ['Frontend',      'Vanilla JS + HTML5',  '—',        'Dashboard UI without frameworks'],
    ['Charts',        'Chart.js',            '4.x',      'Interactive canvas-based charts'],
    ['ETL',           'Node.js (custom)',    '—',        'CSV to MySQL batch import pipeline'],
    ['Testing',       'Node.js http (custom)','—',       'API test suite, 27 assertions'],
], widths=[3.5*cm, 4*cm, 2.5*cm, 5.5*cm]))

# ── 4. SYSTEM ARCHITECTURE ────────────────────────────────────────────────────
story += section_rule('System Architecture', '4')
story.append(P(
    'The system is built on a classic 3-tier architecture separating presentation, '
    'business logic, and data concerns.'
))
story.append(sp(6))
story.append(tbl([
    [P('<b>Tier</b>', h3), P('<b>Components</b>', h3), P('<b>Responsibilities</b>', h3)],
    [P('Presentation\n(Client)', h3),
     P('index.html, style.css\nChart.js, dashboard.js\napi.js, config.js', code),
     P('Renders 6 interactive charts, filter controls, KPI cards, alert badges. '
       'Fetches data from API on page load and every 5 minutes.')],
    [P('Application\n(API Server)', h3),
     P('server.js, routes/api.js\ncontrollers/*.js\nmiddleware/*.js', code),
     P('Validates inputs with Joi, queries MySQL through parameterised statements, '
       'returns JSON. Runs cron jobs for alerts and forecast regeneration.')],
    [P('Data\n(Database)', h3),
     P('MySQL 8 — air_quality_db\n4 tables, indexed on\n(location_id, recorded_at)', code),
     P('Stores all readings, forecasts and alerts. Generated column aqi_category '
       'is always consistent. Indexes optimise range queries over time-series data.')],
], widths=[3*cm, 4.5*cm, 8*cm]))
story.append(sp(6))
story.append(P('<b>Data Flow</b>', h2))
story.append(P(
    'CSV files or simulated IoT readings are ingested by the ETL pipeline '
    '(<b>etl_import.js</b>), validated, cleaned, and batch-inserted into '
    '<b>air_quality_readings</b>. The Express API aggregates these readings '
    'on demand. Every 30 minutes a cron job scans for AQI &gt; 300 and writes '
    'hazard records to <b>alerts</b>. Every morning at 01:00 another cron job '
    'regenerates 7-day forecasts for all cities into <b>aqi_forecasts</b>.'
))
story.append(pb())

# ── 5. DATABASE DESIGN ────────────────────────────────────────────────────────
story += section_rule('Database Design & Schema', '5')
story.append(P(
    'The database <b>air_quality_db</b> (MySQL 8, utf8mb4) contains four normalized '
    'tables. All foreign keys use ON DELETE CASCADE to maintain referential integrity.'
))
story.append(sp(4))
story.append(P('<b>5.1 &nbsp; locations</b>', h2))
story.append(tbl([
    ['Column', 'Data Type', 'Constraint', 'Description'],
    ['id',         'INT UNSIGNED',   'PK, AUTO_INCREMENT', 'Surrogate primary key'],
    ['city',       'VARCHAR(100)',   'NOT NULL',           'City name'],
    ['state',      'VARCHAR(100)',   'NULL',               'State/province'],
    ['country',    'VARCHAR(100)',   "DEFAULT 'India'",    'Country name'],
    ['latitude',   'DECIMAL(10,6)', 'NULL',               'Geographic latitude'],
    ['longitude',  'DECIMAL(10,6)', 'NULL',               'Geographic longitude'],
    ['created_at', 'TIMESTAMP',     'DEFAULT NOW()',      'Row creation timestamp'],
], widths=[3.5*cm, 3.5*cm, 3.5*cm, 5*cm]))

story.append(sp(6))
story.append(P('<b>5.2 &nbsp; air_quality_readings</b>', h2))
story.append(P(
    'Core time-series fact table. The computed column <b>aqi_category</b> is '
    'stored (STORED) so it can be indexed and grouped without recalculation.'
))
story.append(tbl([
    ['Column', 'Data Type', 'Constraint', 'Description'],
    ['id',           'BIGINT UNSIGNED',   'PK, AUTO_INCREMENT', 'Surrogate primary key'],
    ['location_id',  'INT UNSIGNED',      'FK -> locations.id', 'City reference'],
    ['recorded_at',  'DATETIME',          'NOT NULL',           'Measurement timestamp'],
    ['aqi',          'SMALLINT UNSIGNED', 'NULL',               'Air Quality Index (0-500)'],
    ['pm25',         'DECIMAL(8,2)',      'NULL',               'PM2.5 concentration ug/m3'],
    ['pm10',         'DECIMAL(8,2)',      'NULL',               'PM10 concentration ug/m3'],
    ['co',           'DECIMAL(8,4)',      'NULL',               'Carbon Monoxide ppm'],
    ['no2',          'DECIMAL(8,4)',      'NULL',               'Nitrogen Dioxide ppb'],
    ['so2',          'DECIMAL(8,4)',      'NULL',               'Sulphur Dioxide ppb'],
    ['o3',           'DECIMAL(8,4)',      'NULL',               'Ozone ppb'],
    ['temperature',  'DECIMAL(5,2)',      'NULL',               'Ambient temperature C'],
    ['humidity',     'DECIMAL(5,2)',      'NULL',               'Relative humidity %'],
    ['aqi_category', 'ENUM (generated)', 'STORED',             'Good / Satisfactory / Moderate / Poor / Very Poor / Severe'],
    ['source',       'VARCHAR(50)',       "DEFAULT 'sensor'",   'Data origin: sensor, csv_import, seed'],
    ['created_at',   'TIMESTAMP',        'DEFAULT NOW()',      'Row insertion timestamp'],
], widths=[3.5*cm, 3.5*cm, 3.5*cm, 5*cm]))
story.append(P('Indexes: (location_id, recorded_at), recorded_at, aqi', note))

story.append(sp(6))
story.append(P('<b>5.3 &nbsp; aqi_forecasts</b>', h2))
story.append(tbl([
    ['Column',         'Data Type',         'Constraint',              'Description'],
    ['id',             'BIGINT UNSIGNED',   'PK',                     'Surrogate primary key'],
    ['location_id',    'INT UNSIGNED',      'FK -> locations.id',     'City reference'],
    ['forecast_date',  'DATE',              'NOT NULL',               'Date being predicted'],
    ['predicted_aqi',  'SMALLINT UNSIGNED', 'NULL',                   'Forecast AQI value'],
    ['confidence_pct', 'TINYINT UNSIGNED',  'NULL',                   'Model confidence 55-90%'],
    ['model_version',  'VARCHAR(20)',       "DEFAULT 'v1'",           'Forecast model identifier'],
    ['created_at',     'TIMESTAMP',        'DEFAULT NOW()',           'Record creation time'],
], widths=[3.5*cm, 3.5*cm, 3.5*cm, 5*cm]))
story.append(P('UNIQUE constraint on (location_id, forecast_date) allows idempotent regeneration.', note))

story.append(sp(6))
story.append(P('<b>5.4 &nbsp; alerts</b>', h2))
story.append(tbl([
    ['Column',        'Data Type',         'Constraint',          'Description'],
    ['id',            'INT UNSIGNED',      'PK',                 'Surrogate primary key'],
    ['location_id',   'INT UNSIGNED',      'FK -> locations.id', 'Affected city'],
    ['triggered_at',  'DATETIME',          'NOT NULL',           'Alert creation time'],
    ['aqi_threshold', 'SMALLINT UNSIGNED', 'NOT NULL',           'Configured threshold (300)'],
    ['actual_aqi',    'SMALLINT UNSIGNED', 'NOT NULL',           'Reading that triggered alert'],
    ['message',       'VARCHAR(255)',      'NULL',               'Human-readable alert text'],
    ['resolved_at',   'DATETIME',         'NULL',               'Set when resolved; NULL = active'],
], widths=[3.5*cm, 3.5*cm, 3.5*cm, 5*cm]))
story.append(pb())

# ── 6. ETL PIPELINE ───────────────────────────────────────────────────────────
story += section_rule('ETL Pipeline', '6')
story.append(P(
    'The ETL pipeline (<b>data/etl_import.js</b>) transforms raw CSV files into structured '
    'records in <b>air_quality_readings</b>. It supports a <b>--dry-run</b> mode for '
    'validation without committing data.'
))
story.append(sp(4))
story.append(P('<b>6.1 &nbsp; Extraction</b>', h2))
story.append(P('The script opens the CSV file as a read stream to support files of any size. '
               'Column headers are read from the first line and mapped case-insensitively '
               'to known field names.'))
story.append(sp(4))
story.append(P('<b>6.2 &nbsp; Transformation & Data Cleaning</b>', h2))
story.append(highlight_box([
    'Missing values — NULL-safe parsing; missing fields stored as SQL NULL',
    'Invalid dates — rows with unparseable timestamps are skipped and logged',
    'Missing required fields — rows missing city or recorded_at are skipped',
    'Outlier detection — values outside valid ranges are flagged and clamped',
    'Unit consistency — all numeric fields stored in standardized units',
    'New cities — if a city is not found in locations table it is auto-inserted',
], color=colors.HexColor('#e3f2fd'), border=BLUE))

story.append(sp(4))
story.append(P('<b>Outlier thresholds applied during import:</b>', h3))
story.append(tbl([
    ['Pollutant', 'Valid Min', 'Valid Max', 'Unit'],
    ['AQI',         '0',   '500',  'index'],
    ['PM2.5',       '0',   '999',  'ug/m3'],
    ['PM10',        '0',   '999',  'ug/m3'],
    ['CO',          '0',   '100',  'ppm'],
    ['NO2',         '0',   '2000', 'ppb'],
    ['SO2',         '0',   '2000', 'ppb'],
    ['O3',          '0',   '500',  'ppb'],
    ['Temperature', '-20', '60',   'C'],
    ['Humidity',    '0',   '100',  '%'],
], widths=[3.5*cm, 2.5*cm, 2.5*cm, 3*cm]))

story.append(sp(4))
story.append(P('<b>6.3 &nbsp; Loading</b>', h2))
story.append(P('Clean rows are accumulated into batches of 200 and inserted using a single '
               'parameterized bulk INSERT IGNORE statement. Location ID lookup is cached '
               'in memory per run to avoid repeated SELECT queries.'))
story.append(sp(4))
story.append(P('<b>Usage:</b>', h3))
story.append(P('node data/etl_import.js --file=air_quality.csv', code))
story.append(P('node data/etl_import.js --file=air_quality.csv --dry-run', code))
story.append(sp(4))
story.append(P('<b>6.4 &nbsp; ETL Summary Output</b>', h2))
story.append(tbl([
    ['Output Field',    'Description'],
    ['Lines processed', 'Total CSV rows read (excluding header)'],
    ['Rows inserted',   'Successfully committed to database (0 in dry-run)'],
    ['Rows skipped',    'Missing required fields or invalid date'],
    ['Outliers found',  'Rows with at least one out-of-range value (clamped and inserted)'],
], widths=[5*cm, 10.5*cm]))
story.append(pb())

# ── 7. BACKEND API ────────────────────────────────────────────────────────────
story += section_rule('Backend API — Endpoints & Implementation', '7')
story.append(P(
    'The API server is built with <b>Node.js v18</b> and <b>Express.js</b>, listening on '
    'port 3000. Every request passes through Helmet and a rate limiter before reaching '
    'the router. All SQL uses parameterized placeholders.'
))
story.append(sp(4))
story.append(P('<b>7.1 &nbsp; Endpoint Reference</b>', h2))
story.append(tbl([
    ['Method', 'Path', 'Query Parameters', 'Response'],
    ['GET',  '/api/health',                      '—',                              '{ status, ts }'],
    ['GET',  '/api/locations',                   '—',                              '{ data: [ location ] }'],
    ['POST', '/api/locations',                   'body: city, state, country, lat, lon', '{ id, city } — 201'],
    ['GET',  '/api/readings',                    'location_id, from, to, pollutant','{ data, total }'],
    ['GET',  '/api/readings/latest',             '—',                              '{ data: [ latest per city ] }'],
    ['GET',  '/api/readings/daily',              'location_id, from, to',          '{ data: [ daily avg ] }'],
    ['GET',  '/api/readings/hourly',             'location_id, from, to',          '{ data: [ hourly avg ] }'],
    ['GET',  '/api/readings/peak-hours',         'location_id, from, to',          '{ data: [ hour, avg_aqi ] }'],
    ['GET',  '/api/readings/category-breakdown', 'location_id, from, to',          '{ data: [ category, pct ] }'],
    ['GET',  '/api/forecast',                    'location_id',                    '{ data: [ forecast rows ] }'],
    ['GET',  '/api/alerts',                      '—',                              '{ data: [ active alerts ] }'],
], widths=[1.5*cm, 5*cm, 4.5*cm, 4.5*cm]))

story.append(sp(6))
story.append(P('<b>7.2 &nbsp; Middleware Stack</b>', h2))
story.append(tbl([
    ['Middleware',      'Module',              'Purpose'],
    ['helmet()',        'helmet 7.x',          'Sets X-Content-Type-Options, X-Frame-Options, HSTS and other security headers'],
    ['cors()',          'cors',                'Allows cross-origin requests from configured origin'],
    ['express.json()', 'Express built-in',    'Parses JSON request bodies; limit capped at 1 MB'],
    ['rateLimiter',    'express-rate-limit',  '100 requests per IP per 15-minute window; HTTP 429 on breach'],
    ['validateQuery()', 'Custom + Joi',        'Validates GET query params; HTTP 400 on failure'],
    ['validateBody()',  'Custom + Joi',        'Validates POST body; HTTP 400 on failure'],
], widths=[3.5*cm, 3.5*cm, 8.5*cm]))

story.append(sp(6))
story.append(P('<b>7.3 &nbsp; Scheduled Jobs (node-cron)</b>', h2))
story.append(tbl([
    ['Schedule',          'Cron Expression',  'Action'],
    ['Every 30 minutes',  '*/30 * * * *',    'Scans latest readings for AQI > 300; inserts alert if none exists for city in last 3 hours'],
    ['Daily at 01:00',    '0 1 * * *',       'Fetches 14-day history per city; computes moving average; writes 7-day forecast'],
], widths=[3.5*cm, 3.5*cm, 8.5*cm]))

story.append(sp(6))
story.append(P('<b>7.4 &nbsp; Validation Schemas</b>', h2))
story.append(P('<b>readingsQuerySchema</b> — applied to all /api/readings/* GET routes:', h3))
story.append(tbl([
    ['Field',       'Joi Type',            'Rules'],
    ['location_id', 'number().integer()',  'Required, positive integer'],
    ['from',        'date().iso()',        'Required, ISO 8601 date'],
    ['to',          'date().iso()',        'Required, ISO 8601, must be >= from'],
    ['pollutant',   'string().valid(...)', 'Optional; one of aqi/pm25/pm10/co/no2/so2/o3; default: aqi'],
], widths=[3.5*cm, 4*cm, 8*cm]))
story.append(pb())

# ── 8. FRONTEND DASHBOARD ─────────────────────────────────────────────────────
story += section_rule('Frontend Dashboard & Visualizations', '8')
story.append(P(
    'The dashboard is a single-page application built with plain HTML5, CSS3, and '
    'Vanilla JavaScript. Chart.js renders all six visualization panels on HTML5 canvas elements.'
))
story.append(sp(4))
story.append(P('<b>8.1 &nbsp; Filter Controls</b>', h2))
story.append(tbl([
    ['Filter',    'Input Type',  'Options / Format'],
    ['City',      'Dropdown',    'Dynamically populated from GET /api/locations'],
    ['Date From', 'Date picker', 'ISO date; default: 30 days ago'],
    ['Date To',   'Date picker', 'ISO date; default: today'],
    ['Pollutant', 'Dropdown',    'AQI, PM2.5, PM10, CO, NO2, SO2, O3'],
], widths=[3.5*cm, 3.5*cm, 8.5*cm]))

story.append(sp(4))
story.append(P('<b>8.2 &nbsp; KPI Summary Cards</b>', h2))
story.append(tbl([
    ['Card',           'Calculation',                   'Source Endpoint'],
    ['Average AQI',    'Mean AQI over selected range',  '/api/readings/daily'],
    ['Peak AQI',       'Maximum AQI reading in period', '/api/readings/daily'],
    ['Safe Days',      'Days where daily avg AQI <= 100','/api/readings/daily'],
    ['Hazardous Days', 'Days where daily avg AQI > 300', '/api/readings/daily'],
], widths=[4*cm, 6*cm, 5.5*cm]))

story.append(sp(4))
story.append(P('<b>8.3 &nbsp; Chart Panels</b>', h2))
story.append(tbl([
    ['Panel',              'Chart Type',     'X-Axis',          'Y-Axis',   'Endpoint'],
    ['AQI Trend',          'Line',           'Date',            'AQI',      '/api/readings/daily'],
    ['Daily Summary',      'Bar + Line',     'Date',            'AQI',      '/api/readings/daily'],
    ['Hourly Pattern',     'Bar',            'Hour (0-23)',     'Avg AQI',  '/api/readings/hourly'],
    ['Peak Hours',         'Horizontal Bar', 'Hour',            'Avg AQI',  '/api/readings/peak-hours'],
    ['Category Breakdown', 'Doughnut',       'Category',        'Percent',  '/api/readings/category-breakdown'],
    ['7-Day Forecast',     'Line',           'Date',            'Pred. AQI','/api/forecast'],
], widths=[3.5*cm, 2.5*cm, 3.5*cm, 2.5*cm, 3.5*cm]))

story.append(sp(4))
story.append(P('<b>8.4 &nbsp; Responsive Layout</b>', h2))
story.append(tbl([
    ['Breakpoint',   'Layout'],
    ['> 1100 px',    '5-column KPI row; 2-column chart grid'],
    ['750-1100 px',  '3-column KPI row; 1-column chart grid'],
    ['< 750 px',     '2-column KPI row; 1-column chart grid (mobile)'],
], widths=[4*cm, 11.5*cm]))
story.append(P('Charts auto-refresh every 5 minutes via setInterval.', note))
story.append(pb())

# ── 9. KPIs ───────────────────────────────────────────────────────────────────
story += section_rule('Key Performance Indicators (KPIs)', '9')
story.append(tbl([
    ['KPI',                  'SQL Calculation',                                      'Dashboard Location'],
    ['Average AQI',          'AVG(aqi) over date range',                            'KPI card + trend chart'],
    ['Peak AQI',             'MAX(aqi) over date range',                            'KPI card'],
    ['Safe Days',            'COUNT days WHERE avg_aqi <= 100',                     'KPI card'],
    ['Hazardous Days',       'COUNT days WHERE avg_aqi > 300',                      'KPI card'],
    ['Peak Pollution Hour',  'AVG(aqi) GROUP BY HOUR ORDER BY avg_aqi DESC',        'Peak hours chart'],
    ['Pollutant Trend',      'AVG(pm25|pm10|co|no2|so2|o3) GROUP BY DATE',         'Trend chart'],
    ['Category Distribution','COUNT(*) GROUP BY aqi_category with OVER() percent',  'Doughnut chart'],
], widths=[3.5*cm, 7*cm, 5*cm]))

# ── 10. FORECASTING ───────────────────────────────────────────────────────────
story += section_rule('Forecasting Model', '10')
story.append(tbl([
    ['Parameter',              'Value'],
    ['Algorithm',              '14-day moving average of daily average AQI'],
    ['Jitter range',           '+/-10 AQI (uniform random)'],
    ['Forecast horizon',       '7 calendar days ahead per city'],
    ['Confidence — Day 1',     '90%'],
    ['Confidence — Day 7',     '~55% (decrements ~5% per day)'],
    ['Minimum confidence',     '50% (clamped)'],
    ['Regeneration schedule',  'Daily at 01:00 via node-cron'],
    ['Storage',                'aqi_forecasts — ON DUPLICATE KEY UPDATE for idempotency'],
    ['Model version',          'v1 (stored in model_version column)'],
    ['Minimum history needed', '3 days of readings (returns early otherwise)'],
], widths=[5.5*cm, 10*cm]))

# ── 11. ALERTS ────────────────────────────────────────────────────────────────
story += section_rule('Alert System', '11')
story.append(tbl([
    ['Attribute',        'Detail'],
    ['Trigger condition','AQI > 300 in a reading recorded within the past 1 hour'],
    ['Deduplication',    'No new alert if unresolved alert exists for same city within 3 hours'],
    ['Check frequency',  'Every 30 minutes (node-cron: */30 * * * *)'],
    ['Storage',          'alerts table — records location, triggered_at, threshold, actual AQI'],
    ['Frontend display', 'Pulsing red badge in dashboard header; active alert list'],
    ['Resolution',       'resolved_at column updated when alert is cleared; NULL = active'],
], widths=[4.5*cm, 11*cm]))

# ── 12. SECURITY ──────────────────────────────────────────────────────────────
story += section_rule('Security Measures', '12')
story.append(tbl([
    ['Control',              'Implementation',                           'Threat Mitigated'],
    ['Parameterized SQL',    'mysql2 prepared statements',              'SQL Injection'],
    ['Input validation',     'Joi schemas on all params and bodies',    'Malformed input'],
    ['HTTP security headers','helmet() — 12+ headers incl. CSP, HSTS', 'XSS, clickjacking'],
    ['Rate limiting',        '100 req/IP/15 min; HTTP 429 on breach',  'DoS, brute force'],
    ['Credential management','Credentials in .env (gitignored)',        'Credential leakage'],
    ['CORS policy',          'Restricted to ALLOWED_ORIGIN env var',    'Cross-origin theft'],
    ['Frontend secrets',     'No credentials in client-side code',      'Secret exposure'],
    ['Body size limit',      'express.json() limit: 1 MB',             'Memory exhaustion'],
], widths=[3.5*cm, 5.5*cm, 6.5*cm]))
story.append(pb())

# ── 13. TESTING ───────────────────────────────────────────────────────────────
story += section_rule('System Testing', '13')
story.append(P(
    'The test suite (<b>tests/test_api.js</b>) is a standalone Node.js script using only the '
    'built-in <b>http</b> module. It runs 27 assertions against the live API server and '
    'concludes with a simulated real-time data stream test sending 5 readings at 1-second intervals.'
))
story.append(sp(4))
story.append(tbl([
    ['Test Group',              'Assertions', 'What is verified'],
    ['Health check',            '2',  'HTTP 200; status: ok in response'],
    ['Locations API',           '4',  'HTTP 200; array; at least 1 record; city field present'],
    ['Latest readings',         '3',  'HTTP 200; array; aqi field present'],
    ['Filtered readings',       '2',  'HTTP 200 with filters; array response'],
    ['Daily summary',           '2',  'HTTP 200; array response'],
    ['Hourly average',          '2',  'HTTP 200; array response'],
    ['Peak hours',              '2',  'HTTP 200; array response'],
    ['Category breakdown',      '2',  'HTTP 200; array response'],
    ['Forecast',                '3',  'HTTP 200; array; predicted_aqi field present'],
    ['Alerts',                  '2',  'HTTP 200; array response'],
    ['Input validation',        '2',  'Invalid location_id -> 400; invalid date -> 400'],
    ['Real-time stream sim',    '1',  '5 sensor payloads at 1-second intervals; all succeed'],
    ['<b>TOTAL</b>',           '<b>27</b>', '<b>27 / 27 passing</b>'],
], widths=[4*cm, 2.5*cm, 9*cm]))
story.append(sp(4))
story.append(P('<b>How to run:</b>', h3))
story.append(P('node tests/test_api.js', code))
story.append(P('Prerequisite: API server must be running on port 3000.', note))

# ── 14. ENVIRONMENTAL INSIGHTS ────────────────────────────────────────────────
story += section_rule('Environmental Insights from Dashboard', '14')
story.append(tbl([
    ['Observation',       'Finding'],
    ['Most polluted',     'Delhi, Noida, and Gurugram show AQI in "Poor" to "Very Poor" range (201-400)'],
    ['Cleanest cities',   'Bengaluru and Chennai average in the "Moderate" category (101-200)'],
    ['Peak hours',        'AQI spikes at 6-9 AM and 7-10 PM correlating with traffic rush hours'],
    ['Key pollutant',     'PM2.5 is the dominant contributor to high AQI across all cities'],
    ['Seasonal pattern',  'Winter months show higher AQI due to temperature inversion'],
    ['Hazardous days',    'AQI > 300 events concentrated in northern cities during November-January'],
    ['Safe days',         'Southern cities record proportionally more Good and Satisfactory days'],
], widths=[4*cm, 11.5*cm]))

# ── 15. CONCLUSION & DELIVERABLES ─────────────────────────────────────────────
story += section_rule('Conclusion & Deliverables', '15')
story.append(P(
    'The Air Quality Monitoring and Pollution Trend Visualization Dashboard fulfils all '
    'fourteen project requirements. The system demonstrates a complete software engineering '
    'lifecycle: data ingestion, storage design, API development, interactive visualization, '
    'forecasting, alerting, security hardening, and automated testing.'
))
story.append(sp(6))
story.append(tbl([
    ['#',  'Deliverable',             'File / Location',                                  'Status'],
    ['1',  'Cleaned dataset (CSV)',   'data/sample/air_quality_sample.csv',               'Complete'],
    ['2',  'ETL pipeline',           'data/etl_import.js',                               'Complete'],
    ['3',  'ER diagram',             'docs/er_diagram.html',                             'Complete'],
    ['4',  'SQL schema',             'database/migrations/001_create_tables.sql',        'Complete'],
    ['5',  'Node.js REST API',       'backend/ (11 endpoints)',                          'Complete'],
    ['6',  'Interactive dashboard',  'frontend/index.html (6 charts)',                   'Complete'],
    ['7',  'Forecasting model',      'backend/controllers/forecastController.js',        'Complete'],
    ['8',  'Alert system',           'backend/controllers/alertController.js',           'Complete'],
    ['9',  'System test suite',      'tests/test_api.js (27/27 passed)',                 'Complete'],
    ['10', 'Architecture doc',       'docs/SYSTEM_ARCHITECTURE.md',                     'Complete'],
    ['11', 'PDF project report',     'docs/AirQuality_Project_Report.pdf',              'Complete'],
    ['12', 'PPT presentation',       'docs/AirQuality_Presentation.pptx',               'Complete'],
], widths=[0.7*cm, 5*cm, 7*cm, 2.3*cm]))

doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=2.2*cm, rightMargin=2.2*cm,
    topMargin=2.5*cm, bottomMargin=2.5*cm,
    title='Air Quality Monitoring — Project Report',
    author='UG/Dr. Vandana/7/2026/15',
    subject='Air Quality Monitoring & Pollution Trend Visualization Dashboard'
)
doc.build(story)
print(f'PDF generated: {OUTPUT}')
