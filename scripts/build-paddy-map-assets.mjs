#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const input = "paddyRice2021.tif";
const outputDir = join("public", "images", "grain");
const cropWindow = {
  width: 1848,
  height: 3518,
  x: 9326,
  y: 6774,
};

const bbox = {
  lonMin: 102.0,
  lonMax: 110.3,
  latMin: 8.0,
  latMax: 23.8,
};

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

function geometryToPaths(geometry, width, height) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons
    .flatMap((polygon) => polygon.map((ring) => `${polygonToPath(ring, width, height)} Z`))
    .map((path) => `<path d="${path}" fill="white"/>`)
    .join("\n");
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

run([input, "-crop", crop, "+repage", "-fill", "white", "-opaque", "#010101", "-fill", "black", "+opaque", "white", rawPaddyAlphaPath]);
const vietnamBoundaryUrl =
  "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/VNM/ADM0/geoBoundaries-VNM-ADM0.geojson";

fetchFile(vietnamBoundaryUrl, boundaryGeojsonPath);
writeVietnamBoundaryMask(boundaryGeojsonPath, cropWindow.width, cropWindow.height, countryMaskPath);
run([rawPaddyAlphaPath, countryMaskPath, "-compose", "multiply", "-composite", clippedPaddyAlphaPath]);
run([clippedPaddyAlphaPath, "-background", "white", "-alpha", "shape", maskPath]);
projectAlphaToWebMercator(clippedPaddyAlphaPath, cropWindow.width, cropWindow.height, 755, 1501, projectedPaddyAlphaPath);

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

const basemapTempDir = join(outputDir, ".vietnam-basemap-tiles");
const tileColumns = ["100", "101", "102", "103"];
const tileRows = ["55", "56", "57", "58", "59", "60", "61"];
const rowPaths = tileRows.map((row) => join(basemapTempDir, `row-${row}.jpg`));

rmSync(basemapTempDir, { recursive: true, force: true });
mkdirSync(basemapTempDir, { recursive: true });

for (const row of tileRows) {
  for (const column of tileColumns) {
    fetchTile(
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/7/${row}/${column}`,
      join(basemapTempDir, `tile-7-${column}-${row}.jpg`),
    );
  }
}

for (const [index, row] of tileRows.entries()) {
  run([...tileColumns.map((column) => join(basemapTempDir, `tile-7-${column}-${row}.jpg`)), "+append", rowPaths[index]]);
}

run([
  ...rowPaths,
  "-append",
  "-crop",
  "755x1501+68+73",
  "+repage",
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
    width: 755,
    height: 1501,
  },
  basemap: {
    file: "vietnam-basemap.jpg",
    width: 755,
    height: 1501,
    source: "ArcGIS World Imagery tiles, z7 x100-103 y55-61 cropped to lon 102.0-110.3, lat 8.0-23.8",
  },
  nodata: 16,
  paddyValue: 1,
  boundaryClip: `Vietnam ADM0 boundary from ${vietnamBoundaryUrl}`,
  displayProjection: "Preview layers are vertically warped from WGS84 latitude/longitude to Web Mercator to align with the ArcGIS basemap.",
  thresholdMgKg: 0.2,
  scenarios,
  note: "Static PNG layers derived from paddyRice2021.tif for GitHub Pages visualization.",
};

writeFileSync(join(outputDir, "paddy-map-metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`Wrote paddy map assets to ${outputDir}`);
