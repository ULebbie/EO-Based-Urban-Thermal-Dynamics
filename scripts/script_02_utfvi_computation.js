/*******************************************************
 * SCRIPT 2: Urban Thermal Field Variance Index (UTFVI)
 * Input: Seasonal MODIS LST (Script 1 output)
 * Period: 2004–2024
 *
 * UTFVI Formula:
 *   UTFVI = (Ts − T_mean) / T_mean
 *
 * Purpose:
 *   Quantify thermal stress intensity and spatial
 *   heterogeneity across seasons and years.
 *******************************************************/

// --- 1. DATA LOADING ---

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

// --- 2. UTFVI FUNCTION ---

var computeUTFVI = function(seasonLST, seasonName, year) {

  var meanLST = seasonLST.mean().clip(studyArea);

  var Tmean = ee.Number(
    meanLST.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: studyArea,
      scale: 1000,
      maxPixels: 1e13
    }).get('LST_Day_1km')
  );

  var utfvi = meanLST.subtract(Tmean).divide(Tmean).rename('UTFVI');

  Export.image.toDrive({
    image: utfvi,
    description: 'UTFVI_' + seasonName + '_' + year,
    folder: 'Bbs_Analysis_2',
    fileNamePrefix: 'UTFVI_' + seasonName + '_' + year,
    region: studyArea.geometry(),
    scale: 1000,
    maxPixels: 1e13
  });

  return utfvi;
};

// --- 3. RUN ANALYSIS ---

for (var y = 2004; y <= 2024; y++) {

  var summerUTFVI = computeUTFVI(
    filteredLST.filterDate(y + '-03-01', y + '-06-01'),
    'Summer',
    y
  );

  var winterUTFVI = computeUTFVI(
    filteredLST.filterDate((y - 1) + '-12-01', y + '-03-01'),
    'Winter',
    y
  );

  // Display only boundary years
  if (y === 2004 || y === 2024) {
    var vis = {min: -0.05, max: 0.05, palette: ['blue', 'white', 'red']};
    Map.addLayer(summerUTFVI, vis, 'Summer UTFVI ' + y, false);
    Map.addLayer(winterUTFVI, vis, 'Winter UTFVI ' + y, false);
  }
}

Map.centerObject(studyArea, 10);
print('UTFVI computation complete.');
