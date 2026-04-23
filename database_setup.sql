CREATE DATABASE IF NOT EXISTS marine_ai;
USE marine_ai;

CREATE TABLE IF NOT EXISTS marine_data (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    dates                 DATE,
    location              VARCHAR(100),
    state                 VARCHAR(100),
    species               TEXT,
    avg_daily_production  FLOAT,
    latitude              FLOAT,
    longitude             FLOAT,
    sea_surface_temperature FLOAT,
    salinity              FLOAT,
    wind_speed            FLOAT,
    wave_height           FLOAT
);
