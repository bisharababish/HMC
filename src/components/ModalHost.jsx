import { useState, useEffect } from "react";
import { X, Tag, Minus, Plus, PackageMinus, Clock } from "lucide-react";
import { nameOf, timeAgo } from "../i18n/strings.js";
import { mkCat } from "../utils/index.js";
import { LocationSelect, TypeSelect } from "./ui.jsx";

export default function ModalHost({ modal, setModal, t, lang, categories, locations, setLocations, withHistory, setActiveCat, showToast,
  deleteRowNow, deleteCategoryNow, updateCategory, changeCell, bumpQty, takeOutStock, jumpToResult }) {
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
          <div className="text-lg font-bold">{r.values.desc || r.values.ref || ""}</div>
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
