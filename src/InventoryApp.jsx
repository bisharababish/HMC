import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Minus, Trash2, PlusCircle, Loader2,
  Search, ArrowUpDown, X, MapPin, AlertTriangle, Eye, PackageMinus, Clock,
} from "lucide-react";
import { STR, nameOf, timeAgo } from "./i18n/strings.js";
import { DEFAULT_LOCATIONS, MATERIAL_TYPES, STORAGE_KEY, STORAGE_KEY_LANG, MAX_HISTORY, MAX_LOG } from "./constants/index.js";
import { seedCategories, row, rid, toCSV, downloadText } from "./utils/index.js";
import Shell from "./components/Shell.jsx";
import ModalHost from "./components/ModalHost.jsx";
import Pagination from "./components/Pagination.jsx";
import OverflowMenu from "./components/OverflowMenu.jsx";
import { Panel, StatCard, LocationBadge, TypeBadge, LocationSelect } from "./components/ui.jsx";
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
                <div className="text-xs text-[#5c6b57]">{loc.count} {t.items} Â· {loc.qty} {t.units}</div>
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
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "Ø§Ù„ØµÙ†Ù" : "Item"}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.materialType}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.location}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "Ø§Ù„ÙƒÙ…ÙŠØ©" : "Qty"}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.deficitLabel}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.severity}</th>
                    <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.lastUpdated}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLowStock.map((it, i) => (
                    <tr key={i} className="border-t border-[#2f3b2f]/10 hover:bg-[#f4f2ec]/50">
                      <td className="px-4 py-2"><button onClick={() => openDetail(it.catId, it.rowId)} className="text-[#8a5a2e] hover:underline">{it.cat}</button></td>
                      <td className="px-4 py-2">{it.desc || "â€”"}</td>
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
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "Ø§Ù„ØµÙ†Ù" : "Item"}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.sheet}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{lang === "ar" ? "Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…Ø³Ø­ÙˆØ¨Ø©" : "Taken"}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.remainingLabel}</th>
                  <th className={`px-4 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>{t.lastUpdated}</th>
                </tr>
              </thead>
              <tbody>
                {checkoutLog.slice(0, 8).map((entry) => (
                  <tr key={entry.id} className="border-t border-[#2f3b2f]/10 hover:bg-[#f4f2ec]/50">
                    <td className="px-4 py-2"><button onClick={() => openDetail(entry.catId, entry.rowId)} className="text-[#8a5a2e] hover:underline">{entry.desc || entry.ref || "â€”"}</button></td>
                    <td className="px-4 py-2 text-[#5c6b57]">{entry.catName}</td>
                    <td className="px-4 py-2 font-bold text-[#b23b3b]">âˆ’{entry.qtyTaken}</td>
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
          hint={`${current.lowStockAt ?? 5} Â· ${t.editThreshold}`} />
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
                            <button onClick={() => bumpQty(current.id, r.id, -1)} title={lang === "ar" ? "Ø³Ø­Ø¨ ÙˆØ­Ø¯Ø©" : "Remove one unit"} className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"><Minus size={12} /></button>
                            <input type="number" value={r.values.qty ?? 0} onChange={(e) => changeCell(current.id, r.id, "qty", Number(e.target.value))}
                              className={`w-16 text-center bg-transparent border rounded px-1 py-1 font-bold ${isLow ? "border-red-300 text-red-700" : "border-[#2f3b2f]/15"}`} />
                            <button onClick={() => bumpQty(current.id, r.id, 1)} title={lang === "ar" ? "Ø¥Ø¶Ø§ÙØ© ÙˆØ­Ø¯Ø©" : "Add one unit"} className="w-6 h-6 flex items-center justify-center rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"><Plus size={12} /></button>
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
