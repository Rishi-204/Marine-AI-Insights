# 🌊 Marine AI Insights

**Coastal Fisheries Intelligence Dashboard**

A Flask + MySQL web dashboard that analyses coastal fisheries data across Indian states: production, sea conditions, species catch, and ML-driven insights (regression, anomaly detection, feature importance and a 7-day forecast).

---

## ✨ Features

- **Overview:** KPI cards (records, locations, coastal states, avg production, avg sea temp, avg salinity), auto insight highlights and quick-question AI Analyst chips
- **Interactive Map:** Leaflet map of fishing ports, colour-coded by production, temperature, wind or waves
- **Environment:** Sea surface temperature, salinity, wind speed and wave height trends
- **Species & Catch:** Species-wise catch breakdown
- **Data Explorer:** Sortable, filterable table of all records
- **AI Models:** Four ML models (below) with visual results
- **Global Search:** Search locations and species

## 🤖 AI / ML Models

| Model | Library | Purpose |
|---|---|---|
| Linear Regression | scikit-learn | Predict daily production from sea conditions |
| Anomaly Detection | Isolation Forest | Flag abnormal environmental readings |
| Feature Importance | Random Forest | Which factor affects production most |
| 7-Day Forecast | Trend + moving average | Forecast next week's production |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask, Flask-CORS |
| Database | MySQL |
| ML | scikit-learn, NumPy |
| Frontend | HTML, CSS, vanilla JavaScript |
| Charts / Maps | Chart.js 4.4, Leaflet 1.9 |
| Data import | openpyxl |

## 📁 Project Structure

```
Marine-AI-Insights/
├── app.py                              # Flask app + REST API
├── model.py                            # ML models
├── import_data.py                      # Loads Excel dataset into MySQL
├── database_setup.sql                  # Database + table schema
├── marine_ai_insights_dataset.xlsx     # Dataset (390 records)
├── requirements.txt
├── templates/
│   └── index.html                      # Dashboard UI
└── static/
    ├── css/style.css
    └── js/dashboard.js                 # Data loading, charts, map, AI panel
```

## 📊 Dataset

390 daily records · 26 fishing ports · 9 coastal states · 21 Feb – 7 Mar 2026

| Column | Description |
|---|---|
| Dates | Observation date |
| Location / State | Fishing port and coastal state |
| Species | Major species caught |
| Avg_Daily_Production | Catch in kg/day |
| Latitude / Longitude | Port coordinates |
| Sea_Surface_Temperature | °C |
| Salinity | PSU |
| Wind_Speed | km/h |
| Wave_Height | metres |

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- MySQL 8+

### 1. Clone and install

```bash
git clone https://github.com/Rishi-204/Marine-AI-Insights.git
cd Marine-AI-Insights
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set up the database

```bash
mysql -u root -p < database_setup.sql
```

### 3. Configure credentials

Set your MySQL credentials in `app.py` and `import_data.py` (`DB_CONFIG`), or load them from environment variables:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=marine_ai
```

> ⚠️ Never commit real passwords. `.env` is already in `.gitignore`.

### 4. Import the dataset

```bash
python import_data.py
```

### 5. Run

```bash
python app.py
```

Open **http://localhost:5000**

## 🔌 API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/summary` | Overall KPIs |
| `GET /api/production-by-state` | Average production per state |
| `GET /api/timeseries` | Daily averages over time |
| `GET /api/locations` | Per-port stats for map and table |
| `GET /api/correlation` | Temperature vs production |
| `GET /api/ai/regression` | Linear regression results |
| `GET /api/ai/anomalies` | Detected anomalies |
| `GET /api/ai/feature-importance` | Feature importance scores |
| `GET /api/ai/forecast` | 7-day production forecast |

## ☁️ Deployment

The app needs a **reachable MySQL database**, so `localhost` will not work on a hosted platform.

1. Provision a hosted MySQL (Aiven, Railway, TiDB Cloud, etc.)
2. Run `database_setup.sql` and `import_data.py` against it
3. Add the `DB_*` variables to your host's environment settings
4. Deploy on a Python-friendly host (Render, Railway, PythonAnywhere). On Vercel, Flask also needs a `vercel.json` / serverless entrypoint.

## 🐛 Troubleshooting

**KPI cards show `—` and charts are blank**
The frontend calls `/api/*` on page load. If the Flask API cannot reach MySQL, those calls fail and nothing renders. Check the browser Console/Network tab and your server logs, and confirm the `DB_*` settings.

## 🗺️ Roadmap

- [ ] Live data ingestion
- [ ] Longer time-series and better forecasting models
- [ ] Export reports (PDF/CSV)
- [ ] Mobile-optimised layout

## 👤 Author

**Rishabh** · GitHub: [@Rishi-204](https://github.com/Rishi-204)
