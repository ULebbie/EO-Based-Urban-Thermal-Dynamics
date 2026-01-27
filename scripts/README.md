# Analysis Scripts

This folder contains Google Earth Engine (GEE) scripts used to analyse
urban thermal dynamics using MODIS land surface temperature (LST) and
Landsat-derived vegetation indices.

All scripts require the user to define their own study area (AOI) as a
GEE asset.

---

## Script Overview

### 1. `script_01_seasonal_modis_lst.js`

Computes seasonal mean MODIS LST for
summer (March–May) and winter (December–February) from 2004 to 2024.
Includes quality control and export of seasonal LST rasters.

---

### 2. `script_02_utfvi_computation.js`

Computes the Urban Thermal Field Variance Index (UTFVI) based on
seasonal LST to quantify spatial thermal stress intensity.

---

### 3. `script_03_lst_ndvi_relationship.js`

Analyses statistical relationships between NDVI and LST for selected
years using Landsat-derived vegetation indices.

---

## Execution Order

1. `script_01_seasonal_modis_lst.js`  
2. `script_02_utfvi_computation.js`  
3. `script_03_lst_ndvi_relationship.js`
