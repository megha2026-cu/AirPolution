# .claude — Project Assets & Reference

This folder contains all documentation, scripts, and config for the
**Air Quality Monitoring & Pollution Trend Visualization Dashboard** project.

---

## Contents

### docs/
| File | Description |
|------|-------------|
| `AirQuality_Project_Report.pdf` | Full PDF project report (12 sections) |
| `AirQuality_Presentation.pptx` | 11-slide PowerPoint presentation |
| `er_diagram.html` | Visual ER diagram (open in browser) |
| `SYSTEM_ARCHITECTURE.md` | System architecture documentation |
| `FINAL_REPORT.md` | Final report in Markdown |
| `PROJECT_PLAN.md` | Milestones and project plan |

### scripts/
| File | Description |
|------|-------------|
| `seed_sample_data.js` | Seeds 1,240 rows of sample data |
| `etl_import.js` | CSV ETL import pipeline |
| `test_api.js` | 27-test API + real-time stream test suite |
| `generate_pdf.py` | Regenerate the PDF report |
| `generate_ppt.py` | Regenerate the PPT presentation |

### config/
| File | Description |
|------|-------------|
| `project_info.json` | Project metadata and requirements status |

---

## Quick Start

```bash
# Start API server (Node v18 required)
cd /var/www/html/8.2/projects/AirPolution/backend
/home/intersoft-admin/.nvm/versions/node/v18.20.8/bin/node server.js

# Open dashboard in browser
http://localhost:8080/8.2/projects/AirPolution/frontend/index.html

# Run tests
/home/intersoft-admin/.nvm/versions/node/v18.20.8/bin/node tests/test_api.js

# Regenerate PDF
python3 docs/generate_pdf.py

# Regenerate PPT
python3 docs/generate_ppt.py
```

---

## Requirements Status — All 14 Complete ✅

All project requirements from Qollabb have been fulfilled.
See `config/project_info.json` for detailed status.
