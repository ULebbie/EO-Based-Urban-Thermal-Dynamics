# EO-Based-Urban-Thermal-Dynamics

Reproducible Google Earth Engine workflows for analysing urban thermal dynamics
using MODIS land surface temperature and Landsat-derived vegetation indices.
The repository includes seasonal LST mapping, UTFVI-based heat stress assessment,
and NDVI–LST statistical analysis.

---

## Overview

This repository provides a modular Earth Observation (EO) workflow for
investigating **urban thermal environments** and **heat stress patterns**
over long time periods. The scripts are designed to support research on:

- Urban Heat Island (UHI) dynamics  
- Seasonal land surface temperature variability  
- Urban thermal stress assessment  
- Vegetation–temperature interactions  

All analyses are implemented in **Google Earth Engine (GEE)** and can be adapted
to any city by supplying a user-defined study area.

---

## Data Sources

- **MODIS MOD11A2 (Collection 6.1)**  
  8-day Land Surface Temperature (1 km resolution)

- **Landsat-derived NDVI**  
  Used for vegetation–temperature relationship analysis

- **User-defined study area boundary**  
  Uploaded as a GEE asset

---

## Temporal Coverage

- **2004–2024**
- Seasons analysed:
  - **Summer:** March–May  
  - **Winter:** December (previous year) – February  

---

## Repository Structure

```text
├── analysis_scripts/
│   ├── script_01_seasonal_modis_lst.js
│   ├── script_02_utfvi_computation.js
│   └── script_03_lst_ndvi_relationship.js
├── outputs/
│   └── Exported rasters and tables
└── README.md

These workflows are designed to be adaptable to any urban study area by replacing the study area asset and adjusting temporal parameters.
