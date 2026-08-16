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

export function normalizeLocations(locations) {
  return Array.isArray(locations) && locations.length > 0 ? locations : DEFAULT_LOCATIONS;
}
