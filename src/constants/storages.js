import { rid } from "../utils/index.js";

export const STORAGE_COLUMNS = () => [
  { key: "item", label: { en: "Item / Contents", ar: "الصنف / المحتويات" }, type: "text" },
  { key: "boxes", label: { en: "Boxes", ar: "صناديق" }, type: "number" },
  { key: "pallets", label: { en: "Pallets", ar: "مشاتيح" }, type: "number" },
  { key: "notes", label: { en: "Notes", ar: "ملاحظات" }, type: "text" },
];

export const DEFAULT_STORAGE_SITES = () => [
  { id: "st_1", name: { en: "Storage 1", ar: "مخزن 1" }, color: "#2e7d46" },
  { id: "st_2", name: { en: "Storage 2", ar: "مخزن 2" }, color: "#1f6f8b" },
  { id: "st_3", name: { en: "Storage 3", ar: "مخزن 3" }, color: "#6b4fa0" },
  { id: "st_4", name: { en: "Storage 4", ar: "مخزن 4" }, color: "#8a5a2e" },
  { id: "st_5", name: { en: "Storage 5", ar: "مخزن 5" }, color: "#4a7c8c" },
  { id: "st_6", name: { en: "Storage 6", ar: "مخزن 6" }, color: "#8a8a8a" },
];

export function storageRow(values) {
  return { id: rid(), values: { ...values, lastUpdated: values.lastUpdated ?? null } };
}

export function seedStorageSites() {
  return DEFAULT_STORAGE_SITES().map((site) => ({
    ...site,
    rows: [],
  }));
}

function normalizeStorageRow(row) {
  if (!row?.values) return row;
  const v = { ...row.values };
  if (v.pallets == null && v.units != null) v.pallets = v.units;
  if (v.pallets == null) v.pallets = 0;
  delete v.units;
  return { ...row, values: v };
}

export function normalizeStorageSites(sites) {
  if (!Array.isArray(sites) || sites.length === 0) return seedStorageSites();
  const defaults = DEFAULT_STORAGE_SITES();
  return defaults.map((def, i) => {
    const existing = sites.find((s) => s.id === def.id) || sites[i];
    if (!existing) return { ...def, rows: [] };
    return {
      id: def.id,
      name: existing.name?.en || existing.name?.ar ? existing.name : def.name,
      color: existing.color || def.color,
      rows: Array.isArray(existing.rows) ? existing.rows.map(normalizeStorageRow) : [],
    };
  });
}

export function normalizeStorageLog(log) {
  if (!Array.isArray(log)) return [];
  return log.map((e) => ({
    ...e,
    palletsTaken: e.palletsTaken ?? e.unitsTaken ?? 0,
  }));
}

export function storageSiteTotals(site) {
  let boxes = 0;
  let pallets = 0;
  (site.rows || []).forEach((r) => {
    boxes += Number(r.values?.boxes) || 0;
    pallets += Number(r.values?.pallets ?? r.values?.units) || 0;
  });
  return { items: site.rows?.length || 0, boxes, pallets };
}
