#!/usr/bin/env python3
"""Convert vendor spreadsheet into site-ready JSON data."""

import json
import math
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
XLSX_PATH = ROOT / "data" / "raw" / "Toy_Vending_Supplies_USD.xlsx"
OUTPUT_PATH = ROOT / "src" / "data" / "products.json"
CAPSULES_PER_CASE = 250
MARKUP_MULTIPLIER = 2.0
SHEET_NAME = "Bulk Vending Refills"

SKIP_LABELS = {
    "item #",
    "description",
    "remarks",
    "certificate",
    "unit price",
    "m.o.q",
    "varieties",
    "suitable capsules",
}


def normalize_text(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    if pd.isna(value):
        return ""
    if isinstance(value, (int, float)):
        if float(value).is_integer():
            return str(int(value))
        return str(value)
    return ""


def safe_float(value: Any) -> float | None:
    if pd.isna(value):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def main() -> None:
    df = pd.read_excel(XLSX_PATH, sheet_name=SHEET_NAME, header=None)
    df = df.iloc[18:].reset_index(drop=True)

    capturing = False
    current_category = None
    products: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        second_col = row[1]
        third_col = row[2]

        label = normalize_text(second_col)
        description = normalize_text(third_col)

        if label and not description:
            lowered = label.lower()
            if lowered.startswith("packing") or lowered in SKIP_LABELS:
                continue
            current_category = label
            continue

        if not capturing:
            if label.lower() == "item #":
                capturing = True
            continue

        sku = label
        if not sku or sku.lower().startswith("packing"):
            continue

        capsule_price = safe_float(row[5])
        if capsule_price is None:
            continue

        capsule_price *= MARKUP_MULTIPLIER
        case_price = round(capsule_price * CAPSULES_PER_CASE, 2)

        moq_units = safe_float(row[7])
        moq_cases = math.ceil(moq_units / CAPSULES_PER_CASE) if moq_units else None

        product = {
            "sku": sku,
            "name": description or "Unnamed Item",
            "remarks": normalize_text(row[3]),
            "certificate": normalize_text(row[4]),
            "category": current_category or "Uncategorized",
            "capsulePrice": round(capsule_price, 4),
            "casePrice": case_price,
            "capsulesPerCase": CAPSULES_PER_CASE,
            "moqUnits": int(moq_units) if moq_units else None,
            "moqCases": int(moq_cases) if moq_cases else None,
            "varieties": {
                "models": normalize_text(row[8]),
                "colors": normalize_text(row[9]),
            },
            "capsuleTypes": normalize_text(row[10]),
        }

        products.append(product)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(products, f, indent=2)

    print(f"Wrote {len(products)} products to {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
