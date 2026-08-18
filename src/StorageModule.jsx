import { useState, useEffect, useRef } from "react";
import {
  Plus, Minus, Trash2, PlusCircle, Loader2, Search, X, Warehouse, Pencil,
  LayoutDashboard, PackageMinus, Clock, Eye,
} from "lucide-react";
import { STR, nameOf, timeAgo } from "./i18n/strings.js";
import { STORAGE_COLUMNS, storageRow, storageSiteTotals } from "./constants/storages.js";
import { rid } from "./utils/index.js";
import ModuleSwitcher from "./components/ModuleSwitcher.jsx";
import Pagination from "./components/Pagination.jsx";
import { Panel, StatCard, SheetCellInput } from "./components/ui.jsx";

const COLS = STORAGE_COLUMNS();

function ModalWrap({ title, children, onClose, wide }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`rounded-xl shadow-xl w-full border border-[#2f3b2f]/10 overflow-hidden ${wide ? "max-w-lg" : "max-w-md"}`} style={{ backgroundColor: "#fbfaf5" }}>
        <div className="px-5 py-3.5 border-b border-[#2f3b2f]/10 flex items-center justify-between bg-[#f4f2ec]">
          <h3 className="font-bold">{title}</h3>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function StorageModule({
  sites, setSites, storageLog, setStorageLog, lang, setLang,
  saving, cloudSynced, cloudSavedAt, loadError,
  moduleTitle, moduleSwitcherProps,
}) {
  const [activeSite, setActiveSite] = useState("__storage_dashboard__");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalOpen, setGlobalOpen] = useState(false);
  const globalBoxRef = useRef(null);
  const [editNameEn, setEditNameEn] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const [editColor, setEditColor] = useState("#2e7d46");
  const [takeBoxes, setTakeBoxes] = useState(1);
  const [takePallets, setTakePallets] = useState(0);
  const [takeNote, setTakeNote] = useState("");

  const t = STR[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const current = sites.find((s) => s.id === activeSite);
  const isDashboard = activeSite === "__storage_dashboard__" || !current;

  useEffect(() => { setPage(1); }, [activeSite, query]);
  useEffect(() => {
    const onClick = (e) => { if (globalBoxRef.current && !globalBoxRef.current.contains(e.target)) setGlobalOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const updateSite = (siteId, updater) => {
    setSites((prev) => prev.map((s) => (s.id === siteId ? updater(s) : s)));
  };

  const changeCell = (siteId, rowId, key, value) => {
    updateSite(siteId, (s) => ({
      ...s,
      rows: s.rows.map((r) =>
        r.id === rowId
          ? { ...r, values: { ...r.values, [key]: value, lastUpdated: Date.now() } }
          : r
      ),
    }));
  };

  const bump = (siteId, rowId, key, delta) => {
    updateSite(siteId, (s) => ({
      ...s,
      rows: s.rows.map((r) => {
        if (r.id !== rowId) return r;
        const next = Math.max(0, (Number(r.values[key]) || 0) + delta);
        return { ...r, values: { ...r.values, [key]: next, lastUpdated: Date.now() } };
      }),
    }));
  };

  const addRow = (siteId) => {
    updateSite(siteId, (s) => ({
      ...s,
      rows: [...s.rows, storageRow({ item: "", boxes: 0, pallets: 0, notes: "" })],
    }));
  };

  const deleteRow = (siteId, rowId) => {
    updateSite(siteId, (s) => ({ ...s, rows: s.rows.filter((r) => r.id !== rowId) }));
  };

  const takeOut = (siteId, rowId, boxes, pallets, note) => {
    const site = sites.find((s) => s.id === siteId);
    const row = site?.rows.find((r) => r.id === rowId);
    if (!site || !row) return;
    const availB = Number(row.values.boxes) || 0;
    const availP = Number(row.values.pallets ?? row.values.units) || 0;
    const takeB = Math.max(0, Math.min(boxes, availB));
    const takeP = Math.max(0, Math.min(pallets, availP));
    updateSite(siteId, (s) => ({
      ...s,
      rows: s.rows.map((r) =>
        r.id === rowId
          ? {
              ...r,
              values: {
                ...r.values,
                boxes: availB - takeB,
                pallets: availP - takeP,
                lastUpdated: Date.now(),
              },
            }
          : r
      ),
    }));
    setStorageLog((prev) => [
      {
        id: rid(),
        ts: Date.now(),
        siteId,
        siteName: nameOf(site.name, lang),
        rowId,
        item: row.values.item,
        boxesTaken: takeB,
        palletsTaken: takeP,
        note: note || "",
      },
      ...prev,
    ].slice(0, 200));
  };

  let globalResults = [];
  if (globalQuery.trim()) {
    const q = globalQuery.trim().toLowerCase();
    sites.forEach((s) => {
      s.rows.forEach((r) => {
        const hay = COLS.map((c) => String(r.values[c.key] ?? "")).join(" ").toLowerCase();
        if (hay.includes(q)) globalResults.push({ siteId: s.id, siteName: nameOf(s.name, lang), row: r });
      });
    });
  }

  const grand = sites.reduce((acc, s) => {
    const t = storageSiteTotals(s);
    return { boxes: acc.boxes + t.boxes, pallets: acc.pallets + t.pallets, items: acc.items + t.items };
  }, { boxes: 0, pallets: 0, items: 0 });

  const filteredRows = current
    ? current.rows.filter((r) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return COLS.some((c) => String(r.values[c.key] ?? "").toLowerCase().includes(q));
      })
    : [];

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openEditSite = (siteId) => {
    const s = sites.find((x) => x.id === siteId);
    if (!s) return;
    setEditNameEn(s.name?.en || "");
    setEditNameAr(s.name?.ar || "");
    setEditColor(s.color || "#2e7d46");
    setModal({ kind: "editSite", siteId });
  };

  const saveSiteEdit = () => {
    if (modal?.kind !== "editSite") return;
    updateSite(modal.siteId, (s) => ({
      ...s,
      name: { en: editNameEn.trim() || s.name.en, ar: editNameAr.trim() || s.name.ar },
      color: editColor,
    }));
    setModal(null);
  };

  const openTakeOut = (siteId, rowId) => {
    const r = sites.find((s) => s.id === siteId)?.rows.find((x) => x.id === rowId);
    setTakeBoxes(1);
    setTakePallets(0);
    setTakeNote("");
    setModal({
      kind: "takeOut",
      siteId,
      rowId,
      maxBoxes: Number(r?.values.boxes) || 0,
      maxPallets: Number(r?.values.pallets ?? r?.values.units) || 0,
      item: r?.values.item,
    });
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#f4f2ec] text-[#2f3b2f]" style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}>
      <header className="border-b-2 border-[#2f3b2f]/20 px-6 py-4 sticky top-0 z-20" style={{ backgroundColor: "#eee9dc" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{moduleTitle || t.storageTitle}</h1>
          </div>
          <div className="relative flex-1 max-w-md" ref={globalBoxRef}>
            <Search size={15} className={`absolute top-1/2 -translate-y-1/2 text-[#5c6b57] ${lang === "ar" ? "right-3" : "left-3"}`} />
            <input
              value={globalQuery}
              onChange={(e) => { setGlobalQuery(e.target.value); setGlobalOpen(true); }}
              onFocus={() => setGlobalOpen(true)}
              placeholder={t.storageSearchPlaceholder}
              className={`w-full py-2 rounded-lg border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#1f6f8b] focus:ring-2 focus:ring-[#1f6f8b]/20 ${lang === "ar" ? "pr-9 pl-3" : "pl-9 pr-3"}`}
            />
            {globalOpen && globalQuery.trim() && (
              <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-[#2f3b2f]/15 max-h-72 overflow-y-auto z-40">
                {globalResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[#5c6b57]">{t.noMatches}</div>
                ) : (
                  globalResults.slice(0, 8).map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setActiveSite(res.siteId); setGlobalOpen(false); setGlobalQuery(""); }}
                      className={`w-full px-4 py-2.5 hover:bg-blue-50 border-b border-[#2f3b2f]/5 ${lang === "ar" ? "text-right" : "text-left"}`}
                    >
                      <div className="text-sm font-semibold truncate">{res.row.values.item || "—"}</div>
                      <div className="text-xs text-[#5c6b57]">{res.siteName} · {res.row.values.boxes} {t.storageBoxes} · {res.row.values.pallets ?? res.row.values.units ?? 0} {t.storagePallets}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLang(lang === "en" ? "ar" : "en")} className="text-xs px-3 py-1.5 rounded border border-[#2f3b2f]/20 hover:bg-[#f4f2ec]">{t.langToggle}</button>
            <div className="text-xs text-[#5c6b57] flex items-center gap-1">
              {saving ? <><Loader2 size={13} className="animate-spin" /> {t.cloudSaving}</> : cloudSynced ? t.cloudSaved : t.cloudSaveFailed}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-5">
        {moduleSwitcherProps && <ModuleSwitcher {...moduleSwitcherProps} />}

        {loadError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{loadError}</div>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-5">
          <button
            type="button"
            onClick={() => setActiveSite("__storage_dashboard__")}
            className={`px-4 py-2 rounded-t-md text-sm font-semibold border-b-2 flex items-center gap-1.5 ${activeSite === "__storage_dashboard__" ? "bg-[#fbfaf5] border-[#1f6f8b] text-[#2f3b2f]" : "bg-transparent border-transparent text-[#5c6b57]"}`}
          >
            <LayoutDashboard size={15} /> {t.storageDashboardTab}
          </button>
          {sites.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSite(s.id)}
              className={`px-4 py-2 rounded-t-md text-sm font-semibold border-b-2 transition-colors ${s.id === activeSite ? "bg-[#fbfaf5] border-[#1f6f8b] text-[#2f3b2f]" : "bg-transparent border-transparent text-[#5c6b57] hover:text-[#2f3b2f]"}`}
            >
              {nameOf(s.name, lang)}
            </button>
          ))}
        </div>

        {isDashboard ? (
          <>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <StatCard label={t.storageSites} value={sites.length} accent="#1f6f8b" />
              <StatCard label={t.totalBoxes} value={grand.boxes} accent="#6b4fa0" />
              <StatCard label={t.storagePallets} value={grand.pallets} accent="#2e7d46" />
            </div>
            <Panel icon={<Warehouse size={16} className="text-[#1f6f8b]" />} title={t.storageSites}>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 p-4">
                {sites.map((s) => {
                  const tot = storageSiteTotals(s);
                  return (
                    <div key={s.id} className="rounded-lg border p-3 flex flex-col gap-2" style={{ borderColor: s.color + "40", background: s.color + "0d" }}>
                      <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={() => setActiveSite(s.id)} className="text-sm font-semibold truncate hover:underline text-left" style={{ color: s.color }}>
                          {nameOf(s.name, lang)}
                        </button>
                        <button type="button" onClick={() => openEditSite(s.id)} className="text-[#5c6b57] hover:text-[#1f6f8b] p-1"><Pencil size={14} /></button>
                      </div>
                      <div className="text-xs text-[#5c6b57]">
                        {tot.items} {t.storageItems} · {tot.boxes} {t.storageBoxes} · {tot.pallets} {t.storagePallets}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
            <Panel icon={<PackageMinus size={16} className="text-[#6b4fa0]" />} title={t.storageActivity}>
              {storageLog.length === 0 ? (
                <p className="p-5 text-sm text-[#5c6b57]">{t.storageNoActivity}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f4f2ec] text-[#5c6b57]">
                        <th className="px-4 py-2 text-left">{t.storageItems}</th>
                        <th className="px-4 py-2 text-left">{t.sheet}</th>
                        <th className="px-4 py-2 text-left">{t.storageBoxes}</th>
                        <th className="px-4 py-2 text-left">{t.storagePallets}</th>
                        <th className="px-4 py-2 text-left">{t.notes}</th>
                        <th className="px-4 py-2 text-left">{t.lastUpdated}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageLog.slice(0, 20).map((e) => (
                        <tr key={e.id} className="border-t border-[#2f3b2f]/10">
                          <td className="px-4 py-2">{e.item || "—"}</td>
                          <td className="px-4 py-2">{e.siteName}</td>
                          <td className="px-4 py-2">{e.boxesTaken}</td>
                          <td className="px-4 py-2">{e.palletsTaken ?? e.unitsTaken ?? 0}</td>
                          <td className="px-4 py-2 text-[#5c6b57]">{e.note || "—"}</td>
                          <td className="px-4 py-2 text-xs text-[#5c6b57]"><Clock size={11} className="inline mr-1" />{timeAgo(e.ts, t)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: current.color }} />
                <h2 className="text-lg font-bold">{nameOf(current.name, lang)}</h2>
                <button type="button" onClick={() => openEditSite(current.id)} className="text-[#5c6b57] hover:text-[#1f6f8b]"><Pencil size={15} /></button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className={`absolute top-1/2 -translate-y-1/2 text-[#5c6b57] ${lang === "ar" ? "right-2" : "left-2"}`} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.filterSheet}
                    className={`text-xs px-2 py-1.5 rounded border border-[#2f3b2f]/20 bg-white w-36 outline-none ${lang === "ar" ? "pr-7" : "pl-7"}`} />
                </div>
                <button type="button" onClick={() => addRow(current.id)} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded font-semibold text-white" style={{ backgroundColor: "#1f6f8b" }}>
                  <PlusCircle size={14} /> {t.storageNewItem}
                </button>
              </div>
            </div>

            {(() => {
              const tot = storageSiteTotals(current);
              return (
                <div className="grid sm:grid-cols-3 gap-4 mb-5">
                  <StatCard label={t.storageItems} value={tot.items} accent="#1f6f8b" />
                  <StatCard label={t.storageBoxes} value={tot.boxes} accent="#6b4fa0" />
                  <StatCard label={t.storagePallets} value={tot.pallets} accent="#2e7d46" />
                </div>
              );
            })()}

            <div className="bg-[#fbfaf5] rounded-lg border border-[#2f3b2f]/10 overflow-x-auto shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f4f2ec] text-[#5c6b57]">
                    <th className="px-3 py-2 w-10">#</th>
                    {COLS.map((col) => (
                      <th key={col.key} className="px-3 py-2 text-left">{nameOf(col.label, lang)}</th>
                    ))}
                    <th className="px-3 py-2 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.length === 0 && (
                    <tr><td colSpan={COLS.length + 2} className="px-4 py-8 text-center text-[#5c6b57]">{t.noResultsRow}</td></tr>
                  )}
                  {pagedRows.map((r, i) => (
                    <tr key={r.id} className="border-t border-[#2f3b2f]/10 hover:bg-[#f4f2ec]/60">
                      <td className="px-3 py-2 text-[#5c6b57] font-semibold">{(safePage - 1) * pageSize + i + 1}</td>
                      {COLS.map((col) => (
                        <td key={col.key} className="px-3 py-1.5">
                          {col.type === "number" && (col.key === "boxes" || col.key === "pallets") ? (
                            <div className="flex items-center gap-1 justify-center">
                              <button type="button" onClick={() => bump(current.id, r.id, col.key, -1)} className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-600 border border-red-200"><Minus size={12} /></button>
                              <SheetCellInput type="number" value={r.values[col.key] ?? 0} onCommit={(v) => changeCell(current.id, r.id, col.key, v)} className="w-16 text-center border border-[#2f3b2f]/15 rounded px-1 py-1 font-bold" />
                              <button type="button" onClick={() => bump(current.id, r.id, col.key, 1)} className="w-6 h-6 flex items-center justify-center rounded bg-green-50 text-green-700 border border-green-200"><Plus size={12} /></button>
                            </div>
                          ) : (
                            <SheetCellInput type={col.type === "number" ? "number" : "text"} value={r.values[col.key] ?? (col.type === "number" ? 0 : "")} onCommit={(v) => changeCell(current.id, r.id, col.key, v)} className="w-full bg-transparent border border-transparent focus:border-[#2f3b2f]/20 rounded px-2 py-1" />
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 justify-center">
                          <button type="button" onClick={() => openTakeOut(current.id, r.id)} title={t.storageTakeOut} className="text-[#5c6b57] hover:text-[#6b4fa0]"><PackageMinus size={15} /></button>
                          <button type="button" onClick={() => setModal({ kind: "deleteRow", siteId: current.id, rowId: r.id })} title={t.delete} className="text-[#5c6b57] hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRows.length > 0 && (
              <Pagination t={t} lang={lang} page={safePage} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize}
                rangeStart={(safePage - 1) * pageSize + 1} rangeEnd={Math.min(filteredRows.length, safePage * pageSize)} totalRows={filteredRows.length} />
            )}
          </>
        )}

        <p className="text-xs text-[#5c6b57] pb-8 pt-6 text-center">{t.autosaveFooter}</p>
      </div>

      {modal?.kind === "editSite" && (
        <ModalWrap title={t.storageEditSite} onClose={() => setModal(null)}>
          <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.storageSiteNameEn}</label>
          <input value={editNameEn} onChange={(e) => setEditNameEn(e.target.value)} className="w-full mb-3 px-3 py-2 rounded border border-[#2f3b2f]/20 text-sm" />
          <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.storageSiteNameAr}</label>
          <input value={editNameAr} onChange={(e) => setEditNameAr(e.target.value)} className="w-full mb-3 px-3 py-2 rounded border border-[#2f3b2f]/20 text-sm" dir="rtl" />
          <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.storageSiteColor}</label>
          <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-full h-10 mb-4 rounded border border-[#2f3b2f]/20" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded border text-sm">{t.cancel}</button>
            <button type="button" onClick={saveSiteEdit} className="px-4 py-2 rounded text-white text-sm font-semibold" style={{ backgroundColor: "#1f6f8b" }}>{t.save}</button>
          </div>
        </ModalWrap>
      )}

      {modal?.kind === "deleteRow" && (
        <ModalWrap title={t.storageConfirmDeleteRow} onClose={() => setModal(null)}>
          <p className="text-sm text-[#5c6b57] mb-4">{t.storageConfirmDeleteRowBody}</p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded border text-sm">{t.cancel}</button>
            <button type="button" onClick={() => { deleteRow(modal.siteId, modal.rowId); setModal(null); }} className="px-4 py-2 rounded bg-red-600 text-white text-sm font-semibold">{t.delete}</button>
          </div>
        </ModalWrap>
      )}

      {modal?.kind === "takeOut" && (
        <ModalWrap title={t.storageTakeOutTitle} onClose={() => setModal(null)} wide>
          <p className="text-sm font-semibold mb-3">{modal.item || "—"}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.storageBoxes} (max {modal.maxBoxes})</label>
              <input type="number" min={0} max={modal.maxBoxes} value={takeBoxes} onChange={(e) => setTakeBoxes(Number(e.target.value))} className="w-full px-3 py-2 rounded border text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.storagePallets} (max {modal.maxPallets})</label>
              <input type="number" min={0} max={modal.maxPallets} value={takePallets} onChange={(e) => setTakePallets(Number(e.target.value))} className="w-full px-3 py-2 rounded border text-sm" />
            </div>
          </div>
          <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.optionalNote}</label>
          <input value={takeNote} onChange={(e) => setTakeNote(e.target.value)} className="w-full px-3 py-2 rounded border text-sm mb-4" />
          <button type="button" onClick={() => { takeOut(modal.siteId, modal.rowId, takeBoxes, takePallets, takeNote); setModal(null); }} className="w-full py-2 rounded text-white text-sm font-semibold" style={{ backgroundColor: "#6b4fa0" }}>
            {t.storageConfirmTakeOut}
          </button>
        </ModalWrap>
      )}
    </div>
  );
}
