import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Minus, Trash2, PlusCircle, Loader2,
  Search, ArrowUpDown, X, MapPin, AlertTriangle, Eye, PackageMinus, Clock, History, Pencil,
} from "lucide-react";
import { STR, nameOf, timeAgo } from "./i18n/strings.js";
import { DEFAULT_LOCATIONS, STORAGE_KEY, MAX_HISTORY, MAX_LOG, normalizeLocations } from "./constants/index.js";
import { seedCategories, row, rid, toCSV, downloadText, swapPlasticSheetNames, parseWidth, normalizeMeterRef, rowTotalMeters, rowMeterSeverity, isRowLowMeterStock, meterRowClass, meterCellClass } from "./utils/index.js";
import { widthsForRow, meterCodesForRow, isFinishWidthSheet } from "./constants/index.js";
import Shell from "./components/Shell.jsx";
import ModalHost from "./components/ModalHost.jsx";
import StorageModule from "./StorageModule.jsx";
import { seedStorageSites, normalizeStorageSites, normalizeStorageLog } from "./constants/storages.js";
import {
  normalizeAppState, buildPersistPayload, createModule, createEmptyModuleData,
  applyLabelingData, applyStorageData, hydrateInitialModuleState,
} from "./constants/modules.js";
import ModuleModals from "./components/ModuleModals.jsx";
import Pagination from "./components/Pagination.jsx";
import OverflowMenu from "./components/OverflowMenu.jsx";
import { fetchBackupHistory, loadBackupSnapshot, wasLastSaveCloud, clearAllBackups, createBackupSnapshot } from "./lib/db.js";
import { isSupabaseEnabled } from "./lib/supabase.js";
import { Panel, StatCard, LocationBadge, LocationSelect, SheetCellInput, WidthSelect, MetersCodeSelect } from "./components/ui.jsx";
export default function InventoryApp() {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [checkoutLog, setCheckoutLog] = useState([]);
  const [lang, setLang] = useState("en");
  const [activeCat, setActiveCat] = useState("__dashboard__");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [locFilter, setLocFilter] = useState("all");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [toast, setToast] = useState(null);
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalOpen, setGlobalOpen] = useState(false);
  const [flashRow, setFlashRow] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [lowStockPageSize, setLowStockPageSize] = useState(5);
  const [backupPage, setBackupPage] = useState(1);
  const [backupPageSize, setBackupPageSize] = useState(3);
  const [cloudSynced, setCloudSynced] = useState(true);
  const [cloudSavedAt, setCloudSavedAt] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [backups, setBackups] = useState([]);
  const [modules, setModules] = useState([]);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [moduleData, setModuleData] = useState({});
  const [moduleModal, setModuleModal] = useState(null);
  const [storageSites, setStorageSites] = useState(() => seedStorageSites());
  const [storageLog, setStorageLog] = useState([]);
  const saveTimer = useRef(null);
  const history = useRef([]);
  const globalBoxRef = useRef(null);

  const t = STR[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const activeModuleMeta = modules.find((m) => m.id === activeModuleId);
  const isStorageModule = activeModuleMeta?.type === "storages";

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const applyModuleSnapshot = useCallback((mod, data) => {
    if (!mod) return;
    if (mod.type === "labeling") {
      applyLabelingData(data, { setCategories, setLocations, setCheckoutLog, setActiveCat });
    } else {
      applyStorageData(data, { setStorageSites, setStorageLog });
    }
  }, []);

  const snapshotActiveModule = useCallback(() => {
    if (!activeModuleMeta) return null;
    if (activeModuleMeta.type === "labeling") {
      return { categories, locations: normalizeLocations(locations), checkoutLog };
    }
    return { sites: storageSites, log: storageLog };
  }, [activeModuleMeta, categories, locations, checkoutLog, storageSites, storageLog]);

  const switchModule = useCallback((newId) => {
    if (!newId || newId === activeModuleId) return;
    const nextMod = modules.find((m) => m.id === newId);
    if (!nextMod) return;
    setModuleData((prev) => {
      const updated = { ...prev };
      if (activeModuleId && activeModuleMeta) {
        if (activeModuleMeta.type === "labeling") {
          updated[activeModuleId] = { categories, locations: normalizeLocations(locations), checkoutLog };
        } else {
          updated[activeModuleId] = { sites: storageSites, log: storageLog };
        }
      }
      const target = updated[newId] || createEmptyModuleData(nextMod.type);
      applyModuleSnapshot(nextMod, target);
      return updated;
    });
    setActiveModuleId(newId);
  }, [activeModuleId, activeModuleMeta, modules, categories, locations, checkoutLog, storageSites, storageLog, applyModuleSnapshot]);

  const handleModuleSave = useCallback((payload) => {
    if (payload.kind === "add") {
      const mod = createModule(payload.type, payload.nameEn, payload.nameAr, payload.color);
      const empty = createEmptyModuleData(mod.type);
      setModules((prev) => [...prev, mod]);
      setModuleData((prev) => ({ ...prev, [mod.id]: empty }));
      if (activeModuleId && activeModuleMeta) {
        setModuleData((prev) => {
          const updated = { ...prev, [mod.id]: empty };
          if (activeModuleMeta.type === "labeling") {
            updated[activeModuleId] = { categories, locations: normalizeLocations(locations), checkoutLog };
          } else {
            updated[activeModuleId] = { sites: storageSites, log: storageLog };
          }
          return updated;
        });
      }
      applyModuleSnapshot(mod, empty);
      setActiveModuleId(mod.id);
      showToast(t.toastModuleAdded);
      return;
    }
    setModules((prev) => prev.map((m) => (
      m.id === payload.moduleId
        ? { ...m, name: { en: payload.nameEn.trim() || m.name.en, ar: payload.nameAr.trim() || m.name.ar }, color: payload.color }
        : m
    )));
    showToast(t.toastModuleUpdated);
  }, [activeModuleId, activeModuleMeta, categories, locations, checkoutLog, storageSites, storageLog, applyModuleSnapshot, showToast, t]);

  const handleModuleDelete = useCallback((moduleId) => {
    if (modules.length <= 1) return;
    const remaining = modules.filter((m) => m.id !== moduleId);
    setModules(remaining);
    setModuleData((prev) => {
      const next = { ...prev };
      delete next[moduleId];
      return next;
    });
    if (activeModuleId === moduleId) {
      const nextMod = remaining[0];
      const target = moduleData[nextMod.id] || createEmptyModuleData(nextMod.type);
      applyModuleSnapshot(nextMod, target);
      setActiveModuleId(nextMod.id);
    }
    showToast(t.toastModuleDeleted);
  }, [modules, activeModuleId, moduleData, applyModuleSnapshot, showToast, t]);

  const moduleSetters = { setCategories, setLocations, setCheckoutLog, setActiveCat, setStorageSites, setStorageLog };

  useEffect(() => {
    (async () => {
      const finishLoad = (normalized) => {
        setModules(normalized.modules);
        setModuleData(normalized.moduleData);
        setActiveModuleId(normalized.activeModuleId);
        setLang(normalized.lang);
        hydrateInitialModuleState(normalized, moduleSetters, swapPlasticSheetNames);
      };
      if (!isSupabaseEnabled()) {
        setLoadError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart the dev server.");
        finishLoad(normalizeAppState({}));
        setLoaded(true);
        return;
      }
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          finishLoad(normalizeAppState(JSON.parse(res.value)));
          if (res.updated_at) setCloudSavedAt(res.updated_at);
        } else {
          finishLoad(normalizeAppState({}));
        }
        setBackups(await fetchBackupHistory());
      } catch (e) {
        console.error("Load failed", e);
        setLoadError("Could not load from Supabase. Check your connection and SQL setup.");
        finishLoad(normalizeAppState({}));
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded && locations.length === 0) setLocations(DEFAULT_LOCATIONS);
  }, [loaded, locations.length]);

  const persist = useCallback((data) => {
    if (!isSupabaseEnabled()) return;
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const savedAt = await window.storage.set(STORAGE_KEY, JSON.stringify(data), false);
        setCloudSynced(wasLastSaveCloud());
        if (savedAt) setCloudSavedAt(savedAt);
      } catch (e) {
        setCloudSynced(false);
        showToast(lang === "ar" ? "فشل الحفظ على السحابة" : "Cloud save failed");
      }
      setSaving(false);
    }, 450);
  }, [lang]);

  useEffect(() => {
    if (!loaded || !modules.length || !activeModuleId) return;
    persist(buildPersistPayload({
      modules,
      activeModuleId,
      moduleData,
      categories,
      locations,
      checkoutLog,
      storageSites,
      storageLog,
      lang,
    }));
  }, [modules, activeModuleId, moduleData, categories, locations, checkoutLog, storageSites, storageLog, lang, loaded, persist]);
  useEffect(() => { setPage(1); }, [activeCat, query, locFilter, sortKey]);
  useEffect(() => { setBackupPage(1); }, [backups.length, backupPageSize]);

  useEffect(() => {
    const onClick = (e) => { if (globalBoxRef.current && !globalBoxRef.current.contains(e.target)) setGlobalOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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

  if (!loaded || !modules.length || !activeModuleId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f2ec]">
        <div className="flex items-center gap-2 text-[#2f3b2f]">
          <Loader2 className="animate-spin" size={20} />
          <span>{STR.en.loading} / {STR.ar.loading}</span>
        </div>
      </div>
    );
  }

  const current = categories.find((c) => c.id === activeCat);
  const isDashboard = activeCat === "__dashboard__" || !current;
  const locOf = (id) => locations.find((l) => l.id === id) || locations.find((l) => l.id === "loc_unassigned") || DEFAULT_LOCATIONS[DEFAULT_LOCATIONS.length - 1];

  const updateCategory = (catId, updater) => withHistory((prev) => prev.map((c) => (c.id === catId ? updater(c) : c)));

  const changeCell = (catId, rowId, key, value) => {
    updateCategory(catId, (c) => ({
      ...c,
      rows: c.rows.map((r) => (r.id === rowId ? {
        ...r,
        values: {
          ...r.values,
          [key]: value,
          ...(key === "qty" || key === "desc" || key === "ref" ? { lastUpdated: Date.now() } : {}),
        },
      } : r)),
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

  const deleteLocationNow = (locId) => {
    if (locId === "loc_unassigned") return;
    withHistory((prev) => prev.map((c) => ({
      ...c,
      rows: c.rows.map((r) =>
        r.values.location === locId
          ? { ...r, values: { ...r.values, location: "loc_unassigned" } }
          : r
      ),
    })));
    setLocations((prev) => prev.filter((l) => l.id !== locId));
    showToast(t.toastLocationDeleted);
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

  const deleteActivityEntry = (entryId, restoreStock) => {
    const entry = checkoutLog.find((e) => e.id === entryId);
    if (!entry) return;
    if (restoreStock) {
      updateCategory(entry.catId, (c) => ({
        ...c,
        rows: c.rows.map((r) =>
          r.id === entry.rowId
            ? { ...r, values: { ...r.values, qty: (Number(r.values.qty) || 0) + entry.qtyTaken, lastUpdated: Date.now() } }
            : r
        ),
      }));
    }
    setCheckoutLog((prev) => prev.filter((e) => e.id !== entryId));
    showToast(t.toastActivityRemoved);
  };

  const saveActivityEdit = (entryId, newQty, newNote) => {
    const entry = checkoutLog.find((e) => e.id === entryId);
    if (!entry) return;
    const oldQty = entry.qtyTaken;
    const qty = Math.max(0, Math.floor(Number(newQty) || 0));
    const diff = oldQty - qty;
    if (diff !== 0) {
      updateCategory(entry.catId, (c) => ({
        ...c,
        rows: c.rows.map((r) =>
          r.id === entry.rowId
            ? { ...r, values: { ...r.values, qty: Math.max(0, (Number(r.values.qty) || 0) + diff), lastUpdated: Date.now() } }
            : r
        ),
      }));
    }
    setCheckoutLog((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, qtyTaken: qty, remainingQty: (e.remainingQty ?? 0) + (oldQty - qty), note: newNote || "" }
          : e
      )
    );
    showToast(t.toastActivityUpdated);
  };

  // ---- global search ----
  let globalResults = [];
  if (globalQuery.trim()) {
    const q = globalQuery.trim().toLowerCase();
    categories.forEach((c) => {
      c.rows.forEach((r) => {
        const hay = c.columns.map((col) => String(r.values[col.key] ?? "")).join(" ").toLowerCase();
        if (hay.includes(q)) globalResults.push({ catId: c.id, catName: nameOf(c.name, lang), row: r, location: locOf(r.values.location) });
      });
    });
  }

  const restoreBackup = async (id) => {
    const data = await loadBackupSnapshot(id);
    if (!data) return;
    history.current.push(JSON.stringify(categories));
    const normalized = normalizeAppState(data);
    setModules(normalized.modules);
    setModuleData(normalized.moduleData);
    setActiveModuleId(normalized.activeModuleId);
    if (normalized.lang === "en" || normalized.lang === "ar") setLang(normalized.lang);
    hydrateInitialModuleState(normalized, moduleSetters, swapPlasticSheetNames);
    showToast(t.snapshotRestored);
  };

  const clearBackupHistory = async () => {
    try {
      await clearAllBackups();
      setBackups([]);
      showToast(t.toastBackupsCleared);
    } catch {
      showToast(t.cloudSaveFailed);
    }
  };

  const saveBackupNow = async () => {
    try {
      await createBackupSnapshot(buildPersistPayload({
        modules,
        activeModuleId,
        moduleData,
        categories,
        locations,
        checkoutLog,
        storageSites,
        storageLog,
        lang,
      }));
      setBackups(await fetchBackupHistory());
      showToast(t.toastBackupSaved);
    } catch {
      showToast(t.cloudSaveFailed);
    }
  };

  const clearAllActivity = () => {
    setCheckoutLog([]);
    showToast(t.toastActivityCleared);
  };

  const moduleSwitcherProps = {
    modules,
    activeModuleId,
    onChange: switchModule,
    onAdd: () => setModuleModal({ kind: "addModule" }),
    onEdit: (moduleId) => setModuleModal({ kind: "editModule", module: modules.find((m) => m.id === moduleId) }),
    lang,
    t,
  };

  const shellProps = {
    t, lang, setLang,
    title: activeModuleMeta ? nameOf(activeModuleMeta.name, lang) : t.appTitle,
    subtitle: t.appSubtitle,
    saving, cloudSynced, cloudSavedAt, categories, activeCat, setActiveCat,
    addCategory: () => setModal({ kind: "addSheet" }), undo, toast, dir,
    globalQuery, setGlobalQuery, globalOpen, setGlobalOpen, globalResults, globalBoxRef, jumpToResult, openDetail,
    helpOpen, setHelpOpen, loadError,
    moduleSwitcherProps,
  };

  if (isStorageModule) {
    return (
      <>
        <StorageModule
          sites={storageSites}
          setSites={setStorageSites}
          storageLog={storageLog}
          setStorageLog={setStorageLog}
          lang={lang}
          setLang={setLang}
          saving={saving}
          cloudSynced={cloudSynced}
          cloudSavedAt={cloudSavedAt}
          loadError={loadError}
          moduleTitle={activeModuleMeta ? nameOf(activeModuleMeta.name, lang) : t.storageTitle}
          moduleSwitcherProps={moduleSwitcherProps}
        />
        <ModuleModals modal={moduleModal} setModal={setModuleModal} t={t} onSave={handleModuleSave} onDelete={handleModuleDelete} />
        {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50" style={{ backgroundColor: "#2f3b2f" }}>{toast}</div>}
      </>
    );
  }

  const modalHostProps = {
    modal, setModal, t, lang, categories, locations, checkoutLog, setLocations, withHistory, setActiveCat, showToast,
    deleteRowNow, deleteCategoryNow, updateCategory, changeCell, bumpQty, takeOutStock, jumpToResult, locOf,
    deleteActivityEntry, saveActivityEdit, clearBackupHistory, clearAllActivity, deleteLocationNow,
  };

  // ============================= Dashboard =============================
  if (isDashboard) {
    const grand = categories.reduce((s, c) => s + c.rows.reduce((rs, r) => rs + (Number(r.values.qty) || 0), 0), 0);
    const lowStockItems = [];
    categories.forEach((c) => c.rows.forEach((r) => {
      const totalMeters = rowTotalMeters(r, c);
      const severity = rowMeterSeverity(r, c);
      if (severity) {
        const target = severity === "out" ? 0 : severity === "critical" ? 5000 : 10000;
        const deficit = severity === "out" ? 0 : Math.max(0, target - totalMeters);
        const qty = Number(r.values.qty) || 0;
        const width = parseWidth(r.values.desc, r.values.ref);
        const meterCode = normalizeMeterRef(r.values.ref) || r.values.ref;
        lowStockItems.push({ cat: nameOf(c.name, lang), catId: c.id, rowId: r.id, desc: r.values.desc, ref: meterCode, qty, width, totalMeters, deficit, severity, location: locOf(r.values.location), lastUpdated: r.values.lastUpdated });
      }
    }));
    lowStockItems.sort((a, b) => a.totalMeters - b.totalMeters);
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
    const backupTotalPages = Math.max(1, Math.ceil(backups.length / backupPageSize));
    const safeBackupPage = Math.min(backupPage, backupTotalPages);
    const pagedBackups = backups.slice((safeBackupPage - 1) * backupPageSize, safeBackupPage * backupPageSize);
    const backupRangeStart = backups.length === 0 ? 0 : (safeBackupPage - 1) * backupPageSize + 1;
    const backupRangeEnd = Math.min(backups.length, safeBackupPage * backupPageSize);

    return (
      <Shell {...shellProps}>
        {categories.length === 0 ? (
          <div className="mb-6 rounded-lg border border-dashed border-[#2f3b2f]/25 bg-[#fbfaf5] p-8 text-center">
            <p className="text-[#2f3b2f] font-semibold mb-2">{lang === "ar" ? "لا توجد أوراق بعد" : "No sheets yet"}</p>
            <p className="text-sm text-[#5c6b57] mb-4">{lang === "ar" ? "ابدأ بإنشاء ورقة جديدة لتتبع المخزون." : "Create your first sheet to start tracking inventory."}</p>
            <button onClick={() => setModal({ kind: "addSheet" })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded font-semibold text-white" style={{ backgroundColor: "#8a5a2e" }}>
              <PlusCircle size={16} /> {t.addSheet}
            </button>
          </div>
        ) : (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <StatCard label={t.totalUnits} value={grand} accent="#8a5a2e" />
          <StatCard label={t.sheets} value={categories.length} accent="#4a6b52" />
          <StatCard label={t.lowStock} value={lowStockItems.length} accent={lowStockItems.length ? "#b23b3b" : "#4a6b52"} />
        </div>
        )}

        <Panel icon={<MapPin size={16} className="text-[#4a6b52]" />} title={t.byLocation}>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 p-4">
            {byLocation.map((loc) => (
              <div key={loc.id} className="rounded-lg border p-3 flex items-center justify-between gap-2" style={{ borderColor: loc.color + "40", background: loc.color + "0d" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: loc.color }} />
                  <span className="text-sm font-semibold truncate">{nameOf(loc.name, lang)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[#5c6b57]">{loc.count} {t.items} · {loc.qty} {t.units}</span>
                  <button type="button" onClick={() => setModal({ kind: "editLocation", locId: loc.id })} title={t.editLocation}
                    className="text-[#5c6b57] hover:text-[#1f6f8b] p-1 rounded hover:bg-white/60">
                    <Pencil size={14} />
                  </button>
                </div>
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
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.location}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "العرض" : "Width"}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.itemCount}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "متر" : "Meters"}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.totalMetersLabel}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.deficitLabel}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.severity}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.lastUpdated}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLowStock.map((it, i) => (
                    <tr key={i} className="border-t border-[#2f3b2f]/10 hover:bg-[#f4f2ec]/50">
                      <td className="px-4 py-2"><button onClick={() => openDetail(it.catId, it.rowId)} className="text-[#8a5a2e] hover:underline">{it.cat}</button></td>
                      <td className="px-4 py-2"><LocationBadge loc={it.location} lang={lang} /></td>
                      <td className="px-4 py-2">{it.desc || "—"}</td>
                      <td className="px-4 py-2">{it.qty}</td>
                      <td className="px-4 py-2">{it.ref || "—"}</td>
                      <td className="px-4 py-2 font-bold text-[#b23b3b]">{it.totalMeters.toLocaleString()}</td>
                      <td className="px-4 py-2">{it.deficit.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        {it.severity === "out" && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">{t.outOfStock}</span>}
                        {it.severity === "low" && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{t.lowSeverity}</span>}
                        {it.severity === "critical" && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{t.critical}</span>}
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
          {checkoutLog.length > 0 && (
            <div className={`px-5 pt-3 flex ${lang === "ar" ? "justify-start" : "justify-end"}`}>
              <button
                type="button"
                onClick={() => setModal({ kind: "confirmClearActivity" })}
                className="text-xs px-3 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 font-semibold"
              >
                {t.clearAllActivity}
              </button>
            </div>
          )}
          {checkoutLog.length === 0 ? (
            <p className="p-5 text-sm text-[#5c6b57]">{t.noActivity}</p>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#f4f2ec] text-[#5c6b57]">
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "الصنف" : "Item"}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.sheet}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "الكمية المسحوبة" : "Taken"}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.remainingLabel}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "ملاحظة" : "Note"}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.lastUpdated}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {checkoutLog.map((entry) => (
                  <tr key={entry.id} className="border-t border-[#2f3b2f]/10 hover:bg-[#f4f2ec]/50">
                    <td className="px-4 py-2"><button onClick={() => openDetail(entry.catId, entry.rowId)} className="text-[#8a5a2e] hover:underline">{entry.desc || entry.ref || ""}</button></td>
                    <td className="px-4 py-2 text-[#5c6b57]">{entry.catName}</td>
                    <td className="px-4 py-2 font-bold text-[#b23b3b]">-{entry.qtyTaken}</td>
                    <td className="px-4 py-2">{entry.remainingQty}</td>
                    <td className="px-4 py-2 text-[#5c6b57] max-w-[120px] truncate">{entry.note || ""}</td>
                    <td className="px-4 py-2 text-xs text-[#5c6b57]"><span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(entry.ts, t)}</span></td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal({ kind: "editActivity", entryId: entry.id })} title={t.editActivity} className="text-[#5c6b57] hover:text-[#1f6f8b]"><Pencil size={14} /></button>
                        <button onClick={() => setModal({ kind: "confirmDeleteActivity", entryId: entry.id })} title={t.deleteActivity} className="text-[#5c6b57] hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </Panel>

        {isSupabaseEnabled() && (
          <Panel icon={<History size={16} className="text-[#1f6f8b]" />} title={t.backupHistory}>
            <div className={`px-5 pt-3 flex flex-wrap gap-2 ${lang === "ar" ? "justify-start" : "justify-end"}`}>
              <button
                type="button"
                onClick={saveBackupNow}
                className="text-xs px-3 py-1.5 rounded font-semibold text-white"
                style={{ backgroundColor: "#1f6f8b" }}
              >
                {t.saveBackupNow}
              </button>
              {backups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModal({ kind: "confirmClearBackups" })}
                  className="text-xs px-3 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 font-semibold"
                >
                  {t.clearAllBackups}
                </button>
              )}
            </div>
            {backups.length === 0 ? (
              <p className="p-5 text-sm text-[#5c6b57]">{t.noBackups}</p>
            ) : (
              <>
              <ul className="divide-y divide-[#2f3b2f]/10">
                {pagedBackups.map((b) => (
                  <li key={b.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#5c6b57] flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(b.created_at).toLocaleString(lang === "ar" ? "ar" : "en")}
                    </span>
                    <button
                      onClick={() => restoreBackup(b.id)}
                      className="text-xs px-3 py-1.5 rounded font-semibold text-white"
                      style={{ backgroundColor: "#1f6f8b" }}
                    >
                      {t.restoreSnapshot}
                    </button>
                  </li>
                ))}
              </ul>
              <Pagination
                t={t}
                lang={lang}
                page={safeBackupPage}
                totalPages={backupTotalPages}
                setPage={setBackupPage}
                pageSize={backupPageSize}
                setPageSize={setBackupPageSize}
                pageSizeOptions={[1, 2, 3]}
                rangeStart={backupRangeStart}
                rangeEnd={backupRangeEnd}
                totalRows={backups.length}
              />
              </>
            )}
          </Panel>
        )}

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
    return matchesQuery && matchesLoc;
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
  const lowCount = current.rows.filter((r) => isRowLowMeterStock(r, current)).length;
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
        <StatCard label={t.lowStock} value={lowCount} accent={lowCount ? "#b23b3b" : "#4a6b52"} />
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
                        <span>{col.key === "desc" && isFinishWidthSheet(current) ? (lang === "ar" ? "النوع" : "Finish") : nameOf(col.label, lang)}</span>
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
                const severity = rowMeterSeverity(r, current);
                const totalMeters = rowTotalMeters(r, current);
                const widthOpts = widthsForRow(r, current);
                const meterOpts = meterCodesForRow(r, current);
                const isFlashed = flashRow === r.id;
                return (
                  <tr id={`row-${r.id}`} key={r.id}
                      className={`border-t border-[#2f3b2f]/10 transition-colors duration-700 ${isFlashed ? "row-flash" : meterRowClass(severity) || "hover:bg-[#f4f2ec]/60"}`}>
                    <td className="px-3 py-2 text-[#8a5a2e] font-semibold">{(safePage - 1) * pageSize + i + 1}</td>
                    <td className="px-3 py-1.5"><LocationSelect value={r.values.location} locations={locations} lang={lang} onChange={(v) => changeCell(current.id, r.id, "location", v)} /></td>
                    {current.columns.map((col) => (
                      <td key={col.key} className="px-3 py-1.5">
                        {col.key === "qty" ? (
                          <div className="flex items-center gap-1.5 justify-center">
                            <button onClick={() => bumpQty(current.id, r.id, -1)} title={lang === "ar" ? "سحب وحدة" : "Remove one unit"} className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"><Minus size={12} /></button>
                            <SheetCellInput type="number" value={r.values.qty ?? 0} onCommit={(v) => changeCell(current.id, r.id, "qty", v)}
                              className="w-16 text-center bg-transparent border border-[#2f3b2f]/15 rounded px-1 py-1 font-bold" />
                            <button onClick={() => bumpQty(current.id, r.id, 1)} title={lang === "ar" ? "إضافة وحدة" : "Add one unit"} className="w-6 h-6 flex items-center justify-center rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"><Plus size={12} /></button>
                          </div>
                        ) : col.key === "desc" && widthOpts.length > 0 ? (
                          <WidthSelect value={r.values.desc ?? ""} options={widthOpts} lang={lang}
                            onChange={(v) => changeCell(current.id, r.id, "desc", v)} />
                        ) : col.key === "ref" && meterOpts.length > 0 ? (
                          <>
                            <MetersCodeSelect value={r.values.ref ?? ""} options={meterOpts} lang={lang}
                              onChange={(v) => changeCell(current.id, r.id, "ref", v)} />
                            {totalMeters > 0 && (
                              <div className="text-[10px] text-[#5c6b57] mt-0.5 text-center">{totalMeters.toLocaleString()} {lang === "ar" ? "م كلي" : "m total"}</div>
                            )}
                          </>
                        ) : col.key === "ref" ? (
                          <>
                            <SheetCellInput type="text" value={r.values.ref ?? ""} onCommit={(v) => changeCell(current.id, r.id, "ref", v)}
                              placeholder={t.metersCodeHint}
                              className={`w-full bg-transparent border rounded px-2 py-1 ${meterCellClass(severity)}`} />
                            {totalMeters > 0 && (
                              <div className="text-[10px] text-[#5c6b57] mt-0.5 text-center">{totalMeters.toLocaleString()} {lang === "ar" ? "م كلي" : "m total"}</div>
                            )}
                          </>
                        ) : (
                          <SheetCellInput type="text" value={r.values[col.key] ?? ""} onCommit={(v) => changeCell(current.id, r.id, col.key, v)}
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
      <ModuleModals modal={moduleModal} setModal={setModuleModal} t={t} onSave={handleModuleSave} onDelete={handleModuleDelete} />
    </Shell>
  );
}
