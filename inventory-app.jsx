import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Minus, Trash2, Columns as ColumnsIcon, PlusCircle, FolderPlus, Save, Loader2,
  Search, ArrowUpDown, Download, Undo2, LayoutDashboard, AlertTriangle, X,
  MapPin, Tag, ChevronDown, Languages, HelpCircle, Sparkles, Eye, PackageMinus,
  ChevronLeft, ChevronRight, MoreVertical, Clock, Layers,
} from "lucide-react";

// ===========================================================================
// i18n
// ===========================================================================
const STR = {
  en: {
    appTitle: "Stock Ledger",
    appSubtitle: "Your warehouse inventory database",
    searchPlaceholder: "Search item, code, e.g. \"26\"...",
    noMatches: "No matches",
    dashboardTab: "Dashboard",
    addSheet: "New Sheet",
    undo: "Undo",
    saving: "Saving...",
    saved: "Saved",
    help: "Help",
    totalUnits: "Total Units",
    sheets: "Sheets",
    lowStock: "Low Stock",
    byLocation: "By Location",
    addLocation: "Add Location",
    items: "items",
    units: "units",
    lowStockAlerts: "Low Stock Alerts",
    noLowStock: "No low-stock items right now — everything looks healthy.",
    sheetTotals: "Totals by Sheet",
    sheet: "Sheet",
    itemCount: "Items",
    total: "Total",
    location: "Location",
    filterSheet: "Filter this sheet...",
    allLocations: "All locations",
    exportCSV: "Export CSV",
    newColumn: "New Column",
    newItem: "New Item",
    deleteSheet: "Delete Sheet",
    noResultsRow: "No rows match your search / filter",
    grandTotal: "Grand Total",
    editThreshold: "click to edit",
    alertBelow: "Alert when quantity drops to:",
    autosaveFooter: "Every change here is saved automatically to this device.",
    loading: "Loading...",
    cancel: "Cancel",
    add: "Add",
    save: "Save",
    delete: "Delete",
    confirm: "Confirm",
    addColumnTitle: "Add a New Column",
    columnNameEn: "Column name (English)",
    columnNameAr: "Column name (Arabic)",
    columnType: "Column type",
    typeText: "Text",
    typeNumber: "Number",
    addLocationTitle: "Add a New Location",
    locationNameEn: "Location name (English)",
    locationNameAr: "Location name (Arabic)",
    addSheetTitle: "Add a New Sheet",
    sheetNameEn: "Sheet name (English)",
    sheetNameAr: "Sheet name (Arabic)",
    thresholdTitle: "Low Stock Alert Threshold",
    thresholdLabel: "Alert me when quantity falls to or below:",
    confirmDeleteRowTitle: "Delete this item?",
    confirmDeleteRowBody: "This removes the row permanently from this sheet.",
    confirmDeleteSheetTitle: "Delete this whole sheet?",
    confirmDeleteSheetBody: "This removes the sheet and every item in it. Use Undo right after if you change your mind.",
    helpTitle: "How this works",
    helpSearch: "Search: type any item, code, or note — it checks every sheet, filter by material type or location, then click a result to open its details.",
    helpQty: "Quantity: use + / − to add or remove one unit, or type a number directly. Totals update instantly.",
    helpLocation: "Location: every item has a colored location tag — click it, or open item details, to move it elsewhere.",
    helpLowStock: "Low stock: items at or below a sheet's threshold turn red and show up in the Dashboard with full detail.",
    helpCheckout: "Taking stock out: open an item's details and use \"Take Out of Stock\" to remove exactly how many units were taken — it's logged in Recent Activity.",
    helpAdd: "Add / edit: use New Item, New Column or New Sheet any time — nothing here is fixed.",
    close: "Close",
    toastItemAdded: "Item added",
    toastColumnAdded: "Column added",
    toastSheetAdded: "Sheet added",
    toastLocationAdded: "Location added",
    toastUndone: "Undone",
    toastNothingToUndo: "Nothing to undo",
    langToggle: "العربية",
    unassigned: "Unassigned",
    // material types
    materialType: "Material",
    allTypes: "All materials",
    filterByType: "Material",
    // item detail / checkout
    viewDetails: "Details",
    itemDetails: "Item Details",
    availableQty: "Available now",
    takeOutTitle: "Take Out of Stock",
    quantityToTake: "Quantity taken",
    optionalNote: "Note (optional, e.g. who took it)",
    confirmTakeout: "Confirm Take-Out",
    goToItem: "Go to this item in its sheet",
    recentActivity: "Recent Activity — Stock Taken Out",
    noActivity: "No stock has been taken out yet.",
    remainingLabel: "left after this",
    toastTakenOut: "Removed from stock",
    // low stock detail
    deficitLabel: "Below threshold by",
    severity: "Status",
    critical: "Critical",
    lowSeverity: "Low",
    outOfStock: "Out of stock",
    lastUpdated: "Updated",
    unknownTime: "no changes yet",
    justNow: "just now",
    // pagination
    page: "Page",
    of: "of",
    rowsPerPage: "Rows per page:",
    showingRange: "Showing",
    prev: "Prev",
    next: "Next",
    moreActions: "More",
    minsAgo: "m ago",
    hoursAgo: "h ago",
    daysAgo: "d ago",
  },
  ar: {
    appTitle: "دفتر المخزون",
    appSubtitle: "قاعدة بيانات المخزون الخاصة بمحلكم",
    searchPlaceholder: "ابحث عن صنف أو كود، مثلاً \"26\"...",
    noMatches: "لا توجد نتائج",
    dashboardTab: "لوحة المتابعة",
    addSheet: "صفحة جديدة",
    undo: "تراجع",
    saving: "جارٍ الحفظ...",
    saved: "تم الحفظ",
    help: "مساعدة",
    totalUnits: "إجمالي الكمية",
    sheets: "الصفحات",
    lowStock: "منخفض المخزون",
    byLocation: "حسب المكان",
    addLocation: "إضافة مكان",
    items: "صنف",
    units: "وحدة",
    lowStockAlerts: "تنبيهات المخزون المنخفض",
    noLowStock: "لا توجد أصناف منخفضة حالياً — كل شيء تمام.",
    sheetTotals: "مجاميع الصفحات",
    sheet: "الصفحة",
    itemCount: "عدد الأصناف",
    total: "المجموع",
    location: "المكان",
    filterSheet: "بحث ضمن هذه الصفحة...",
    allLocations: "كل الأماكن",
    exportCSV: "تصدير CSV",
    newColumn: "عمود جديد",
    newItem: "صنف جديد",
    deleteSheet: "حذف الصفحة",
    noResultsRow: "لا توجد صفوف مطابقة للبحث / التصفية",
    grandTotal: "المجموع الكلي",
    editThreshold: "اضغط للتعديل",
    alertBelow: "نبّهني عندما تصل الكمية إلى:",
    autosaveFooter: "كل تغيير هنا يُحفظ تلقائياً على هذا الجهاز.",
    loading: "جارٍ التحميل...",
    cancel: "إلغاء",
    add: "إضافة",
    save: "حفظ",
    delete: "حذف",
    confirm: "تأكيد",
    addColumnTitle: "إضافة عمود جديد",
    columnNameEn: "اسم العمود (إنجليزي)",
    columnNameAr: "اسم العمود (عربي)",
    columnType: "نوع العمود",
    typeText: "نص",
    typeNumber: "رقم",
    addLocationTitle: "إضافة مكان جديد",
    locationNameEn: "اسم المكان (إنجليزي)",
    locationNameAr: "اسم المكان (عربي)",
    addSheetTitle: "إضافة صفحة جديدة",
    sheetNameEn: "اسم الصفحة (إنجليزي)",
    sheetNameAr: "اسم الصفحة (عربي)",
    thresholdTitle: "حد تنبيه المخزون المنخفض",
    thresholdLabel: "نبّهني عندما تنزل الكمية إلى أو تحت:",
    confirmDeleteRowTitle: "حذف هذا الصنف؟",
    confirmDeleteRowBody: "سيتم حذف هذا الصف نهائياً من هذه الصفحة.",
    confirmDeleteSheetTitle: "حذف هذه الصفحة بالكامل؟",
    confirmDeleteSheetBody: "سيتم حذف الصفحة وكل الأصناف فيها. استخدم زر التراجع فوراً إذا غيّرت رأيك.",
    helpTitle: "كيف تعمل التطبيق",
    helpSearch: "البحث: اكتب اسم أي صنف أو كود أو ملاحظة — يبحث في كل الصفحات، صفّي حسب المادة أو المكان، ثم اضغط على نتيجة لفتح تفاصيلها.",
    helpQty: "الكمية: استخدم + / − لإضافة أو سحب وحدة، أو اكتب الرقم مباشرة. المجموع يتحدّث فوراً.",
    helpLocation: "المكان: لكل صنف بطاقة مكان ملوّنة — اضغط عليها، أو افتح تفاصيل الصنف، لنقله لمكان آخر.",
    helpLowStock: "المخزون المنخفض: الأصناف التي تصل لحد الصفحة الأدنى تتحول للأحمر وتظهر بلوحة المتابعة بكل التفاصيل.",
    helpCheckout: "سحب من المخزون: افتح تفاصيل الصنف واستخدم «سحب من المخزون» لإزالة العدد المضبوط الذي أُخذ — يُسجَّل في النشاط الأخير.",
    helpAdd: "الإضافة / التعديل: استخدم «صنف جديد» أو «عمود جديد» أو «صفحة جديدة» في أي وقت — لا شيء هنا ثابت.",
    close: "إغلاق",
    toastItemAdded: "تمت إضافة الصنف",
    toastColumnAdded: "تمت إضافة العمود",
    toastSheetAdded: "تمت إضافة الصفحة",
    toastLocationAdded: "تمت إضافة المكان",
    toastUndone: "تم التراجع",
    toastNothingToUndo: "لا يوجد ما يُراجَع",
    langToggle: "English",
    unassigned: "غير محدد",
    materialType: "المادة",
    allTypes: "كل المواد",
    filterByType: "المادة",
    viewDetails: "التفاصيل",
    itemDetails: "تفاصيل الصنف",
    availableQty: "المتوفر الآن",
    takeOutTitle: "سحب من المخزون",
    quantityToTake: "الكمية المسحوبة",
    optionalNote: "ملاحظة (اختياري، مثلاً مين أخذها)",
    confirmTakeout: "تأكيد السحب",
    goToItem: "اذهب لهذا الصنف في صفحته",
    recentActivity: "النشاط الأخير — سحب من المخزون",
    noActivity: "لم يتم سحب أي شيء من المخزون بعد.",
    remainingLabel: "متبقي بعد هذا",
    toastTakenOut: "تم السحب من المخزون",
    deficitLabel: "أقل من الحد بمقدار",
    severity: "الحالة",
    critical: "حرج",
    lowSeverity: "منخفض",
    outOfStock: "نفدت الكمية",
    lastUpdated: "آخر تحديث",
    unknownTime: "لا تغييرات بعد",
    justNow: "الآن",
    page: "صفحة",
    of: "من",
    rowsPerPage: "صفوف لكل صفحة:",
    showingRange: "عرض",
    prev: "السابق",
    next: "التالي",
    moreActions: "المزيد",
    minsAgo: "د مضت",
    hoursAgo: "س مضت",
    daysAgo: "يوم مضى",
  },
};

const nameOf = (obj, lang) => (obj ? obj[lang] || obj.en || obj.ar : "");

function timeAgo(ts, t) {
  if (!ts) return t.unknownTime;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return `${mins}${t.minsAgo}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t.hoursAgo}`;
  const days = Math.floor(hrs / 24);
  return `${days}${t.daysAgo}`;
}

// ===========================================================================
// Locations & material types
// ===========================================================================
const DEFAULT_LOCATIONS = [
  { id: "loc_warehouse", name: { en: "Warehouse", ar: "المخزن" }, color: "#2e7d46" },
  { id: "loc_aisle", name: { en: "Aisle / Corridor", ar: "الممر" }, color: "#8a5a2e" },
  { id: "loc_aisle_projects", name: { en: "Aisle Projects", ar: "مشاريع عند الممر" }, color: "#6b4fa0" },
  { id: "loc_entrance", name: { en: "Entrance", ar: "المدخل" }, color: "#1f6f8b" },
  { id: "loc_unassigned", name: { en: "Unassigned", ar: "غير محدد" }, color: "#8a8a8a" },
];

const MATERIAL_TYPES = [
  { id: "mat_paper", name: { en: "Paper", ar: "ورق" }, color: "#a8842e" },
  { id: "mat_plastic", name: { en: "Plastic", ar: "بلاستيك" }, color: "#4a7c8c" },
  { id: "mat_transparent", name: { en: "Transparent", ar: "شفاف" }, color: "#6b9ac4" },
  { id: "mat_silver", name: { en: "Silver", ar: "فضي" }, color: "#8a8a8a" },
  { id: "mat_unassigned", name: { en: "Unassigned", ar: "غير محدد" }, color: "#b5b5b5" },
];

const DEFAULT_COLUMNS = () => [
  { key: "desc", label: { en: "Description", ar: "الوصف" }, type: "text" },
  { key: "ref", label: { en: "Reference Code", ar: "الكود" }, type: "text" },
  { key: "qty", label: { en: "Quantity", ar: "الكمية" }, type: "number" },
  { key: "notes", label: { en: "Notes", ar: "ملاحظات" }, type: "text" },
];

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

const seedCategories = () => [
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

function cat() { return "c_" + Math.random().toString(36).slice(2, 10); }
function rid() { return "r_" + Math.random().toString(36).slice(2, 10); }
function row(values) { return { id: rid(), values }; }

const STORAGE_KEY = "stock-ledger-v5";
const STORAGE_KEY_LANG = "stock-ledger-lang";
const MAX_HISTORY = 30;
const MAX_LOG = 200;

function toCSV(category, locations, lang) {
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

function downloadText(filename, text) {
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

// ===========================================================================
// Main component
// ===========================================================================
export default function InventoryApp() {
  const [categories, setCategories] = useState(null);
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [checkoutLog, setCheckoutLog] = useState([]);
  const [lang, setLang] = useState("en");
  const [activeCat, setActiveCat] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [locFilter, setLocFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [toast, setToast] = useState(null);
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalOpen, setGlobalOpen] = useState(false);
  const [globalTypeFilter, setGlobalTypeFilter] = useState("all");
  const [flashRow, setFlashRow] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [lowStockPageSize, setLowStockPageSize] = useState(5);
  const saveTimer = useRef(null);
  const history = useRef([]);
  const globalBoxRef = useRef(null);

  const t = STR[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setCategories(parsed.categories || parsed);
          setLocations(parsed.locations || DEFAULT_LOCATIONS);
          setCheckoutLog(parsed.checkoutLog || []);
        } else {
          setCategories(seedCategories());
          setLocations(DEFAULT_LOCATIONS);
        }
      } catch (e) {
        setCategories(seedCategories());
        setLocations(DEFAULT_LOCATIONS);
      }
      try {
        const langRes = await window.storage.get(STORAGE_KEY_LANG, false);
        if (langRes && langRes.value) setLang(langRes.value);
      } catch (e) {}
      setActiveCat("__dashboard__");
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback((data) => {
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await window.storage.set(STORAGE_KEY, JSON.stringify(data), false); } catch (e) {}
      setSaving(false);
    }, 450);
  }, []);

  useEffect(() => { if (loaded && categories) persist({ categories, locations, checkoutLog }); }, [categories, locations, checkoutLog, loaded, persist]);
  useEffect(() => { if (loaded) window.storage.set(STORAGE_KEY_LANG, lang, false).catch(() => {}); }, [lang, loaded]);
  useEffect(() => { setPage(1); }, [activeCat, query, locFilter, typeFilter, sortKey]);

  useEffect(() => {
    const onClick = (e) => { if (globalBoxRef.current && !globalBoxRef.current.contains(e.target)) setGlobalOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const withHistory = (updater) => {
    setCategories((prev) => {
      history.current.push(JSON.stringify(prev));
      if (history.current.length > MAX_HISTORY) history.current.shift();
      return updater(prev);
    });
  };

  const undo = () => {
    if (history.current.length === 0) { showToast(t.toastNothingToUndo); return; }
    setCategories(JSON.parse(history.current.pop()));
    showToast(t.toastUndone);
  };

  if (!loaded || !categories) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f2ec]">
        <div className="flex items-center gap-2 text-[#2f3b2f]">
          <Loader2 className="animate-spin" size={20} />
          <span>{STR.en.loading} / {STR.ar.loading}</span>
        </div>
      </div>
    );
  }

  const isDashboard = activeCat === "__dashboard__";
  const current = isDashboard ? null : categories.find((c) => c.id === activeCat) || categories[0];
  const locOf = (id) => locations.find((l) => l.id === id) || locations[locations.length - 1];
  const typeOf = (id) => MATERIAL_TYPES.find((m) => m.id === id) || MATERIAL_TYPES[MATERIAL_TYPES.length - 1];

  const updateCategory = (catId, updater) => withHistory((prev) => prev.map((c) => (c.id === catId ? updater(c) : c)));

  const changeCell = (catId, rowId, key, value) => {
    updateCategory(catId, (c) => ({
      ...c,
      rows: c.rows.map((r) => (r.id === rowId ? { ...r, values: { ...r.values, [key]: value, ...(key === "qty" ? { lastUpdated: Date.now() } : {}) } } : r)),
    }));
  };

  const bumpQty = (catId, rowId, delta) => {
    updateCategory(catId, (c) => ({
      ...c,
      rows: c.rows.map((r) => {
        if (r.id !== rowId) return r;
        const next = Math.max(0, (Number(r.values.qty) || 0) + delta);
        return { ...r, values: { ...r.values, qty: next, lastUpdated: Date.now() } };
      }),
    }));
  };

  const addRow = (catId) => {
    updateCategory(catId, (c) => {
      const blank = { location: "loc_unassigned", type: "mat_unassigned", lastUpdated: null };
      c.columns.forEach((col) => (blank[col.key] = col.type === "number" ? 0 : ""));
      return { ...c, rows: [...c.rows, row(blank)] };
    });
    showToast(t.toastItemAdded);
  };

  const deleteRowNow = (catId, rowId) => updateCategory(catId, (c) => ({ ...c, rows: c.rows.filter((r) => r.id !== rowId) }));

  const deleteColumn = (catId, colKey) => {
    updateCategory(catId, (c) => ({
      ...c,
      columns: c.columns.filter((col) => col.key !== colKey),
      rows: c.rows.map((r) => { const nv = { ...r.values }; delete nv[colKey]; return { ...r, values: nv }; }),
    }));
  };

  const deleteCategoryNow = (catId) => {
    withHistory((prev) => prev.filter((c) => c.id !== catId));
    setActiveCat("__dashboard__");
  };

  const jumpToResult = (catId, rowId) => {
    setActiveCat(catId);
    setGlobalOpen(false);
    setGlobalQuery("");
    setFlashRow(rowId);
    setTimeout(() => {
      const el = document.getElementById(`row-${rowId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    setTimeout(() => setFlashRow(null), 2400);
  };

  const openDetail = (catId, rowId) => setModal({ kind: "itemDetail", catId, rowId });

  const takeOutStock = (catId, rowId, amount, note) => {
    const c = categories.find((cc) => cc.id === catId);
    const r = c?.rows.find((rr) => rr.id === rowId);
    if (!c || !r) return;
    const avail = Number(r.values.qty) || 0;
    const take = Math.max(1, Math.min(amount, avail));
    const remaining = avail - take;
    updateCategory(catId, (cc) => ({
      ...cc,
      rows: cc.rows.map((rr) => rr.id === rowId ? { ...rr, values: { ...rr.values, qty: remaining, lastUpdated: Date.now() } } : rr),
    }));
    setCheckoutLog((prev) => [
      { id: rid(), ts: Date.now(), catId, catName: nameOf(c.name, lang), rowId, desc: r.values.desc, ref: r.values.ref, qtyTaken: take, remainingQty: remaining, note: note || "" },
      ...prev,
    ].slice(0, MAX_LOG));
    showToast(`${t.toastTakenOut}: ${take}`);
  };

  // ---- global search ----
  let globalResults = [];
  if (globalQuery.trim()) {
    const q = globalQuery.trim().toLowerCase();
    categories.forEach((c) => {
      c.rows.forEach((r) => {
        const hay = c.columns.map((col) => String(r.values[col.key] ?? "")).join(" ").toLowerCase();
        if (hay.includes(q)) globalResults.push({ catId: c.id, catName: nameOf(c.name, lang), row: r, location: locOf(r.values.location), material: typeOf(r.values.type) });
      });
    });
    if (globalTypeFilter !== "all") globalResults = globalResults.filter((res) => res.row.values.type === globalTypeFilter);
  }

  const shellProps = {
    t, lang, setLang, title: t.appTitle, subtitle: t.appSubtitle, saving, categories, activeCat, setActiveCat,
    addCategory: () => setModal({ kind: "addSheet" }), undo, toast, dir,
    globalQuery, setGlobalQuery, globalOpen, setGlobalOpen, globalResults, globalBoxRef, jumpToResult, openDetail,
    globalTypeFilter, setGlobalTypeFilter, helpOpen, setHelpOpen,
  };

  const modalHostProps = {
    modal, setModal, t, lang, categories, locations, setLocations, withHistory, setActiveCat, showToast,
    deleteRowNow, deleteCategoryNow, updateCategory, changeCell, bumpQty, takeOutStock, jumpToResult, typeOf, locOf,
  };

  // ============================= Dashboard =============================
  if (isDashboard) {
    const grand = categories.reduce((s, c) => s + c.rows.reduce((rs, r) => rs + (Number(r.values.qty) || 0), 0), 0);
    const lowStockItems = [];
    categories.forEach((c) => c.rows.forEach((r) => {
      const q = Number(r.values.qty) || 0;
      const thresh = c.lowStockAt ?? 5;
      if (q <= thresh) {
        const deficit = Math.max(0, thresh - q);
        const severity = q === 0 ? "out" : q <= thresh / 2 ? "critical" : "low";
        lowStockItems.push({ cat: nameOf(c.name, lang), catId: c.id, rowId: r.id, desc: r.values.desc, ref: r.values.ref, qty: q, thresh, deficit, severity, location: locOf(r.values.location), material: typeOf(r.values.type), lastUpdated: r.values.lastUpdated });
      }
    }));
    lowStockItems.sort((a, b) => a.qty - b.qty);
    const lowStockTotalPages = Math.max(1, Math.ceil(lowStockItems.length / lowStockPageSize));
    const safeLowStockPage = Math.min(lowStockPage, lowStockTotalPages);
    const pagedLowStock = lowStockItems.slice((safeLowStockPage - 1) * lowStockPageSize, safeLowStockPage * lowStockPageSize);
    const lowStockRangeStart = lowStockItems.length === 0 ? 0 : (safeLowStockPage - 1) * lowStockPageSize + 1;
    const lowStockRangeEnd = Math.min(lowStockItems.length, safeLowStockPage * lowStockPageSize);
    const byLocation = locations.map((loc) => {
      let count = 0, qty = 0;
      categories.forEach((c) => c.rows.forEach((r) => { if (r.values.location === loc.id) { count++; qty += Number(r.values.qty) || 0; } }));
      return { ...loc, count, qty };
    });

    return (
      <Shell {...shellProps}>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <StatCard label={t.totalUnits} value={grand} accent="#8a5a2e" />
          <StatCard label={t.sheets} value={categories.length} accent="#4a6b52" />
          <StatCard label={t.lowStock} value={lowStockItems.length} accent={lowStockItems.length ? "#b23b3b" : "#4a6b52"} />
        </div>

        <Panel icon={<MapPin size={16} className="text-[#4a6b52]" />} title={t.byLocation}>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 p-4">
            {byLocation.map((loc) => (
              <div key={loc.id} className="rounded-lg border p-3 flex items-center justify-between" style={{ borderColor: loc.color + "40", background: loc.color + "0d" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: loc.color }} />
                  <span className="text-sm font-semibold">{nameOf(loc.name, lang)}</span>
                </div>
                <div className="text-xs text-[#5c6b57]">{loc.count} {t.items} · {loc.qty} {t.units}</div>
              </div>
            ))}
            <button onClick={() => setModal({ kind: "addLocation" })} className="rounded-lg border border-dashed border-[#2f3b2f]/25 p-3 text-sm text-[#5c6b57] hover:bg-[#f4f2ec] flex items-center justify-center gap-1.5">
              <Plus size={14} /> {t.addLocation}
            </button>
          </div>
        </Panel>

        <Panel icon={<AlertTriangle size={16} className="text-[#b23b3b]" />} title={`${t.lowStockAlerts} (${lowStockItems.length})`}>
          {lowStockItems.length === 0 ? (
            <p className="p-5 text-sm text-[#5c6b57]">{t.noLowStock}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f4f2ec] text-[#5c6b57]">
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.sheet}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "الصنف" : "Item"}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.materialType}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.location}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "الكمية" : "Qty"}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.deficitLabel}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.severity}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.lastUpdated}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLowStock.map((it, i) => (
                    <tr key={i} className="border-t border-[#2f3b2f]/10 hover:bg-[#f4f2ec]/50">
                      <td className="px-4 py-2"><button onClick={() => openDetail(it.catId, it.rowId)} className="text-[#8a5a2e] hover:underline">{it.cat}</button></td>
                      <td className="px-4 py-2">{it.desc || "—"}</td>
                      <td className="px-4 py-2"><TypeBadge type={it.material} lang={lang} /></td>
                      <td className="px-4 py-2"><LocationBadge loc={it.location} lang={lang} /></td>
                      <td className="px-4 py-2 font-bold text-[#b23b3b]">{it.qty} / {it.thresh}</td>
                      <td className="px-4 py-2">{it.deficit}</td>
                      <td className="px-4 py-2">
                        {it.severity === "out" && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">{t.outOfStock}</span>}
                        {it.severity === "critical" && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{t.critical}</span>}
                        {it.severity === "low" && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{t.lowSeverity}</span>}
                      </td>
                      <td className="px-4 py-2 text-xs text-[#5c6b57] flex items-center gap-1"><Clock size={11} /> {timeAgo(it.lastUpdated, t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {lowStockItems.length > 0 && (
            <Pagination t={t} lang={lang} page={safeLowStockPage} totalPages={lowStockTotalPages} setPage={setLowStockPage}
              pageSize={lowStockPageSize} setPageSize={setLowStockPageSize} rangeStart={lowStockRangeStart} rangeEnd={lowStockRangeEnd} totalRows={lowStockItems.length} />
          )}
        </Panel>

        <Panel icon={<PackageMinus size={16} className="text-[#6b4fa0]" />} title={t.recentActivity}>
          {checkoutLog.length === 0 ? (
            <p className="p-5 text-sm text-[#5c6b57]">{t.noActivity}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f4f2ec] text-[#5c6b57]">
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "الصنف" : "Item"}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.sheet}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "الكمية المسحوبة" : "Taken"}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.remainingLabel}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.lastUpdated}</th>
                </tr>
              </thead>
              <tbody>
                {checkoutLog.slice(0, 8).map((entry) => (
                  <tr key={entry.id} className="border-t border-[#2f3b2f]/10 hover:bg-[#f4f2ec]/50">
                    <td className="px-4 py-2"><button onClick={() => openDetail(entry.catId, entry.rowId)} className="text-[#8a5a2e] hover:underline">{entry.desc || entry.ref || "—"}</button></td>
                    <td className="px-4 py-2 text-[#5c6b57]">{entry.catName}</td>
                    <td className="px-4 py-2 font-bold text-[#b23b3b]">−{entry.qtyTaken}</td>
                    <td className="px-4 py-2">{entry.remainingQty}</td>
                    <td className="px-4 py-2 text-xs text-[#5c6b57] flex items-center gap-1"><Clock size={11} /> {timeAgo(entry.ts, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title={t.sheetTotals}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f4f2ec] text-[#5c6b57]">
                <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.sheet}</th>
                <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.itemCount}</th>
                <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.total}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-[#2f3b2f]/10 hover:bg-[#f4f2ec]/60">
                  <td className="px-4 py-2"><button onClick={() => setActiveCat(c.id)} className="text-[#8a5a2e] hover:underline font-semibold">{nameOf(c.name, lang)}</button></td>
                  <td className="px-4 py-2">{c.rows.length}</td>
                  <td className="px-4 py-2 font-bold">{c.rows.reduce((s, r) => s + (Number(r.values.qty) || 0), 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <ModalHost {...modalHostProps} />
      </Shell>
    );
  }

  // ============================= Sheet view =============================
  let visibleRows = current.rows.filter((r) => {
    const matchesQuery = !query.trim() || current.columns.some((col) => String(r.values[col.key] ?? "").toLowerCase().includes(query.trim().toLowerCase()));
    const matchesLoc = locFilter === "all" || r.values.location === locFilter;
    const matchesType = typeFilter === "all" || r.values.type === typeFilter;
    return matchesQuery && matchesLoc && matchesType;
  });
  if (sortKey) {
    const col = current.columns.find((c) => c.key === sortKey);
    visibleRows = [...visibleRows].sort((a, b) => {
      const av = a.values[sortKey], bv = b.values[sortKey];
      if (col?.type === "number") return (Number(av) - Number(bv)) * sortDir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * sortDir;
    });
  }
  const total = current.rows.reduce((sum, r) => sum + (Number(r.values.qty) || 0), 0);
  const lowCount = current.rows.filter((r) => (Number(r.values.qty) || 0) <= (current.lowStockAt ?? 5)).length;
  const toggleSort = (key) => { if (sortKey === key) setSortDir((d) => -d); else { setSortKey(key); setSortDir(1); } };
  const qtyColIndex = current.columns.findIndex((c) => c.key === "qty");

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = visibleRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(visibleRows.length, safePage * pageSize);

  return (
    <Shell {...shellProps}>
      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <StatCard label={t.totalUnits} value={total} accent="#8a5a2e" />
        <StatCard label={t.itemCount} value={current.rows.length} accent="#4a6b52" />
        <StatCard label={t.lowStock} value={lowCount} accent={lowCount ? "#b23b3b" : "#4a6b52"}
          onClick={() => setModal({ kind: "threshold", catId: current.id, value: current.lowStockAt ?? 5 })}
          hint={`${current.lowStockAt ?? 5} · ${t.editThreshold}`} />
      </div>

      <div className="bg-[#fbfaf5] rounded-lg shadow-sm border border-[#2f3b2f]/10 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2f3b2f]/10 bg-[#f4f2ec] flex-wrap gap-3">
          <h2 className="font-bold text-lg">{nameOf(current.name, lang)}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-[#5c6b57] ${lang === "ar" ? "right-2.5" : "left-2.5"}`} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.filterSheet}
                className={`text-xs px-2 py-1.5 rounded border border-[#2f3b2f]/20 bg-white w-36 outline-none ${lang === "ar" ? "pr-7" : "pl-7"}`} />
              {query && <button onClick={() => setQuery("")} className={`absolute top-1/2 -translate-y-1/2 text-[#5c6b57] ${lang === "ar" ? "left-1.5" : "right-1.5"}`}><X size={12} /></button>}
            </div>
            <select value={locFilter} onChange={(e) => setLocFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded border border-[#2f3b2f]/20 bg-white outline-none">
              <option value="all">{t.allLocations}</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{nameOf(l.name, lang)}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded border border-[#2f3b2f]/20 bg-white outline-none">
              <option value="all">{t.allTypes}</option>
              {MATERIAL_TYPES.map((m) => <option key={m.id} value={m.id}>{nameOf(m.name, lang)}</option>)}
            </select>
            <button onClick={() => addRow(current.id)} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded font-semibold" style={{ backgroundColor: "#8a5a2e", color: "#ffffff" }}>
              <PlusCircle size={14} /> {t.newItem}
            </button>
            <OverflowMenu t={t} lang={lang}
              onExport={() => downloadText(`${nameOf(current.name, lang)}.csv`, toCSV(current, locations, lang))}
              onAddColumn={() => setModal({ kind: "addColumn", catId: current.id })}
              onDeleteSheet={categories.length > 1 ? () => setModal({ kind: "confirmDeleteSheet", catId: current.id }) : null} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#eee9dc] text-[#2f3b2f]">
                <th className={`px-3 py-2 font-semibold w-10 ${lang === "ar" ? "text-right" : "text-left"}`}>#</th>
                <th className={`px-3 py-2 font-semibold whitespace-nowrap ${lang === "ar" ? "text-right" : "text-left"}`}><span className="flex items-center gap-1"><MapPin size={12} /> {t.location}</span></th>
                {current.columns.map((col) => (
                  <th key={col.key} className={`px-3 py-2 font-semibold whitespace-nowrap ${lang === "ar" ? "text-right" : "text-left"}`}>
                    <div className="flex items-center gap-1 justify-between">
                      <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-[#8a5a2e]">
                        <span>{nameOf(col.label, lang)}</span>
                        <ArrowUpDown size={11} className={sortKey === col.key ? "opacity-100" : "opacity-30"} />
                      </button>
                      {col.key !== "qty" && col.key !== "desc" && (
                        <button onClick={() => deleteColumn(current.id, col.key)} className="opacity-40 hover:opacity-100 hover:text-red-600"><Trash2 size={12} /></button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 && (
                <tr><td colSpan={current.columns.length + 3} className="px-4 py-8 text-center text-[#5c6b57]">{t.noResultsRow}</td></tr>
              )}
              {pagedRows.map((r, i) => {
                const q = Number(r.values.qty) || 0;
                const isLow = q <= (current.lowStockAt ?? 5);
                const isFlashed = flashRow === r.id;
                return (
                  <tr id={`row-${r.id}`} key={r.id}
                      className={`border-t border-[#2f3b2f]/10 transition-colors duration-700 ${isFlashed ? "row-flash" : isLow ? "bg-red-50/40" : "hover:bg-[#f4f2ec]/60"}`}>
                    <td className="px-3 py-2 text-[#8a5a2e] font-semibold">{(safePage - 1) * pageSize + i + 1}</td>
                    <td className="px-3 py-1.5"><LocationSelect value={r.values.location} locations={locations} lang={lang} onChange={(v) => changeCell(current.id, r.id, "location", v)} /></td>
                    {current.columns.map((col) => (
                      <td key={col.key} className="px-3 py-1.5">
                        {col.key === "qty" ? (
                          <div className="flex items-center gap-1.5 justify-center">
                            <button onClick={() => bumpQty(current.id, r.id, -1)} title={lang === "ar" ? "سحب وحدة" : "Remove one unit"} className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"><Minus size={12} /></button>
                            <input type="number" value={r.values.qty ?? 0} onChange={(e) => changeCell(current.id, r.id, "qty", Number(e.target.value))}
                              className={`w-16 text-center bg-transparent border rounded px-1 py-1 font-bold ${isLow ? "border-red-300 text-red-700" : "border-[#2f3b2f]/15"}`} />
                            <button onClick={() => bumpQty(current.id, r.id, 1)} title={lang === "ar" ? "إضافة وحدة" : "Add one unit"} className="w-6 h-6 flex items-center justify-center rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"><Plus size={12} /></button>
                          </div>
                        ) : (
                          <input type="text" value={r.values[col.key] ?? ""} onChange={(e) => changeCell(current.id, r.id, col.key, e.target.value)}
                            className="w-full bg-transparent border border-transparent focus:border-[#2f3b2f]/20 rounded px-2 py-1" />
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 justify-center">
                        <button onClick={() => openDetail(current.id, r.id)} title={t.viewDetails} className="text-[#5c6b57] hover:text-[#1f6f8b]"><Eye size={15} /></button>
                        <button onClick={() => setModal({ kind: "confirmDeleteRow", catId: current.id, rowId: r.id })} title={t.delete} className="text-[#5c6b57] hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#2f3b2f]/20 bg-[#eee9dc] font-bold">
                <td className="px-3 py-2" colSpan={2 + qtyColIndex + 1}>{t.grandTotal} ({t.itemCount.toLowerCase()}: {current.rows.length})</td>
                <td className="px-3 py-2 text-center text-lg text-[#8a5a2e]">{total}</td>
                <td colSpan={current.columns.length - qtyColIndex}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <Pagination t={t} lang={lang} page={safePage} totalPages={totalPages} setPage={setPage}
          pageSize={pageSize} setPageSize={setPageSize} rangeStart={rangeStart} rangeEnd={rangeEnd} totalRows={visibleRows.length} />
      </div>

      <ModalHost {...modalHostProps} />
    </Shell>
  );
}

// ===========================================================================
// Pagination
// ===========================================================================
function Pagination({ t, lang, page, totalPages, setPage, pageSize, setPageSize, rangeStart, rangeEnd, totalRows }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#2f3b2f]/10 bg-[#f4f2ec] flex-wrap gap-3 text-xs text-[#5c6b57]">
      <div className="flex items-center gap-2">
        <span>{t.rowsPerPage}</span>
        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="px-2 py-1 rounded border border-[#2f3b2f]/20 bg-white outline-none">
          {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>{t.showingRange} {rangeStart}–{rangeEnd} {t.of} {totalRows}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
          className="w-7 h-7 flex items-center justify-center rounded border border-[#2f3b2f]/20 bg-white disabled:opacity-30 hover:bg-[#eee9dc]">
          {lang === "ar" ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <span className="px-2 font-semibold">{t.page} {page} {t.of} {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded border border-[#2f3b2f]/20 bg-white disabled:opacity-30 hover:bg-[#eee9dc]">
          {lang === "ar" ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Overflow menu (declutters the toolbar)
// ===========================================================================
function OverflowMenu({ t, lang, onExport, onAddColumn, onDeleteSheet }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#2f3b2f]/20 hover:bg-[#eee9dc]">
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className={`absolute mt-1 ${lang === "ar" ? "left-0" : "right-0"} bg-white rounded-lg shadow-lg border border-[#2f3b2f]/15 py-1 w-44 z-40`}>
          <button onClick={() => { onExport(); setOpen(false); }} className="w-full text-start px-3 py-2 text-xs hover:bg-[#f4f2ec] flex items-center gap-2"><Download size={13} /> {t.exportCSV}</button>
          <button onClick={() => { onAddColumn(); setOpen(false); }} className="w-full text-start px-3 py-2 text-xs hover:bg-[#f4f2ec] flex items-center gap-2"><ColumnsIcon size={13} /> {t.newColumn}</button>
          {onDeleteSheet && <button onClick={() => { onDeleteSheet(); setOpen(false); }} className="w-full text-start px-3 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={13} /> {t.deleteSheet}</button>}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Modal host
// ===========================================================================
function ModalHost({ modal, setModal, t, lang, categories, locations, setLocations, withHistory, setActiveCat, showToast,
  deleteRowNow, deleteCategoryNow, updateCategory, changeCell, bumpQty, takeOutStock, jumpToResult, typeOf, locOf }) {
  const [f1, setF1] = useState("");
  const [f2, setF2] = useState("");
  const [colType, setColType] = useState("text");
  const [numVal, setNumVal] = useState(0);
  const [takeAmt, setTakeAmt] = useState(1);
  const [takeNote, setTakeNote] = useState("");

  useEffect(() => {
    if (!modal) return;
    setF1(""); setF2(""); setColType("text"); setTakeNote("");
    if (modal.kind === "threshold") setNumVal(modal.value ?? 5);
    if (modal.kind === "itemDetail") setTakeAmt(1);
  }, [modal]);

  if (!modal) return null;
  const close = () => setModal(null);

  const Wrap = ({ children, title, danger, wide }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className={`rounded-xl shadow-xl w-full ${wide ? "max-w-lg" : "max-w-sm"} border border-[#2f3b2f]/10 overflow-hidden max-h-[90vh] overflow-y-auto`} style={{ backgroundColor: "#fbfaf5" }}>
        <div className={`px-5 py-3.5 border-b border-[#2f3b2f]/10 sticky top-0 flex items-center justify-between`} style={{ backgroundColor: danger ? "#fef2f2" : "#f4f2ec", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", WebkitTransform: "translateZ(0)", transform: "translateZ(0)", willChange: "transform" }}>
          <h3 className="font-bold" style={{ color: danger ? "#b91c1c" : "#2f3b2f" }}>{title}</h3>
          <button onClick={close} style={{ color: "#5c6b57" }}><X size={16} /></button>
        </div>
        <div className="p-5" style={{ color: "#2f3b2f" }}>{children}</div>
      </div>
    </div>
  );

  const Field = ({ label, value, onChange, placeholder }) => (
    <div className="mb-3">
      <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{label}</label>
      <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#4a6b52]" />
    </div>
  );

  const Buttons = ({ onConfirm, confirmLabel, danger, disabled }) => (
    <div className="flex items-center gap-2 justify-end mt-4">
      <button onClick={close} className="px-3 py-1.5 text-sm rounded border" style={{ borderColor: "rgba(47,59,47,0.2)", color: "#2f3b2f" }}>{t.cancel}</button>
      <button onClick={onConfirm} disabled={disabled} className="px-3 py-1.5 text-sm rounded font-semibold"
        style={{ backgroundColor: disabled ? "#c9c9c9" : (danger ? "#dc2626" : "#8a5a2e"), color: "#ffffff", opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
        {confirmLabel}
      </button>
    </div>
  );

  if (modal.kind === "addColumn") {
    return (
      <Wrap title={t.addColumnTitle}>
        <Field label={t.columnNameEn} value={f1} onChange={setF1} placeholder="e.g. Supplier" />
        <Field label={t.columnNameAr} value={f2} onChange={setF2} placeholder="مثال: المورد" />
        <div className="mb-2">
          <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.columnType}</label>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1.5"><input type="radio" checked={colType === "text"} onChange={() => setColType("text")} /> {t.typeText}</label>
            <label className="flex items-center gap-1.5"><input type="radio" checked={colType === "number"} onChange={() => setColType("number")} /> {t.typeNumber}</label>
          </div>
        </div>
        <Buttons confirmLabel={t.add} disabled={!f1.trim() && !f2.trim()} onConfirm={() => {
          const key = "col_" + Math.random().toString(36).slice(2, 8);
          updateCategory(modal.catId, (c) => ({
            ...c,
            columns: [...c.columns, { key, label: { en: f1.trim() || f2.trim(), ar: f2.trim() || f1.trim() }, type: colType }],
            rows: c.rows.map((r) => ({ ...r, values: { ...r.values, [key]: colType === "number" ? 0 : "" } })),
          }));
          showToast(t.toastColumnAdded);
          close();
        }} />
      </Wrap>
    );
  }

  if (modal.kind === "addLocation") {
    return (
      <Wrap title={t.addLocationTitle}>
        <Field label={t.locationNameEn} value={f1} onChange={setF1} placeholder="e.g. Warehouse 2" />
        <Field label={t.locationNameAr} value={f2} onChange={setF2} placeholder="مثال: المخزن ٢" />
        <Buttons confirmLabel={t.add} disabled={!f1.trim() && !f2.trim()} onConfirm={() => {
          const palette = ["#2e7d46", "#8a5a2e", "#6b4fa0", "#1f6f8b", "#b23b3b", "#a8842e", "#4a7c8c"];
          setLocations((prev) => [...prev, { id: "loc_" + Math.random().toString(36).slice(2, 8), name: { en: f1.trim() || f2.trim(), ar: f2.trim() || f1.trim() }, color: palette[prev.length % palette.length] }]);
          showToast(t.toastLocationAdded);
          close();
        }} />
      </Wrap>
    );
  }

  if (modal.kind === "addSheet") {
    return (
      <Wrap title={t.addSheetTitle}>
        <Field label={t.sheetNameEn} value={f1} onChange={setF1} placeholder="e.g. Boxes" />
        <Field label={t.sheetNameAr} value={f2} onChange={setF2} placeholder="مثال: كراتين" />
        <Buttons confirmLabel={t.add} disabled={!f1.trim() && !f2.trim()} onConfirm={() => {
          const newCat = mkCat(f1.trim() || f2.trim(), f2.trim() || f1.trim(), 5, [["", "", 0, ""]], "mat_unassigned");
          withHistory((prev) => [...prev, newCat]);
          setActiveCat(newCat.id);
          showToast(t.toastSheetAdded);
          close();
        }} />
      </Wrap>
    );
  }

  if (modal.kind === "threshold") {
    return (
      <Wrap title={t.thresholdTitle}>
        <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.thresholdLabel}</label>
        <input autoFocus type="number" min={0} value={numVal} onChange={(e) => setNumVal(Number(e.target.value))}
          className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#4a6b52]" />
        <Buttons confirmLabel={t.save} onConfirm={() => { updateCategory(modal.catId, (c) => ({ ...c, lowStockAt: Math.max(0, numVal) })); close(); }} />
      </Wrap>
    );
  }

  if (modal.kind === "confirmDeleteRow") {
    return (
      <Wrap title={t.confirmDeleteRowTitle} danger>
        <p className="text-sm text-[#5c6b57]">{t.confirmDeleteRowBody}</p>
        <Buttons danger confirmLabel={t.delete} onConfirm={() => { deleteRowNow(modal.catId, modal.rowId); close(); }} />
      </Wrap>
    );
  }

  if (modal.kind === "confirmDeleteSheet") {
    return (
      <Wrap title={t.confirmDeleteSheetTitle} danger>
        <p className="text-sm text-[#5c6b57]">{t.confirmDeleteSheetBody}</p>
        <Buttons danger confirmLabel={t.delete} onConfirm={() => { deleteCategoryNow(modal.catId); close(); }} />
      </Wrap>
    );
  }

  if (modal.kind === "itemDetail") {
    const c = categories.find((cc) => cc.id === modal.catId);
    const r = c?.rows.find((rr) => rr.id === modal.rowId);
    if (!c || !r) return null;
    const qty = Number(r.values.qty) || 0;
    const isLow = qty <= (c.lowStockAt ?? 5);
    const clampedTake = Math.max(1, Math.min(takeAmt || 1, Math.max(1, qty)));

    return (
      <Wrap title={t.itemDetails} wide>
        <div className="mb-4">
          <div className="text-xs text-[#5c6b57] mb-1 flex items-center gap-1"><Tag size={11} /> {nameOf(c.name, lang)}</div>
          <div className="text-lg font-bold">{r.values.desc || r.values.ref || "—"}</div>
          {r.values.ref && <div className="text-xs text-[#5c6b57]">{lang === "ar" ? "الكود" : "Ref"}: {r.values.ref}</div>}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.location}</label>
            <LocationSelect value={r.values.location} locations={locations} lang={lang} onChange={(v) => changeCell(c.id, r.id, "location", v)} full />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.materialType}</label>
            <TypeSelect value={r.values.type} lang={lang} onChange={(v) => changeCell(c.id, r.id, "type", v)} />
          </div>
        </div>

        <div className={`rounded-lg border p-3 mb-4 flex items-center justify-between ${isLow ? "border-red-200 bg-red-50" : "border-[#2f3b2f]/10 bg-[#f4f2ec]"}`}>
          <div>
            <div className="text-xs text-[#5c6b57]">{t.availableQty}</div>
            <div className={`text-2xl font-bold ${isLow ? "text-red-700" : "text-[#2f3b2f]"}`}>{qty}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => bumpQty(c.id, r.id, -1)} className="w-8 h-8 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"><Minus size={14} /></button>
            <button onClick={() => bumpQty(c.id, r.id, 1)} className="w-8 h-8 flex items-center justify-center rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"><Plus size={14} /></button>
          </div>
        </div>

        <div className="text-xs text-[#5c6b57] mb-4 flex items-center gap-1"><Clock size={11} /> {t.lastUpdated}: {timeAgo(r.values.lastUpdated, t)}</div>

        <div className="rounded-lg border border-[#2f3b2f]/10 p-4 mb-2">
          <div className="font-bold text-sm mb-3 flex items-center gap-1.5"><PackageMinus size={15} className="text-[#6b4fa0]" /> {t.takeOutTitle}</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.quantityToTake}</label>
              <input type="number" min={1} max={Math.max(1, qty)} value={clampedTake} onChange={(e) => setTakeAmt(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#4a6b52]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.optionalNote}</label>
              <input value={takeNote} onChange={(e) => setTakeNote(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#4a6b52]" />
            </div>
          </div>
          <button disabled={qty <= 0} onClick={() => { takeOutStock(c.id, r.id, clampedTake, takeNote); close(); }}
            className="w-full py-2 rounded text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ backgroundColor: qty <= 0 ? "#c9c9c9" : "#6b4fa0", color: "#ffffff", opacity: qty <= 0 ? 0.6 : 1, cursor: qty <= 0 ? "not-allowed" : "pointer" }}>
            <PackageMinus size={15} /> {t.confirmTakeout}
          </button>
        </div>

        <button onClick={() => { jumpToResult(c.id, r.id); }} className="w-full mt-1 py-2 rounded border border-[#2f3b2f]/20 text-sm hover:bg-[#f4f2ec]">
          {t.goToItem}
        </button>
      </Wrap>
    );
  }

  return null;
}

// ===========================================================================
// Small pieces
// ===========================================================================
function Panel({ icon, title, children }) {
  return (
    <div className="bg-[#fbfaf5] rounded-lg shadow-sm border border-[#2f3b2f]/10 overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-[#2f3b2f]/10 bg-[#f4f2ec] flex items-center gap-2">
        {icon}<h2 className="font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function LocationBadge({ loc, lang }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: loc.color + "1a", color: loc.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: loc.color }} />
      {nameOf(loc.name, lang)}
    </span>
  );
}

function TypeBadge({ type, lang }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: type.color + "1a", color: type.color }}>
      <Layers size={10} />
      {nameOf(type.name, lang)}
    </span>
  );
}

function LocationSelect({ value, locations, lang, onChange, full }) {
  const loc = locations.find((l) => l.id === value) || locations[locations.length - 1];
  const rtl = lang === "ar";
  return (
    <div className="relative inline-block">
      <select value={value || "loc_unassigned"} onChange={(e) => onChange(e.target.value)}
        className={`appearance-none text-xs font-semibold ${rtl ? "pr-6 pl-2" : "pl-6 pr-2"} py-1 rounded-full border-0 cursor-pointer outline-none ${full ? "w-full" : ""}`}
        style={{ background: loc.color + "1a", color: loc.color }}>
        {locations.map((l) => <option key={l.id} value={l.id}>{nameOf(l.name, lang)}</option>)}
      </select>
      <ChevronDown size={10} className={`absolute ${rtl ? "right-1.5" : "left-1.5"} top-1/2 -translate-y-1/2 pointer-events-none`} style={{ color: loc.color }} />
    </div>
  );
}

function TypeSelect({ value, lang, onChange }) {
  const type = MATERIAL_TYPES.find((m) => m.id === value) || MATERIAL_TYPES[MATERIAL_TYPES.length - 1];
  const rtl = lang === "ar";
  return (
    <div className="relative inline-block w-full">
      <select value={value || "mat_unassigned"} onChange={(e) => onChange(e.target.value)}
        className={`appearance-none text-xs font-semibold ${rtl ? "pr-6 pl-2" : "pl-6 pr-2"} py-1 rounded-full border-0 cursor-pointer outline-none w-full`}
        style={{ background: type.color + "1a", color: type.color }}>
        {MATERIAL_TYPES.map((m) => <option key={m.id} value={m.id}>{nameOf(m.name, lang)}</option>)}
      </select>
      <ChevronDown size={10} className={`absolute ${rtl ? "right-1.5" : "left-1.5"} top-1/2 -translate-y-1/2 pointer-events-none`} style={{ color: type.color }} />
    </div>
  );
}

function StatCard({ label, value, accent, onClick, hint }) {
  return (
    <div onClick={onClick} className={`bg-[#fbfaf5] rounded-lg border border-[#2f3b2f]/10 px-5 py-4 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}>
      <div className="text-xs text-[#5c6b57] mb-1">{label}</div>
      <div className="text-3xl font-bold" style={{ color: accent }}>{value}</div>
      {hint && <div className="text-[10px] text-[#5c6b57] mt-1">{hint}</div>}
    </div>
  );
}

// ===========================================================================
// Shell (header + search + tabs)
// ===========================================================================
function Shell({
  t, lang, setLang, title, subtitle, saving, categories, activeCat, setActiveCat, addCategory, undo, toast, dir,
  globalQuery, setGlobalQuery, globalOpen, setGlobalOpen, globalResults, globalBoxRef, jumpToResult, openDetail,
  globalTypeFilter, setGlobalTypeFilter, helpOpen, setHelpOpen, children,
}) {
  return (
    <div dir={dir} className="min-h-screen bg-[#f4f2ec] text-[#2f3b2f]" style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}>
      <style>{`
        @keyframes rowGlow {
          0% { background-color: rgba(46,125,70,0.35); box-shadow: 0 0 0 2px rgba(46,125,70,0.5) inset; }
          60% { background-color: rgba(46,125,70,0.22); box-shadow: 0 0 0 2px rgba(46,125,70,0.35) inset; }
          100% { background-color: transparent; box-shadow: 0 0 0 0 rgba(46,125,70,0); }
        }
        .row-flash { animation: rowGlow 2.2s ease-out; }
      `}</style>

      <header className="border-b-2 border-[#2f3b2f]/20 px-6 py-4 sticky top-0 z-20" style={{ backgroundColor: "#eee9dc", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", WebkitTransform: "translateZ(0)", transform: "translateZ(0)", willChange: "transform" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-[#5c6b57] mt-0.5">{subtitle}</p>
          </div>

          <div className="relative flex-1 max-w-md" ref={globalBoxRef}>
            <Search size={15} className={`absolute top-1/2 -translate-y-1/2 text-[#5c6b57] ${lang === "ar" ? "right-3" : "left-3"}`} />
            <Sparkles size={13} className={`absolute top-1/2 -translate-y-1/2 text-[#2e7d46] opacity-70 ${lang === "ar" ? "left-3" : "right-3"}`} />
            <input
              value={globalQuery}
              onChange={(e) => { setGlobalQuery(e.target.value); setGlobalOpen(true); }}
              onFocus={() => setGlobalOpen(true)}
              placeholder={t.searchPlaceholder}
              className={`w-full py-2 rounded-lg border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#2e7d46] focus:ring-2 focus:ring-[#2e7d46]/20 ${lang === "ar" ? "pr-9 pl-8" : "pl-9 pr-8"}`}
            />
            {globalOpen && globalQuery.trim() && (
              <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-[#2f3b2f]/15 max-h-72 overflow-y-auto z-40">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#2f3b2f]/10 flex-wrap sticky top-0 bg-white" style={{ WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", WebkitTransform: "translateZ(0)", transform: "translateZ(0)", willChange: "transform" }}>
                  <button onClick={() => setGlobalTypeFilter("all")}
                    className={`text-[11px] px-2 py-1 rounded-full border ${globalTypeFilter === "all" ? "bg-[#2f3b2f] text-white border-[#2f3b2f]" : "border-[#2f3b2f]/20 text-[#5c6b57]"}`}>
                    {t.allTypes}
                  </button>
                  {MATERIAL_TYPES.filter((m) => m.id !== "mat_unassigned").map((m) => (
                    <button key={m.id} onClick={() => setGlobalTypeFilter(m.id)}
                      className="text-[11px] px-2 py-1 rounded-full border"
                      style={globalTypeFilter === m.id ? { background: m.color, color: "white", borderColor: m.color } : { borderColor: m.color + "60", color: m.color }}>
                      {nameOf(m.name, lang)}
                    </button>
                  ))}
                </div>
                {globalResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[#5c6b57]">{t.noMatches}</div>
                ) : (
                  globalResults.slice(0, 8).map((res, i) => (
                    <button key={i} onClick={() => openDetail(res.catId, res.row.id)}
                      className={`w-full px-4 py-2.5 hover:bg-green-50 border-b border-[#2f3b2f]/5 flex items-center justify-between gap-2 ${lang === "ar" ? "text-right" : "text-left"}`}>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{res.row.values.desc || res.row.values.ref || "—"}</div>
                        <div className="text-xs text-[#5c6b57] flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Tag size={10} /> {res.catName} · {res.row.values.qty ?? 0}
                          <TypeBadge type={res.material} lang={lang} />
                        </div>
                      </div>
                      <LocationBadge loc={res.location} lang={lang} />
                    </button>
                  ))
                )}
                {globalResults.length > 8 && (
                  <div className="px-4 py-2 text-xs text-[#5c6b57] text-center bg-[#f4f2ec]">
                    {lang === "ar" ? `+${globalResults.length - 8} نتيجة أخرى — دقّق البحث` : `+${globalResults.length - 8} more — refine your search`}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded border border-[#2f3b2f]/20 hover:bg-[#f4f2ec]">
              <Languages size={14} /> {t.langToggle}
            </button>
            <button onClick={() => setHelpOpen(true)} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded border border-[#2f3b2f]/20 hover:bg-[#f4f2ec]">
              <HelpCircle size={14} /> {t.help}
            </button>
            <button onClick={undo} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded border border-[#2f3b2f]/20 hover:bg-[#f4f2ec]"><Undo2 size={14} /> {t.undo}</button>
            <div className="text-xs text-[#5c6b57] flex items-center gap-1 whitespace-nowrap">
              {saving ? (<><Loader2 size={13} className="animate-spin" /> {t.saving}</>) : (<><Save size={13} /> {t.saved}</>)}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-5">
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <button onClick={() => setActiveCat("__dashboard__")}
            className={`px-4 py-2 rounded-t-md text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${activeCat === "__dashboard__" ? "bg-[#fbfaf5] border-[#8a5a2e] text-[#2f3b2f]" : "bg-transparent border-transparent text-[#5c6b57] hover:text-[#2f3b2f]"}`}>
            <LayoutDashboard size={15} /> {t.dashboardTab}
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`px-4 py-2 rounded-t-md text-sm font-semibold border-b-2 transition-colors ${c.id === activeCat ? "bg-[#fbfaf5] border-[#8a5a2e] text-[#2f3b2f]" : "bg-transparent border-transparent text-[#5c6b57] hover:text-[#2f3b2f]"}`}>
              {nameOf(c.name, lang)}
            </button>
          ))}
          <button onClick={addCategory} className="px-3 py-2 rounded-t-md text-sm font-semibold text-[#8a5a2e] hover:bg-[#eee9dc] flex items-center gap-1">
            <FolderPlus size={16} /> {t.addSheet}
          </button>
        </div>

        {children}

        <p className="text-xs text-[#5c6b57] pb-8 text-center">{t.autosaveFooter}</p>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50" style={{ backgroundColor: "#2f3b2f" }}>{toast}</div>}

      {helpOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setHelpOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-xl shadow-xl w-full max-w-md border border-[#2f3b2f]/10 overflow-hidden" style={{ backgroundColor: "#fbfaf5", opacity: 1 }}>
            <div className="px-5 py-3.5 border-b border-[#2f3b2f]/10 flex items-center justify-between" style={{ backgroundColor: "#f4f2ec" }}>
              <h3 className="font-bold flex items-center gap-2" style={{ color: "#2f3b2f" }}><HelpCircle size={16} /> {t.helpTitle}</h3>
              <button onClick={() => setHelpOpen(false)} style={{ color: "#2f3b2f" }}><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm" style={{ backgroundColor: "#fbfaf5", color: "#2f3b2f" }}>
              <p className="flex gap-2"><Search size={15} className="shrink-0 mt-0.5 text-[#2e7d46]" /> {t.helpSearch}</p>
              <p className="flex gap-2"><Plus size={15} className="shrink-0 mt-0.5 text-[#8a5a2e]" /> {t.helpQty}</p>
              <p className="flex gap-2"><MapPin size={15} className="shrink-0 mt-0.5 text-[#1f6f8b]" /> {t.helpLocation}</p>
              <p className="flex gap-2"><PackageMinus size={15} className="shrink-0 mt-0.5 text-[#6b4fa0]" /> {t.helpCheckout}</p>
              <p className="flex gap-2"><AlertTriangle size={15} className="shrink-0 mt-0.5 text-[#b23b3b]" /> {t.helpLowStock}</p>
              <p className="flex gap-2"><PlusCircle size={15} className="shrink-0 mt-0.5 text-[#6b4fa0]" /> {t.helpAdd}</p>
            </div>
            <div className="px-5 pb-5" style={{ backgroundColor: "#fbfaf5" }}>
              <button onClick={() => setHelpOpen(false)} className="w-full py-2 rounded text-white text-sm font-semibold" style={{ backgroundColor: "#8a5a2e" }}>{t.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
