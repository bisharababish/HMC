export const DEFAULT_LOCATIONS = [
  { id: "loc_warehouse", name: { en: "Warehouse", ar: "المخزن" }, color: "#2e7d46" },
  { id: "loc_aisle", name: { en: "Aisle / Corridor", ar: "الممر" }, color: "#8a5a2e" },
  { id: "loc_aisle_projects", name: { en: "Aisle Projects", ar: "مشاريع عند الممر" }, color: "#6b4fa0" },
  { id: "loc_entrance", name: { en: "Entrance", ar: "المدخل" }, color: "#1f6f8b" },
  { id: "loc_unassigned", name: { en: "Unassigned", ar: "غير محدد" }, color: "#8a8a8a" },
];

export const MATERIAL_TYPES = [
  { id: "mat_paper", name: { en: "Paper", ar: "ورق" }, color: "#a8842e" },
  { id: "mat_plastic", name: { en: "Plastic", ar: "بلاستيك" }, color: "#4a7c8c" },
  { id: "mat_transparent", name: { en: "Transparent", ar: "شفاف" }, color: "#6b9ac4" },
  { id: "mat_silver", name: { en: "Silver", ar: "فضي" }, color: "#8a8a8a" },
  { id: "mat_unassigned", name: { en: "Unassigned", ar: "غير محدد" }, color: "#b5b5b5" },
];

export const DEFAULT_COLUMNS = () => [
  { key: "desc", label: { en: "Width", ar: "العرض" }, type: "text" },
  { key: "ref", label: { en: "Meters", ar: "متر" }, type: "text" },
  { key: "qty", label: { en: "Quantity", ar: "الكمية" }, type: "number" },
  { key: "notes", label: { en: "Notes", ar: "ملاحظات" }, type: "text" },
];

export const STORAGE_KEY = "stock-ledger-v9";
export const STORAGE_KEY_LANG = "stock-ledger-lang";
export const MAX_HISTORY = 30;
export const MAX_LOG = 200;

/** Low stock alerts based on total meters (qty × width) */
export const METERS_LOW_THRESHOLD = 10000;
export const METERS_CRITICAL_THRESHOLD = 5000;

/** Thickness / product codes for the Meters column dropdown (plain numbers only) */
export const METER_CODES_BY_MATERIAL = {
  mat_paper: [33, 30, 28, 27, 26, 21, 110],
  mat_plastic: [33, 32, 30, 28, 27, 26, 20, 16],
  mat_transparent: [33, 32, 30, 28, 27, 26, 20, 16],
  mat_silver: [33, 32, 30, 28, 27, 26, 20, 16],
  mat_unassigned: [33, 32, 30, 28, 27, 26, 21, 20, 16, 110],
};

/** Full meter-code lists per sheet tab */
export const METER_CODES_BY_SHEET = {
  Paper: [33, 30, 28, 27, 26, 21, 110],
  "FSC Coated Paper": [110, 33, 30, 28, 27, 26, 21],
  Plastic: [33, 32, 30, 28, 27, 26, 20, 16],
  "Clear Plastic": [33, 32, 30, 28, 27, 26, 20, 16],
  Silver: [33, 32, 30, 28, 27, 26, 20, 16],
  Lamination: [33, 32, 30, 28, 27, 26, 20, 16],
};

/** Sheet tabs whose Width column uses finish labels (Matt / Glossy) instead of mm */
export const FINISH_WIDTH_SHEETS = new Set(["Lamination"]);

export function sheetConfigKey(category) {
  const en = (category?.name?.en || "").trim();
  if (/lamination/i.test(en)) return "Lamination";
  return en;
}

export function isFinishWidthSheet(category) {
  return FINISH_WIDTH_SHEETS.has(sheetConfigKey(category));
}

function sortCodesDesc(codes) {
  return [...codes].sort((a, b) => Number(b) - Number(a));
}

function meterCodesForSheet(sheetName) {
  if (sheetName && METER_CODES_BY_SHEET[sheetName]?.length) {
    return METER_CODES_BY_SHEET[sheetName];
  }
  return null;
}

function materialListForRow(row, category) {
  const sheet = sheetConfigKey(category);
  const bySheet = meterCodesForSheet(sheet);
  if (bySheet) return bySheet;

  const typeId = row?.values?.type;
  if (typeId && typeId !== "mat_unassigned" && METER_CODES_BY_MATERIAL[typeId]?.length) {
    return METER_CODES_BY_MATERIAL[typeId];
  }
  if (sheet === "Silver") return METER_CODES_BY_MATERIAL.mat_silver;
  if (sheet === "Clear Plastic") return METER_CODES_BY_MATERIAL.mat_transparent;
  if (sheet === "Plastic") return METER_CODES_BY_MATERIAL.mat_plastic;
  if (/paper/i.test(sheet)) return METER_CODES_BY_MATERIAL.mat_paper;
  if (typeId && METER_CODES_BY_MATERIAL[typeId]?.length) return METER_CODES_BY_MATERIAL[typeId];
  return METER_CODES_BY_MATERIAL.mat_unassigned;
}

/** Plain code strings for Meters dropdown, high → low */
export function meterCodesForRow(row, category) {
  return sortCodesDesc(materialListForRow(row, category)).map(String);
}

/** Normalize legacy ref (e.g. 1800/33 → 33) for dropdown matching */
export function normalizeMeterRef(ref) {
  if (ref == null || ref === "") return "";
  const s = String(ref).trim();
  if (/^110\s*[x×]/i.test(s)) return "110";
  const slash = s.match(/\/(\d+)\s*$/);
  if (slash) return slash[1];
  const n = Number(s.replace(/[^\d.]/g, ""));
  const allCodes = new Set([
    ...Object.values(METER_CODES_BY_MATERIAL).flat(),
    ...Object.values(METER_CODES_BY_SHEET).flat(),
  ]);
  if (!Number.isNaN(n) && allCodes.has(n)) return String(n);
  return s;
}

/** Parse width (mm) from Width column, with legacy fallback from ref like 1000/33 or 110x1000 */
export function parseWidth(widthVal, refFallback) {
  const w = Number(String(widthVal ?? "").replace(/,/g, "").trim());
  if (!Number.isNaN(w) && w > 0) return w;
  const s = String(refFallback ?? "").trim();
  const paper110 = s.match(/^110\s*[x×]\s*(\d+)/i);
  if (paper110) return Number(paper110[1]);
  const slash = s.match(/^(\d+)\s*\//);
  if (slash) return Number(slash[1]);
  return 0;
}

/** Width (mm) options by material type — sorted high→low when displayed */
export const WIDTH_BY_MATERIAL = {
  mat_paper: [1800, 1000, 950, 800],
  mat_plastic: [2050, 2000, 1500, 1000, 990, 970, 950, 940, 880, 800],
  mat_transparent: [2050, 2000, 1500, 1000, 990, 970, 950, 940, 880, 800],
  mat_silver: [2000, 1000, 950, 800],
  mat_unassigned: [],
};

/** Full width lists per sheet tab — numeric mm or finish labels (Matt / Glossy) */
export const WIDTH_BY_SHEET = {
  Paper: [1800],
  "FSC Coated Paper": [1000, 950, 800],
  Plastic: [2050, 2000, 1500, 1000, 990, 970, 950, 940, 880, 800],
  "Clear Plastic": [2050, 2000, 1800, 1500, 1000, 990, 970, 950, 940, 800],
  Silver: [2000, 1000, 950, 800],
  Lamination: ["Matt", "Glossy"],
};

function sortWidthsDesc(widths) {
  return [...widths].sort((a, b) => Number(b) - Number(a));
}

function widthsForSheet(sheetName) {
  if (sheetName && WIDTH_BY_SHEET[sheetName]?.length) {
    return WIDTH_BY_SHEET[sheetName];
  }
  return null;
}

export function widthsForRow(row, category) {
  const sheet = sheetConfigKey(category);
  const bySheet = widthsForSheet(sheet);
  if (bySheet) {
    const nums = bySheet.every((w) => !Number.isNaN(Number(w)));
    return nums ? sortWidthsDesc(bySheet) : [...bySheet];
  }

  const typeId = row?.values?.type;
  let list = [];
  const legacySheet = category?.name?.en || "";
  if (typeId && typeId !== "mat_unassigned" && WIDTH_BY_MATERIAL[typeId]?.length) {
    list = WIDTH_BY_MATERIAL[typeId];
  } else {
    if (legacySheet === "Silver") list = WIDTH_BY_MATERIAL.mat_silver;
    else if (legacySheet === "Clear Plastic") list = WIDTH_BY_MATERIAL.mat_transparent;
    else if (legacySheet === "Plastic") list = WIDTH_BY_MATERIAL.mat_plastic;
    else if (/paper/i.test(legacySheet)) list = WIDTH_BY_MATERIAL.mat_paper;
    else if (typeId && WIDTH_BY_MATERIAL[typeId]?.length) list = WIDTH_BY_MATERIAL[typeId];
  }
  return sortWidthsDesc(list);
}

export function normalizeLocations(locations) {
  return Array.isArray(locations) && locations.length > 0 ? locations : DEFAULT_LOCATIONS;
}
