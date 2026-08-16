import { DEFAULT_COLUMNS } from "../constants/index.js";
import { nameOf } from "../i18n/strings.js";
import { MATERIAL_TYPES } from "../constants/index.js";

export function cat() { return "c_" + Math.random().toString(36).slice(2, 10); }
export function rid() { return "r_" + Math.random().toString(36).slice(2, 10); }
export function row(values) { return { id: rid(), values }; }

export function toCSV(category, locations, lang) {
  const cols = [
    ...category.columns,
    { key: "__location__", label: { en: "Location", ar: "المكان" } },
    { key: "__type__", label: { en: "Material", ar: "المادة" } },
  ];
  const header = cols.map((c) => `"${nameOf(c.label, lang).replace(/"/g, '""')}"`).join(",");
  const lines = category.rows.map((r) => {
    const locName = nameOf(locations.find((l) => l.id === r.values.location)?.name, lang) || "";
    const typeName = nameOf(MATERIAL_TYPES.find((m) => m.id === r.values.type)?.name, lang) || "";
    return cols.map((c) => {
      const v = c.key === "__location__" ? locName : c.key === "__type__" ? typeName : r.values[c.key];
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
  mkCat("Paper — Sheet 1", "ورق ١", 10, [
    ["20+20+20+20", "1800/33", 80, ""],
    ["22+47+48+100", "1800/33", 217, ""],
    ["24+24+16+24+24+24", "1800/30", 136, ""],
    ["23+1+6+15+23+2", "1800/28", 70, "code partly illegible"],
    ["6+6+6+6+7+1+1+24+2+3", "1800/26", 62, ""],
    ["as written", "-", 79, "digits unclear — verify"],
    ["as written", "1800/27", 1, ""],
    ["1+8+6+7+1", "1800/21", 23, ""],
  ], "mat_paper"),
  mkCat("Clear Plastic", "بلاستيك شفاف", 5, [
    ["as written", "1000/33", 5, ""],
    ["as written", "880/33", 3, ""],
    ["as written", "1000/32", 4, ""],
    ["as written", "?/32", 4, "code hard to read"],
    ["as written", "?/32", 5, "code hard to read"],
  ], "mat_transparent"),
  mkCat("Plastic — Sheet 1", "بلاستيك ١", 5, [
    ["9+6+6+6+5+14+14+18+12", "1000/33", 90, ""],
    ["18+6+6+9", "990/33", 39, "boxed 120 on page"],
    ["4+2", "970/33", 6, ""],
    ["as written", "950/33", 6, "digits unclear"],
    ["as written", "940/33", 6, "digits unclear"],
    ["as written", "2000/33", 3, ""],
    ["شفاف (clear)", "1500/33", 1, ""],
    ["ورق (paper)", "1500/33", 1, ""],
    ["as written", "1000/32", 4, ""],
    ["6+3+2", "950/32", 11, ""],
    ["as written", "2000/30", 7, ""],
    ["as written", "2050/28", 3, ""],
    ["as written", "2000/28", 1, ""],
    ["as written", "1000/27", 2, ""],
    ["24+2+1", "1000/26", 27, ""],
    ["بلاستيك ابيض (white)", "1800/16", 2, ""],
    ["بلاستيك شفاف (clear)", "1800/16", 3, ""],
  ], "mat_plastic"),
  mkCat("FSC Coated Paper", "ورق FSC", 5, [
    ["142+1+3", "110x1000", 146, ""],
    ["as written", "110x950", 6, ""],
    ["as written", "110x800", 1, ""],
    ["as written", "1000/21", 3, "from separate note page"],
  ], "mat_paper"),
];

export { mkCat };
