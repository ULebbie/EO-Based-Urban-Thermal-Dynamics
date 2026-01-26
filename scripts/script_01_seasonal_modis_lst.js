/*******************************************************
 * SCRIPT 1: Seasonal Mean Land Surface Temperature (LST)
 * Sensor: MODIS MOD11A2 (1 km, 8-day)
 * Period: 2004–2024
 * Seasons:
 *   - Summer: March–May
 *   - Winter: December (previous year)–February
 *
 * Purpose:
 *   Generate seasonal mean LST maps with quality control,
 *   export them for downstream analysis, and visually
 *   validate outputs for selected years.
 *******************************************************/

// --- 1. DATA LOADING & PRE-PROCESSING ---

var modisLST = ee.ImageCollection('MODIS/061/MOD11A2')
  .filter(ee.Filter.calendarRange(2003, 2024, 'year'))
  .select(['LST_Day_1km', 'QC_Day']);

var studyArea = ee.FeatureCollection('projects/ee-lebbieunis/assets/Bbs_AOI');

var maskGoodQuality = function(image) {
  var qc = image.select('QC_Day');
  var mandatoryQA = qc.bitwiseAnd(3);
  var qualityMask = mandatoryQA.lte(1);

  return image.updateMask(qualityMask)
    .select('LST_Day_1km')
    .multiply(0.02)
    .subtract(273.15)
    .copyProperties(image, ['system:time_start']);
};

var filteredLST = modisLST.map(maskGoodQuality);

// --- 2. SEASONAL PROCESSING & EXPORT ---

var startYear = 2004;
var endYear = 2024;

for (var y = startYear; y <= endYear; y++) {

  // Summer (Mar–May)
  var summerLST = filteredLST
    .filterDate(ee.Date.fromYMD(y, 3, 1), ee.Date.fromYMD(y, 6, 1))
    .mean()
    .clip(studyArea);

  Export.image.toDrive({
    image: summerLST,
    description: 'Summer_LST_' + y,
    folder: 'Bbs_Analysis_2',
    fileNamePrefix: 'Summer_LST_' + y,
    region: studyArea.geometry(),
    scale: 1000,
    maxPixels: 1e13
  });

  // Winter (Dec prev year – Feb)
  var winterLST = filteredLST
    .filterDate(ee.Date.fromYMD(y - 1, 12, 1), ee.Date.fromYMD(y, 3, 1))
    .mean()
    .clip(studyArea);

  Export.image.toDrive({
    image: winterLST,
    description: 'Winter_LST_' + y,
    folder: 'Bbs_Analysis_2',
    fileNamePrefix: 'Winter_LST_' + y,
    region: studyArea.geometry(),
    scale: 1000,
    maxPixels: 1e13
  });

  // --- VISUAL CHECK (ONLY FOR FIRST YEAR) ---
  if (y === startYear) {
    var vis = {min: 20, max: 45, palette: ['blue', 'cyan', 'yellow', 'red']};
    Map.addLayer(summerLST, vis, 'Summer LST ' + y);
    Map.addLayer(winterLST, vis, 'Winter LST ' + y);
  }
}

Map.centerObject(studyArea, 10);
print('Seasonal LST processing complete.');
