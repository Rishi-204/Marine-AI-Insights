from flask import Flask, jsonify, render_template
from flask_cors import CORS
import mysql.connector
from model import (
    run_linear_regression,
    run_anomaly_detection,
    run_feature_importance,
    run_forecast
)

app = Flask(__name__)
CORS(app)

# ── Database Configuration ──────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Godson204",   
    "database": "marine_ai"
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)


# ── Serve Frontend ──────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


# ── API: Summary KPIs ───────────────────────────────
@app.route('/api/summary')
def summary():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            COUNT(*)                              AS total_records,
            COUNT(DISTINCT location)              AS total_locations,
            COUNT(DISTINCT state)                 AS total_states,
            ROUND(AVG(avg_daily_production), 2)   AS avg_production,
            ROUND(AVG(sea_surface_temperature), 2) AS avg_temp,
            ROUND(AVG(salinity), 2)               AS avg_salinity,
            ROUND(AVG(wind_speed), 2)             AS avg_wind,
            ROUND(AVG(wave_height), 2)            AS avg_wave
        FROM marine_data
    """)
    result = cursor.fetchone()
    cursor.close(); conn.close()
    return jsonify(result)


# ── API: Production by State ────────────────────────
@app.route('/api/production-by-state')
def production_by_state():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            state,
            ROUND(AVG(avg_daily_production), 2) AS avg_prod,
            ROUND(AVG(sea_surface_temperature), 2) AS avg_temp,
            COUNT(*) AS count
        FROM marine_data
        GROUP BY state
        ORDER BY avg_prod DESC
    """)
    result = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(result)


# ── API: Time Series Trend ──────────────────────────
@app.route('/api/timeseries')
def timeseries():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            dates,
            ROUND(AVG(avg_daily_production), 2) AS avg_prod,
            ROUND(AVG(sea_surface_temperature), 2) AS avg_temp,
            ROUND(AVG(salinity), 2)             AS avg_sal,
            ROUND(AVG(wind_speed), 2)           AS avg_wind,
            ROUND(AVG(wave_height), 2)          AS avg_wave
        FROM marine_data
        GROUP BY dates
        ORDER BY dates
    """)
    result = cursor.fetchall()
    for row in result:
        row['dates'] = str(row['dates'])
    cursor.close(); conn.close()
    return jsonify(result)


# ── API: Location Data ──────────────────────────────
@app.route('/api/locations')
def locations():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            location,
            state,
            MAX(latitude)                           AS lat,
            MAX(longitude)                          AS lng,
            MAX(species)                            AS species,
            ROUND(AVG(avg_daily_production), 2)     AS avg_prod,
            ROUND(AVG(sea_surface_temperature), 2)  AS avg_temp,
            ROUND(AVG(salinity), 2)                 AS avg_sal,
            ROUND(AVG(wind_speed), 2)               AS avg_wind,
            ROUND(AVG(wave_height), 2)              AS avg_wave,
            COUNT(*)                                AS count
        FROM marine_data
        GROUP BY location, state
        ORDER BY avg_prod DESC
    """)
    result = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(result)


# ── API: Environmental Correlation ─────────────────
@app.route('/api/correlation')
def correlation():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            ROUND(sea_surface_temperature, 1) AS temp_bucket,
            ROUND(AVG(avg_daily_production), 2) AS avg_prod,
            COUNT(*) AS count
        FROM marine_data
        GROUP BY temp_bucket
        ORDER BY temp_bucket
    """)
    result = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(result)


# ══════════════════════════════════════════════════════
# AI / ML ENDPOINTS
# ══════════════════════════════════════════════════════

# ── API: Linear Regression ─────────────────────────
@app.route('/api/ai/regression')
def ai_regression():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT sea_surface_temperature, salinity,
               wind_speed, wave_height, avg_daily_production
        FROM marine_data
    """)
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(run_linear_regression(rows))


# ── API: Anomaly Detection ─────────────────────────
@app.route('/api/ai/anomalies')
def ai_anomalies():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT dates, location, sea_surface_temperature,
               salinity, wind_speed, wave_height, avg_daily_production
        FROM marine_data
    """)
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(run_anomaly_detection(rows))


# ── API: Feature Importance ────────────────────────
@app.route('/api/ai/feature-importance')
def ai_feature_importance():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT sea_surface_temperature, salinity,
               wind_speed, wave_height, avg_daily_production
        FROM marine_data
    """)
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(run_feature_importance(rows))


# ── API: 7-Day Forecast ────────────────────────────
@app.route('/api/ai/forecast')
def ai_forecast():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            dates,
            ROUND(AVG(avg_daily_production), 2) AS avg_prod
        FROM marine_data
        GROUP BY dates
        ORDER BY dates
    """)
    rows = cursor.fetchall()
    for r in rows:
        r['dates'] = str(r['dates'])
    cursor.close(); conn.close()
    return jsonify(run_forecast(rows))


# ── Run App ─────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True, port=5000)
