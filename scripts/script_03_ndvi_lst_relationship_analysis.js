/*******************************************************
 * Script 3: NDVI–LST relationship analysis
 *
 * Data:
 *   MODIS LST (1 km)
 *   Landsat 5 / 8 / 9 NDVI (resampled to 1 km)
 *
 * Years analysed:
 *   2004, 2014, 2024
 *
 * Description:
 *   Examines the relationship between vegetation cover
 *   (NDVI) and land surface temperature using correlation,
 *   linear regression, and scatter plots.
 *******************************************************/


// -----------------------------------------------------
// Study area
// -----------------------------------------------------
// Replace this asset path with your own AOI
// (FeatureCollection or Geometry uploaded to GEE)

var studyArea = ee.FeatureCollection(
  'projects/YOUR_USERNAME/assets/YOUR_STUDY_AREA'
);

Map.centerObject(studyArea, 10);


// -----------------------------------------------------
// Helper functions
// -----------------------------------------------------

// Landsat 4 / 5 / 7 surface reflectance preprocessing
function prepL457(image) {
  var optical = image
    .select(['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7'])
    .multiply(0.0000275)
    .add(-0.2);

  var qa = image.select('QA_PIXEL');
  var cloud = qa.bitwiseAnd(1 << 5)
                .or(qa.bitwiseAnd(1 << 7))
                .or(qa.bitwiseAnd(1 << 1));

  return image.addBands(optical, null, true)
              .updateMask(cloud.not())
              .select(['SR_B3','SR_B4'])   // Red, NIR
              .rename(['Red','NIR']);
}


// Landsat 8 / 9 surface reflectance preprocessing
function prepL89(image) {
  var optical = image
    .select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'])
    .multiply(0.0000275)
    .add(-0.2);

  var qa = image.select('QA_PIXEL');
  var cloud = qa.bitwiseAnd(1 << 3)
                .or(qa.bitwiseAnd(1 << 4))
                .or(qa.bitwiseAnd(1 << 1));

  return image.addBands(optical, null, true)
              .updateMask(cloud.not())
              .select(['SR_B4','SR_B5'])   // Red, NIR
              .rename(['Red','NIR']);
}


// -----------------------------------------------------
// Core analysis function
// -----------------------------------------------------

var analyzeYear = function(year, lstAssetPath) {

  // Load summer LST image (user-provided MODIS asset)
  var modisLST = ee.Image(lstAssetPath).rename('LST');

  // Build Landsat NDVI mosaic (Mar–May)
  var mosaic;

  if (year === 2004) {

    var l5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
      .filterDate(year + '-03-01', year + '-05-31')
      .filterBounds(studyArea)
      .map(prepL457);

    mosaic = l5.median().clip(studyArea);

  } else {

    var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
      .filterDate(year + '-03-01', year + '-05-31')
      .filterBounds(studyArea)
      .map(prepL89);

    if (year === 2024) {
      var l9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
        .filterDate(year + '-03-01', year + '-05-31')
        .filterBounds(studyArea)
        .map(prepL89);

      mosaic = l8.merge(l9).median().clip(studyArea);
    } else {
      mosaic = l8.median().clip(studyArea);
    }
  }

  // NDVI at 30 m
  var ndvi30 = mosaic
    .normalizedDifference(['NIR','Red'])
    .rename('NDVI');

  // Resample NDVI to match MODIS LST grid
  var ndvi1km = ndvi30
    .reproject({
      crs: modisLST.projection(),
      scale: modisLST.projection().nominalScale()
    })
    .reduceResolution({
      reducer: ee.Reducer.mean(),
      maxPixels: 1024
    });

  // Combine NDVI and LST
  var combined = modisLST.addBands(ndvi1km);

  // Correlation and linear regression
  var corr = combined.reduceRegion({
    reducer: ee.Reducer.pearsonsCorrelation(),
    geometry: studyArea,
    scale: 1000,
    maxPixels: 1e13
  });

  var fit = combined.select(['NDVI','LST']).reduceRegion({
    reducer: ee.Reducer.linearFit(),
    geometry: studyArea,
    scale: 1000,
    maxPixels: 1e13
  });

  var r = ee.Number(corr.get('correlation'));
  var r2 = r.pow(2);

  print('--- ' + year + ' ---');
  print('Pearson r:', r);
  print('R²:', r2);
  print('LST =',
        ee.Number(fit.get('scale')),
        '* NDVI +',
        ee.Number(fit.get('offset')));

  // Scatter plot
  var samples = combined.sample({
    region: studyArea,
    scale: 1000,
    numPixels: 500,
    geometries: false
  });

  var chart = ui.Chart.feature.byFeature(
      samples, 'NDVI', ['LST']
    )
    .setChartType('ScatterChart')
    .setOptions({
      title: 'LST vs NDVI (' + year + ')',
      hAxis: {title: 'NDVI'},
      vAxis: {title: 'LST (°C)'},
      pointSize: 4,
      trendlines: {0: {showR2: true, visibleInLegend: true}}
    });

  print(chart);
};


// -----------------------------------------------------
// Run analysis
// -----------------------------------------------------

analyzeYear(2004, 'projects/YOUR_USERNAME/assets/Summer_LST_2004');
analyzeYear(2014, 'projects/YOUR_USERNAME/assets/Summer_LST_2014');
analyzeYear(2024, 'projects/YOUR_USERNAME/assets/Summer_LST_2024');
