import { DEFAULT_COLUMNS, MATERIAL_TYPES, METERS_CRITICAL_THRESHOLD, METERS_LOW_THRESHOLD, parseWidth, normalizeMeterRef, meterCodesForRow, isFinishWidthSheet } from "../constants/index.js";
import { nameOf } from "../i18n/strings.js";

export function cat() { return "c_" + Math.random().toString(36).slice(2, 10); }
export function rid() { return "r_" + Math.random().toString(36).slice(2, 10); }
export function row(values) { return { id: rid(), values }; }

/** Parse numeric value from the Meters (ref) field */
export function parseMeters(ref) {
  if (ref == null || ref === "") return 0;
  const cleaned = String(ref).replace(/,/g, "").trim();
  const direct = Number(cleaned);
  if (!Number.isNaN(direct) && cleaned !== "") return direct;
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export { normalizeMeterRef, meterCodesForRow, parseWidth };

/** Total meters in stock = quantity × width (mm). Finish sheets (Matt/Glossy) have no width-based total. */
export function rowTotalMeters(row, category) {
  if (category && isFinishWidthSheet(category)) return 0;
  const qty = Number(row?.values?.qty) || 0;
  const width = parseWidth(row?.values?.desc, row?.values?.ref);
  if (width > 0) return qty * width;
  return 0;
}

export function isRowLowMeterStock(row, category) {
  return rowMeterSeverity(row, category) !== null;
}

/** null = ok · low = below 10k (red) · critical = below 5k (yellow) · out = qty is zero */
export function meterStockSeverity(meters, qty) {
  const q = Number(qty) || 0;
  if (q <= 0) return "out";
  if (meters <= 0) return null;
  if (meters < METERS_CRITICAL_THRESHOLD) return "critical";
  if (meters < METERS_LOW_THRESHOLD) return "low";
  return null;
}

export function isMeterLowStock(meters, qty) {
  return meterStockSeverity(meters, qty) !== null;
}

export function rowMeterSeverity(row, category) {
  const qty = Number(row?.values?.qty) || 0;
  if (category && isFinishWidthSheet(category)) {
    return qty <= 0 ? "out" : null;
  }
  return meterStockSeverity(rowTotalMeters(row, category), qty);
}

export function meterRowClass(severity) {
  if (severity === "out" || severity === "low") return "bg-red-50/50";
  if (severity === "critical") return "bg-amber-50/70";
  return "";
}

export function meterCellClass(severity) {
  if (severity === "out" || severity === "low") return "border-red-300 text-red-700 font-bold bg-red-50/30";
  if (severity === "critical") return "border-amber-400 text-amber-800 font-bold bg-amber-50/50";
  return "border-transparent";
}

export function toCSV(category, locations, lang) {
  const cols = [
    ...category.columns,
    { key: "__location__", label: { en: "Location", ar: "المكان" } },
  ];
  const header = cols.map((c) => `"${nameOf(c.label, lang).replace(/"/g, '""')}"`).join(",");
  const lines = category.rows.map((r) => {
    const locName = nameOf(locations.find((l) => l.id === r.values.location)?.name, lang) || "";
    return cols.map((c) => {
      const v = c.key === "__location__" ? locName : r.values[c.key];
      return `"${String(v ?? "").replace(/"/g, '""')}"`;
    }).join(",");
  });
  return [header, ...lines].join("\n");
}

export function downloadText(filename, text) {
  const blob = new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function mkCat(nameEn, nameAr, lowStockAt, rowsRaw, defaultMaterial) {
  return {
    id: cat(),
    name: { en: nameEn, ar: nameAr },
    lowStockAt,
    columns: DEFAULT_COLUMNS(),
    rows: rowsRaw.map(([desc, ref, qty, notes]) =>
      row({ desc, ref, qty, notes, location: "loc_unassigned", type: defaultMaterial || "mat_unassigned", lastUpdated: null })
    ),
  };
}

export const seedCategories = () => [
  mkCat("Paper", "ورق", 10, [
    ["", "1800/33", 80, ""],
    ["", "1800/33", 217, ""],
    ["", "1800/30", 136, ""],
    ["", "1800/28", 70, "code partly illegible"],
    ["", "1800/26", 62, ""],
    ["", "-", 79, "digits unclear — verify"],
    ["", "1800/27", 1, ""],
    ["", "1800/21", 23, ""],
  ], "mat_paper"),
  mkCat("Plastic", "بلاستيك", 5, [
    ["", "1000/33", 5, ""],
    ["", "880/33", 3, ""],
    ["", "1000/32", 4, ""],
    ["", "?/32", 4, "code hard to read"],
    ["", "?/32", 5, "code hard to read"],
  ], "mat_transparent"),
  mkCat("Clear Plastic", "بلاستيك شفاف", 5, [
    ["", "1000/33", 90, ""],
    ["", "990/33", 39, "boxed 120 on page"],
    ["", "970/33", 6, ""],
    ["", "950/33", 6, "digits unclear"],
    ["", "940/33", 6, "digits unclear"],
    ["", "2000/33", 3, ""],
    ["", "1500/33", 1, ""],
    ["", "1500/33", 1, ""],
    ["", "1000/32", 4, ""],
    ["", "950/32", 11, ""],
    ["", "2000/30", 7, ""],
    ["", "2050/28", 3, ""],
    ["", "2000/28", 1, ""],
    ["", "1000/27", 2, ""],
    ["", "1000/26", 27, ""],
    ["", "1800/16", 2, ""],
    ["", "1800/16", 3, ""],
  ], "mat_plastic"),
  mkCat("FSC Coated Paper", "ورق FSC", 5, [
    ["", "110x1000", 146, ""],
    ["", "110x950", 6, ""],
    ["", "110x800", 1, ""],
    ["", "1000/21", 3, "from separate note page"],
  ], "mat_paper"),
  mkCat("Silver", "فضي", 5, [
    ["", "", 0, ""],
    ["", "", 0, ""],
    ["", "", 0, ""],
    ["", "", 0, ""],
    ["", "", 0, ""],
  ], "mat_silver"),
];

export { mkCat };

export function swapPlasticSheetNames(categories) {
  const clear = categories.find((c) => c.name?.en === "Clear Plastic");
  if (!clear) return categories;
  const transparentCount = clear.rows.filter((r) => r.values.type === "mat_transparent").length;
  if (transparentCount <= clear.rows.length / 2) return categories;
  return categories.map((c) => {
    if (c.name?.en === "Clear Plastic") return { ...c, name: { en: "Plastic", ar: "بلاستيك" } };
    if (c.name?.en === "Plastic") return { ...c, name: { en: "Clear Plastic", ar: "بلاستيك شفاف" } };
    return c;
  });
}
