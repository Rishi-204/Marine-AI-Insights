import openpyxl
import mysql.connector

# ── Configuration ────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Godson204",   
    "database": "marine_ai"
}

EXCEL_FILE = "marine_ai_insights_dataset.xlsx"   
SHEET_NAME = "Sheet1"

# ── Connect to MySQL ─────────────────────────────────
print("Connecting to MySQL...")
conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

# ── Load Excel File ──────────────────────────────────
print(f"Loading {EXCEL_FILE}...")
wb = openpyxl.load_workbook(EXCEL_FILE)
ws = wb[SHEET_NAME]

total_rows = ws.max_row - 1
print(f"Found {total_rows} data rows. Importing...")

# ── Insert Rows ──────────────────────────────────────
inserted = 0
for row in ws.iter_rows(min_row=2, values_only=True):
    cursor.execute("""
        INSERT INTO marine_data
        (dates, location, state, species, avg_daily_production,
         latitude, longitude, sea_surface_temperature, salinity, wind_speed, wave_height)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, row)
    inserted += 1

conn.commit()
print(f"✅ Successfully imported {inserted} rows into marine_data table.")

cursor.close()
conn.close()
