#!/usr/bin/env python3

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Any

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "data" / "baseline.xlsx"
FUTURE = ROOT / "data" / "future.xlsx"
OUTPUT = ROOT / "src" / "lib" / "dashboard-data.generated.json"
THRESHOLD = 0.2


def percentile(values: list[float], p: float) -> float:
  ordered = sorted(values)
  if not ordered:
    return 0.0

  k = (len(ordered) - 1) * p
  lower = int(k)
  upper = min(lower + 1, len(ordered) - 1)
  weight = k - lower
  return ordered[lower] * (1 - weight) + ordered[upper] * weight


def stats(rows: list[dict[str, Any]]) -> dict[str, Any]:
  values = [float(row["grainAs"]) for row in rows]
  ci_lower = [float(row["ciLower"]) for row in rows if row.get("ciLower") is not None]
  ci_upper = [float(row["ciUpper"]) for row in rows if row.get("ciUpper") is not None]
  uncertainty = [float(row["uncertaintyScore"]) for row in rows if row.get("uncertaintyScore") is not None]

  return {
    "count": len(values),
    "mean": sum(values) / len(values),
    "median": percentile(values, 0.5),
    "p10": percentile(values, 0.1),
    "p90": percentile(values, 0.9),
    "min": min(values),
    "max": max(values),
    "exceedancePercent": sum(1 for value in values if value > THRESHOLD) / len(values) * 100,
    "ciLowerMean": sum(ci_lower) / len(ci_lower) if ci_lower else None,
    "ciUpperMean": sum(ci_upper) / len(ci_upper) if ci_upper else None,
    "uncertaintyMean": sum(uncertainty) / len(uncertainty) if uncertainty else None,
  }


def lat_band(latitude: float) -> str:
  if latitude >= 17:
    return "north"
  if latitude >= 13:
    return "central"
  return "south"


def load_rows(path: Path) -> list[dict[str, Any]]:
  workbook = openpyxl.load_workbook(path, data_only=True, read_only=True)
  sheet = workbook.active
  rows = sheet.iter_rows(values_only=True)
  headers = [str(value) if value is not None else "" for value in next(rows)]
  index = {header: column for column, header in enumerate(headers)}
  has_year = "Year" in index or "year" in index
  year_key = "Year" if "Year" in index else "year"
  parsed: list[dict[str, Any]] = []

  for values in rows:
    latitude = values[index["Latitude"]]
    longitude = values[index["Longitude"]]
    grain_as = values[index["Grain.As"]]

    if latitude is None or longitude is None or grain_as is None:
      continue

    row = {
      "latitude": float(latitude),
      "longitude": float(longitude),
      "grainAs": float(grain_as),
    }

    if has_year and values[index[year_key]] is not None:
      row["year"] = int(values[index[year_key]])

    for source_name, target_name in [
      ("scenario", "scenario"),
      ("Uncertainty_Score", "uncertaintyScore"),
      ("CI_lower", "ciLower"),
      ("CI_upper", "ciUpper"),
    ]:
      if source_name in index and values[index[source_name]] is not None:
        value = values[index[source_name]]
        row[target_name] = str(value) if target_name == "scenario" else float(value)

    parsed.append(row)

  return parsed


def summarize_by_year(rows: list[dict[str, Any]], fallback_year: int) -> list[dict[str, Any]]:
  grouped: dict[int, list[dict[str, Any]]] = defaultdict(list)

  for row in rows:
    grouped[int(row.get("year", fallback_year))].append(row)

  return [{"year": year, **stats(year_rows)} for year, year_rows in sorted(grouped.items())]


def map_sample(row: dict[str, Any]) -> dict[str, float]:
  return {
    "latitude": round(float(row["latitude"]), 6),
    "longitude": round(float(row["longitude"]), 6),
    "value": round(float(row["grainAs"]), 6),
  }


baseline_rows = load_rows(BASELINE)
future_rows = load_rows(FUTURE)
baseline_years = summarize_by_year(baseline_rows, 2025)
future_years = sorted({int(row["year"]) for row in future_rows})
scenario_ids = ["rcp45", "rcp85"]
scenario_labels = {"rcp45": "RCP 4.5 Scenario", "rcp85": "RCP 8.5 Scenario"}
scenario_years = {}

for scenario_id in scenario_ids:
  scenario_years[scenario_id] = []
  for year in future_years:
    year_rows = [
      row
      for row in future_rows
      if row.get("scenario") == scenario_id and int(row["year"]) == year
    ]
    scenario_years[scenario_id].append({"year": year, **stats(year_rows)})

regions = []
region_meta = [
  ("north", "North", "Miền Bắc", "Very high", "Rất cao"),
  ("central", "Central", "Miền Trung", "High", "Cao"),
  ("south", "South", "Miền Nam", "Medium", "Trung bình"),
]

for region_id, name, vi_name, priority_en, priority_vi in region_meta:
  baseline_region_rows = [row for row in baseline_rows if lat_band(float(row["latitude"])) == region_id]
  region = {
    "id": region_id,
    "name": name,
    "viName": vi_name,
    "priority": {"vi": priority_vi, "en": priority_en},
    "baseline": stats(baseline_region_rows),
  }

  for scenario_id in scenario_ids:
    future_region_rows = [
      row
      for row in future_rows
      if row.get("scenario") == scenario_id
      and int(row["year"]) == 2050
      and lat_band(float(row["latitude"])) == region_id
    ]
    region[scenario_id] = stats(future_region_rows)

  regions.append(region)

baseline_stats = stats(baseline_rows)
future_stats = stats(future_rows)
output = {
  "sources": {
    "baseline": "data/baseline.xlsx",
    "future": "data/future.xlsx",
    "baselineHasYear": any("year" in row for row in baseline_rows),
  },
  "thresholdMgKg": THRESHOLD,
  "actual": {
    "id": "baseline",
    "label": "Actual Data (2017-2025)",
    "displayYear": max(point["year"] for point in baseline_years),
    "years": baseline_years,
    **baseline_stats,
  },
  "future": {
    "rows": len(future_rows),
    "years": future_years,
    "scenarios": {
      scenario_id: {
        "id": scenario_id,
        "label": scenario_labels[scenario_id],
        "targetYear": 2050,
        "years": scenario_years[scenario_id],
        "target": next(item for item in scenario_years[scenario_id] if item["year"] == 2050),
      }
      for scenario_id in scenario_ids
    },
    "summary": future_stats,
  },
  "mapSamples": {
    "baseline": [map_sample(row) for row in baseline_rows],
    **{
      scenario_id: [
        map_sample(row)
        for row in future_rows
        if row.get("scenario") == scenario_id and int(row["year"]) == 2050
      ]
      for scenario_id in scenario_ids
    },
  },
  "regions": regions,
  "modelCounts": {
    "actualRows": len(baseline_rows),
    "futureRows": len(future_rows),
    "locations": len(baseline_rows),
    "timeSteps": len(future_years),
    "futureScenarios": len(scenario_ids),
    "projectionInstances": len(future_rows),
  },
  "bbox": {
    "lonMin": min(float(row["longitude"]) for row in baseline_rows),
    "lonMax": max(float(row["longitude"]) for row in baseline_rows),
    "latMin": min(float(row["latitude"]) for row in baseline_rows),
    "latMax": max(float(row["latitude"]) for row in baseline_rows),
  },
}

OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
print(f"Wrote {OUTPUT.relative_to(ROOT)}")
print(f"baselineHasYear={output['sources']['baselineHasYear']}")
