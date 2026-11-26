import os
import certifi
import openpyxl
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.environ["DB_HOST"],
    "port": int(os.environ.get("DB_PORT", 4000)),
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "database": os.environ["DB_NAME"],
    "ssl_ca": certifi.where(),
    "ssl_verify_cert": True,
}

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS marine_data (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    dates                   DATE,
    location                VARCHAR(100),
    state                   VARCHAR(100),
    species                 TEXT,
    avg_daily_production    FLOAT,
    latitude                FLOAT,
    longitude               FLOAT,
    sea_surface_temperature FLOAT,
    salinity                FLOAT,
    wind_speed              FLOAT,
    wave_height             FLOAT
)
""")
cursor.execute("TRUNCATE TABLE marine_data")

ws = openpyxl.load_workbook("marine_ai_insights_dataset.xlsx")["Sheet1"]

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
print(f"✅ Imported {inserted} rows.")
cursor.close()
conn.close()