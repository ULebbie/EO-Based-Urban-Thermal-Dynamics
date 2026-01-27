/*******************************************************
 * SCRIPT 1: Seasonal Mean Land Surface Temperature (LST)
 *
 * Sensor:
 *   MODIS MOD11A2 (1 km, 8-day composite)
 *
 * Period:
 *   2004–2024
 *
 * Seasons:
 *   - Summer: March–May
 *   - Winter: December (previous year)–February
 *
 * Purpose:
 *   Generate seasonal mean LST surfaces with quality
 *   control, export outputs for downstream analysis,
 *   and visually validate results for selected years.
 *******************************************************/


// =====================================================
// 1. STUDY AREA (USER INPUT REQUIRED)
// =====================================================

/*
INSTRUCTIONS:
1. Upload your study area (AOI) to the GEE Assets tab
   as a FeatureCollection or Geometry.
2. Copy the asset path.
3. Replace the placeholder below with your own asset ID.

Example:
'projects/your-username/assets/your_study_area'
*/

var studyArea = ee.FeatureCollection(
  'projects/YOUR_USERNAME/assets/YOUR_STUDY_AREA'
);

// Optional quick test using a public boundary
// var studyArea = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
//                    .filter(ee.Filter.eq('country_na', 'India'));

Map.centerObject(studyArea, 10);


// =====================================================
// 2. DATA LOADING & QUALITY CONTROL
// =====================================================

var modisLST = ee.ImageCollection('MODIS/061/MOD11A2')
  .filter(ee.Filter.calendarRange(2003, 2024, 'year'))
  .select(['LST_Day_1km', 'QC_Day']);

// Apply MODIS mandatory QA filtering and convert to °C
function maskGoodQuality(image) {
  var qc = image.select('QC_Day');
  var mandatoryQA = qc.bitwiseAnd(3);   // bits 0–1
  var qualityMask = mandatoryQA.lte(1); // good or average quality

  return image.updateMask(qualityMask)
    .select('LST_Day_1km')
    .multiply(0.02)
    .subtract(273.15)
    .rename('LST')
    .copyProperties(image, ['system:time_start']);
}

var filteredLST = modisLST.map(maskGoodQuality);


// =====================================================
// 3. SEASONAL COMPOSITES & EXPORT
// =====================================================

var startYear = 2004;
var endYear   = 2024;

for (var y = startYear; y <= endYear; y++) {

  // --- Summer (March–May) ---
  var summerLST = filteredLST
    .filterDate(ee.Date.fromYMD(y, 3, 1), ee.Date.fromYMD(y, 6, 1))
    .mean()
    .clip(studyArea);

  Export.image.toDrive({
    image: summerLST,
    description: 'Summer_LST_' + y,
    fileNamePrefix: 'Summer_LST_' + y,
    folder: 'Seasonal_LST',
    region: studyArea.geometry(),
    scale: 1000,
    maxPixels: 1e13
  });

  // --- Winter (Dec previous year – Feb) ---
  var winterLST = filteredLST
    .filterDate(ee.Date.fromYMD(y - 1, 12, 1), ee.Date.fromYMD(y, 3, 1))
    .mean()
    .clip(studyArea);

  Export.image.toDrive({
    image: winterLST,
    description: 'Winter_LST_' + y,
    fileNamePrefix: 'Winter_LST_' + y,
    folder: 'Seasonal_LST',
    region: studyArea.geometry(),
    scale: 1000,
    maxPixels: 1e13
  });

  // Visual check for first year only
  if (y === startYear) {
    var vis = {
      min: 20,
      max: 45,
      palette: ['blue', 'cyan', 'yellow', 'red']
    };
    Map.addLayer(summerLST, vis, 'Summer LST ' + y);
    Map.addLayer(winterLST, vis, 'Winter LST ' + y);
  }
}

print('Seasonal LST processing complete.');
