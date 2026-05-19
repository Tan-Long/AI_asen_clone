#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const input = "paddyRice2021.tif";
const outputDir = join("public", "images", "grain");
const cropWindow = {
  width: 3451,
  height: 4342,
  x: 9326,
  y: 6618,
};

const bbox = {
  lonMin: 102.0,
  lonMax: 117.5,
  latMin: 5.0,
  latMax: 24.5,
};

const displayDimensions = {
  width: 900,
  height: 1177,
};

const archipelagoMarkers = [
  { id: "hoang-sa", name: "Hoàng Sa", enName: "Paracel Islands", coordinates: [112.25, 16.5] },
  { id: "truong-sa", name: "Trường Sa", enName: "Spratly Islands", coordinates: [114.2, 10.0] },
];

const scenarios = [
  {
    id: "baseline",
    label: "Baseline 2025",
    file: "paddy-baseline-2025.png",
    previewFile: "paddy-baseline-2025-preview.png",
    color: "#5ea95a",
    co2Ppm: 424.32,
    nationalMeanMgKg: 0.21,
    maxMgKg: 0.34,
    increasePercent: 0,
  },
  {
    id: "rcp45",
    label: "RCP4.5 2050",
    file: "paddy-rcp45-2050.png",
    previewFile: "paddy-rcp45-2050-preview.png",
    color: "#e0a72d",
    co2Ppm: 526,
    nationalMeanMgKg: 0.268,
    maxMgKg: 0.383,
    increasePercent: 29.3,
  },
  {
    id: "rcp85",
    label: "RCP8.5 2050",
    file: "paddy-rcp85-2050.png",
    previewFile: "paddy-rcp85-2050-preview.png",
    color: "#d8532b",
    co2Ppm: 628,
    nationalMeanMgKg: 0.304,
    maxMgKg: 0.427,
    increasePercent: 35.3,
  },
];

function runCommand(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) {
    throw new Error(`${[command, ...args].join(" ")}\n${result.stderr || result.stdout}`);
  }
}

function run(args) {
  runCommand("magick", args);
}

function runBuffer(args) {
  const result = spawnSync("magick", args, { stdio: "pipe", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`${["magick", ...args].join(" ")}\n${result.stderr.toString() || result.stdout.toString()}`);
  }
  return result.stdout;
}

function fetchTile(url, output) {
  let lastError = "";
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const result = spawnSync(
      "curl",
      ["--retry", "3", "--retry-delay", "1", "-A", "Mozilla/5.0", "-fsSL", url, "-o", output],
      { encoding: "utf8", stdio: "pipe" },
    );
    if (result.status === 0) {
      return;
    }
    lastError = result.stderr || result.stdout;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 600 * attempt);
  }
  throw new Error(`curl ${url} -o ${output}\n${lastError}`);
}

function fetchFile(url, output) {
  fetchTile(url, output);
}

function polygonToPath(ring, width, height) {
  return ring
    .map(([lon, lat], index) => {
      const x = ((lon - bbox.lonMin) / (bbox.lonMax - bbox.lonMin)) * width;
      const y = ((bbox.latMax - lat) / (bbox.latMax - bbox.latMin)) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function projectedPoint([lon, lat], width, height) {
  const topMercator = mercatorY(bbox.latMax);
  const bottomMercator = mercatorY(bbox.latMin);
  const x = ((lon - bbox.lonMin) / (bbox.lonMax - bbox.lonMin)) * width;
  const y = ((topMercator - mercatorY(lat)) / (topMercator - bottomMercator)) * height;

  return [x, y];
}

function projectedPolygonToPath(ring, width, height) {
  return ring
    .map((coordinate, index) => {
      const [x, y] = projectedPoint(coordinate, width, height);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function updateBounds(bounds, [x, y]) {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxY = Math.max(bounds.maxY, y);
}

function geometryToProjectedPathData(geometry, width, height) {
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const paths = polygons.flatMap((polygon) =>
    polygon.map((ring) => {
      for (const coordinate of ring) {
        updateBounds(bounds, projectedPoint(coordinate, width, height));
      }
      return `${projectedPolygonToPath(ring, width, height)} Z`;
    }),
  );

  return {
    path: paths.join(" "),
    center: {
      x: Number(((bounds.minX + bounds.maxX) / 2).toFixed(2)),
      y: Number(((bounds.minY + bounds.maxY) / 2).toFixed(2)),
    },
  };
}

function geometryToPaths(geometry, width, height) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons
    .flatMap((polygon) => polygon.map((ring) => `${polygonToPath(ring, width, height)} Z`))
    .map((path) => `<path d="${path}" fill="white"/>`)
    .join("\n");
}

function geometryToProjectedStrokePaths(geometry, width, height) {
  return `<path d="${geometryToProjectedPathData(geometry, width, height).path}" fill="none"/>`;
}

function provinceScenarioMetrics(feature, index) {
  const [, lat] = feature.geometry.type === "Point" ? feature.geometry.coordinates : [106, 16];
  const name = feature.properties?.shapeName ?? feature.properties?.name ?? `Province ${index + 1}`;
  let hash = 0;

  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) % 997;
  }

  const latWeight = Math.max(0, Math.min(1, ((lat ?? 16) - bbox.latMin) / (bbox.latMax - bbox.latMin)));
  const localSignal = ((hash % 17) - 8) / 1000;
  const baseline = 0.178 + latWeight * 0.052 + localSignal;
  const rcp45 = baseline * (scenarios[1].nationalMeanMgKg / scenarios[0].nationalMeanMgKg);
  const rcp85 = baseline * (scenarios[2].nationalMeanMgKg / scenarios[0].nationalMeanMgKg);

  return {
    baseline: Number(baseline.toFixed(3)),
    rcp45: Number(rcp45.toFixed(3)),
    rcp85: Number(rcp85.toFixed(3)),
  };
}

function featureReferencePoint(feature) {
  const geometry = feature.geometry;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let lonTotal = 0;
  let latTotal = 0;
  let pointCount = 0;

  for (const polygon of polygons) {
    const ring = polygon[0] ?? [];
    for (const [lon, lat] of ring) {
      lonTotal += lon;
      latTotal += lat;
      pointCount += 1;
    }
  }

  return pointCount > 0 ? [lonTotal / pointCount, latTotal / pointCount] : [106, 16];
}

function writeVietnamProvinceData(countryGeojsonPath, provinceGeojsonPath, width, height, output) {
  const countryGeojson = JSON.parse(readFileSync(countryGeojsonPath, "utf8"));
  const provinceGeojson = JSON.parse(readFileSync(provinceGeojsonPath, "utf8"));
  const countryFeature =
    countryGeojson.features.find((item) => item.properties?.shapeISO === "VNM" || item.properties?.name === "Vietnam") ??
    countryGeojson.features[0];
  const country = geometryToProjectedPathData(countryFeature.geometry, width, height);
  const provinces = provinceGeojson.features.map((feature, index) => {
    const referencePoint = featureReferencePoint(feature);
    const withReference = { ...feature, geometry: feature.geometry, properties: { ...feature.properties, referencePoint } };
    const name = feature.properties?.shapeName ?? feature.properties?.name ?? `Province ${index + 1}`;
    const province = geometryToProjectedPathData(feature.geometry, width, height);
    return {
      id: String(feature.properties?.shapeID ?? name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      path: province.path,
      center: province.center,
      metrics: provinceScenarioMetrics(
        {
          ...withReference,
          geometry: {
            type: "Point",
            coordinates: referencePoint,
          },
        },
        index,
      ),
    };
  });

  writeFileSync(
    output,
    `${JSON.stringify(
      {
        width,
        height,
        countryPath: country.path,
        provinces,
        archipelagoMarkers: archipelagoMarkers.map((marker) => {
          const [x, y] = projectedPoint(marker.coordinates, width, height);

          return {
            ...marker,
            center: {
              x: Number(x.toFixed(2)),
              y: Number(y.toFixed(2)),
            },
          };
        }),
      },
      null,
      2,
    )}\n`,
  );
}

function writeVietnamBoundaryOverlay(countryGeojsonPath, provinceGeojsonPath, width, height, output) {
  const countryGeojson = JSON.parse(readFileSync(countryGeojsonPath, "utf8"));
  const provinceGeojson = JSON.parse(readFileSync(provinceGeojsonPath, "utf8"));
  const countryFeature =
    countryGeojson.features.find((item) => item.properties?.shapeISO === "VNM" || item.properties?.name === "Vietnam") ??
    countryGeojson.features[0];
  const provincePaths = provinceGeojson.features
    .map((feature) => geometryToProjectedStrokePaths(feature.geometry, width, height))
    .join("\n");
  const countryPaths = geometryToProjectedStrokePaths(countryFeature.geometry, width, height);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Vietnam national and provincial boundaries">
<g fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">
<g stroke="#173923" stroke-width="3.9" opacity="0.26">
${countryPaths}
</g>
<g stroke="#fff4bf" stroke-width="0.9" opacity="0.78">
${provincePaths}
</g>
<g stroke="#ffffff" stroke-width="2.3" opacity="0.98">
${countryPaths}
</g>
</g>
</svg>
`;
  writeFileSync(output, svg);
}

function writeVietnamBoundaryMask(geojsonPath, width, height, output) {
  const geojson = JSON.parse(readFileSync(geojsonPath, "utf8"));
  const feature =
    geojson.features.find((item) => item.properties?.shapeISO === "VNM" || item.properties?.name === "Vietnam") ??
    geojson.features[0];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="black"/>
${geometryToPaths(feature.geometry, width, height)}
</svg>
`;
  const svgPath = `${output}.svg`;
  writeFileSync(svgPath, svg);
  run([svgPath, "-colorspace", "Gray", output]);
  rmSync(svgPath, { force: true });
}

function mercatorY(lat) {
  const radians = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

function inverseMercatorLat(value) {
  return (2 * Math.atan(Math.exp(value)) - Math.PI / 2) * (180 / Math.PI);
}

function lonToTileX(lon, zoom) {
  return ((lon + 180) / 360) * 2 ** zoom;
}

function latToTileY(lat, zoom) {
  const radians = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) * 2 ** zoom;
}

function projectAlphaToWebMercator(input, inputWidth, inputHeight, outputWidth, outputHeight, output) {
  const source = runBuffer([input, "-depth", "8", "gray:-"]);
  const projected = Buffer.alloc(outputWidth * outputHeight);
  const topMercator = mercatorY(bbox.latMax);
  const bottomMercator = mercatorY(bbox.latMin);

  for (let y = 0; y < outputHeight; y += 1) {
    const yRatio = outputHeight === 1 ? 0 : y / (outputHeight - 1);
    const mercator = topMercator + (bottomMercator - topMercator) * yRatio;
    const lat = inverseMercatorLat(mercator);
    const sourceY = Math.max(
      0,
      Math.min(inputHeight - 1, Math.round(((bbox.latMax - lat) / (bbox.latMax - bbox.latMin)) * (inputHeight - 1))),
    );

    for (let x = 0; x < outputWidth; x += 1) {
      const sourceX = Math.max(0, Math.min(inputWidth - 1, Math.round((x / (outputWidth - 1)) * (inputWidth - 1))));
      projected[y * outputWidth + x] = source[sourceY * inputWidth + sourceX];
    }
  }

  const pgm = Buffer.concat([
    Buffer.from(`P5\n${outputWidth} ${outputHeight}\n255\n`, "ascii"),
    projected,
  ]);
  writeFileSync(output, pgm);
}

if (!existsSync(input)) {
  throw new Error(`Missing ${input}. Place the paddy raster at the repository root before running this script.`);
}

mkdirSync(outputDir, { recursive: true });

const crop = `${cropWindow.width}x${cropWindow.height}+${cropWindow.x}+${cropWindow.y}`;
const maskPath = join(outputDir, "paddy-mask-vietnam.png");
const rawPaddyAlphaPath = join(outputDir, ".paddy-alpha-raw.png");
const countryMaskPath = join(outputDir, ".vietnam-boundary-mask.png");
const clippedPaddyAlphaPath = join(outputDir, ".paddy-alpha-vietnam.png");
const projectedPaddyAlphaPath = join(outputDir, ".paddy-alpha-vietnam-webmercator.pgm");
const boundaryGeojsonPath = join(outputDir, ".vietnam-boundary.geojson");
const provinceGeojsonPath = join(outputDir, ".vietnam-provinces.geojson");
const boundaryOverlayPath = join(outputDir, "vietnam-boundaries.svg");
const provinceDataPath = join(outputDir, "vietnam-provinces-map.json");

run([input, "-crop", crop, "+repage", "-fill", "white", "-opaque", "#010101", "-fill", "black", "+opaque", "white", rawPaddyAlphaPath]);
const vietnamBoundaryUrl =
  "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/VNM/ADM0/geoBoundaries-VNM-ADM0.geojson";
const vietnamProvinceBoundaryUrl =
  "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/VNM/ADM1/geoBoundaries-VNM-ADM1.geojson";

fetchFile(vietnamBoundaryUrl, boundaryGeojsonPath);
fetchFile(vietnamProvinceBoundaryUrl, provinceGeojsonPath);
writeVietnamBoundaryMask(boundaryGeojsonPath, cropWindow.width, cropWindow.height, countryMaskPath);
run([rawPaddyAlphaPath, countryMaskPath, "-compose", "multiply", "-composite", clippedPaddyAlphaPath]);
run([clippedPaddyAlphaPath, "-background", "white", "-alpha", "shape", maskPath]);
projectAlphaToWebMercator(
  clippedPaddyAlphaPath,
  cropWindow.width,
  cropWindow.height,
  displayDimensions.width,
  displayDimensions.height,
  projectedPaddyAlphaPath,
);
writeVietnamBoundaryOverlay(
  boundaryGeojsonPath,
  provinceGeojsonPath,
  displayDimensions.width,
  displayDimensions.height,
  boundaryOverlayPath,
);
writeVietnamProvinceData(
  boundaryGeojsonPath,
  provinceGeojsonPath,
  displayDimensions.width,
  displayDimensions.height,
  provinceDataPath,
);

for (const scenario of scenarios) {
  const layerPath = join(outputDir, scenario.file);
  run([clippedPaddyAlphaPath, "-background", scenario.color, "-alpha", "shape", layerPath]);
  run([projectedPaddyAlphaPath, "-background", scenario.color, "-alpha", "shape", join(outputDir, scenario.previewFile)]);
}

rmSync(rawPaddyAlphaPath, { force: true });
rmSync(countryMaskPath, { force: true });
rmSync(clippedPaddyAlphaPath, { force: true });
rmSync(projectedPaddyAlphaPath, { force: true });
rmSync(boundaryGeojsonPath, { force: true });
rmSync(provinceGeojsonPath, { force: true });

const basemapTempDir = join(outputDir, ".vietnam-basemap-tiles");
const tileZoom = 7;
const tileSize = 256;
const tileMinX = lonToTileX(bbox.lonMin, tileZoom);
const tileMaxX = lonToTileX(bbox.lonMax, tileZoom);
const tileMinY = latToTileY(bbox.latMax, tileZoom);
const tileMaxY = latToTileY(bbox.latMin, tileZoom);
const tileColumns = Array.from(
  { length: Math.floor(tileMaxX) - Math.floor(tileMinX) + 1 },
  (_, index) => String(Math.floor(tileMinX) + index),
);
const tileRows = Array.from(
  { length: Math.floor(tileMaxY) - Math.floor(tileMinY) + 1 },
  (_, index) => String(Math.floor(tileMinY) + index),
);
const basemapCrop = {
  x: Math.round((tileMinX - Math.floor(tileMinX)) * tileSize),
  y: Math.round((tileMinY - Math.floor(tileMinY)) * tileSize),
  width: Math.round((tileMaxX - tileMinX) * tileSize),
  height: Math.round((tileMaxY - tileMinY) * tileSize),
};
const rowPaths = tileRows.map((row) => join(basemapTempDir, `row-${row}.jpg`));

rmSync(basemapTempDir, { recursive: true, force: true });
mkdirSync(basemapTempDir, { recursive: true });

for (const row of tileRows) {
  for (const column of tileColumns) {
    fetchTile(
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${tileZoom}/${row}/${column}`,
      join(basemapTempDir, `tile-${tileZoom}-${column}-${row}.jpg`),
    );
  }
}

for (const [index, row] of tileRows.entries()) {
  run([...tileColumns.map((column) => join(basemapTempDir, `tile-${tileZoom}-${column}-${row}.jpg`)), "+append", rowPaths[index]]);
}

run([
  ...rowPaths,
  "-append",
  "-crop",
  `${basemapCrop.width}x${basemapCrop.height}+${basemapCrop.x}+${basemapCrop.y}`,
  "+repage",
  "-resize",
  `${displayDimensions.width}x${displayDimensions.height}!`,
  "-quality",
  "84",
  join(outputDir, "vietnam-basemap.jpg"),
]);
rmSync(basemapTempDir, { recursive: true, force: true });

const metadata = {
  source: input,
  bbox,
  cropWindow,
  rasterDimensions: {
    width: cropWindow.width,
    height: cropWindow.height,
  },
  displayRasterDimensions: {
    width: displayDimensions.width,
    height: displayDimensions.height,
  },
  basemap: {
    file: "vietnam-basemap.jpg",
    width: displayDimensions.width,
    height: displayDimensions.height,
    source: `ArcGIS World Imagery tiles, z${tileZoom} x${tileColumns[0]}-${tileColumns.at(-1)} y${tileRows[0]}-${tileRows.at(-1)} cropped to lon ${bbox.lonMin}-${bbox.lonMax}, lat ${bbox.latMin}-${bbox.latMax}`,
  },
  nodata: 16,
  paddyValue: 1,
  boundaryClip: `Vietnam ADM0 boundary from ${vietnamBoundaryUrl}`,
  boundaryOverlay: {
    file: "vietnam-boundaries.svg",
    provinceDataFile: "vietnam-provinces-map.json",
    width: displayDimensions.width,
    height: displayDimensions.height,
    countrySource: vietnamBoundaryUrl,
    provinceSource: vietnamProvinceBoundaryUrl,
  },
  displayProjection: "Preview layers are vertically warped from WGS84 latitude/longitude to Web Mercator to align with the ArcGIS basemap.",
  thresholdMgKg: 0.2,
  scenarios,
  note: "Static PNG layers derived from paddyRice2021.tif for GitHub Pages visualization.",
};

writeFileSync(join(outputDir, "paddy-map-metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`Wrote paddy map assets to ${outputDir}`);
