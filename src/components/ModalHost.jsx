import { useState, useEffect, useRef } from "react";
import { X, Tag, Minus, Plus, PackageMinus, Clock } from "lucide-react";
import { nameOf, timeAgo } from "../i18n/strings.js";
import { mkCat, parseWidth, normalizeMeterRef, rowTotalMeters, rowMeterSeverity } from "../utils/index.js";
import { isFinishWidthSheet } from "../constants/index.js";
import { LocationSelect } from "./ui.jsx";

function modalKeyOf(modal) {
  if (!modal) return "";
  return `${modal.kind}:${modal.catId ?? ""}:${modal.rowId ?? ""}:${modal.entryId ?? ""}:${modal.locId ?? ""}`;
}

function ModalWrap({ children, title, danger, wide, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`rounded-xl shadow-xl w-full ${wide ? "max-w-lg" : "max-w-sm"} border border-[#2f3b2f]/10 overflow-hidden max-h-[90vh] overflow-y-auto`} style={{ backgroundColor: "#fbfaf5" }}>
        <div className={`px-5 py-3.5 border-b border-[#2f3b2f]/10 sticky top-0 flex items-center justify-between`} style={{ backgroundColor: danger ? "#fef2f2" : "#f4f2ec", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", WebkitTransform: "translateZ(0)", transform: "translateZ(0)", willChange: "transform" }}>
          <h3 className="font-bold" style={{ color: danger ? "#b91c1c" : "#2f3b2f" }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ color: "#5c6b57" }}><X size={16} /></button>
        </div>
        <div className="p-5" style={{ color: "#2f3b2f" }}>{children}</div>
      </div>
    </div>
  );
}

function ModalField({ label, value, onChange, placeholder, inputRef }) {
  return (
    <div className="mb-3">
      <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{label}</label>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#4a6b52]"
      />
    </div>
  );
}

function ModalButtons({ onClose, onConfirm, confirmLabel, danger, disabled, cancelLabel }) {
  return (
    <div className="flex items-center gap-2 justify-end mt-4">
      <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded border" style={{ borderColor: "rgba(47,59,47,0.2)", color: "#2f3b2f" }}>{cancelLabel}</button>
      <button type="button" onClick={onConfirm} disabled={disabled} className="px-3 py-1.5 text-sm rounded font-semibold"
        style={{ backgroundColor: disabled ? "#c9c9c9" : (danger ? "#dc2626" : "#8a5a2e"), color: "#ffffff", opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
        {confirmLabel}
      </button>
    </div>
  );
}

export default function ModalHost({ modal, setModal, t, lang, categories, locations, checkoutLog, setLocations, withHistory, setActiveCat, showToast,
  deleteRowNow, deleteCategoryNow, updateCategory, changeCell, bumpQty, takeOutStock, jumpToResult,
  deleteActivityEntry, saveActivityEdit, clearBackupHistory, clearAllActivity, deleteLocationNow }) {
  const [f1, setF1] = useState("");
  const [f2, setF2] = useState("");
  const [colType, setColType] = useState("text");
  const [numVal, setNumVal] = useState(0);
  const [takeAmt, setTakeAmt] = useState(1);
  const [takeNote, setTakeNote] = useState("");
  const [restoreStock, setRestoreStock] = useState(true);
  const [locColor, setLocColor] = useState("#2e7d46");
  const firstInputRef = useRef(null);
  const modalKey = modalKeyOf(modal);

  useEffect(() => {
    if (!modal) return;
    setF1("");
    setF2("");
    setColType("text");
    setTakeNote("");
    setRestoreStock(true);
    setLocColor("#2e7d46");
    if (modal.kind === "threshold") setNumVal(modal.value ?? 5);
    if (modal.kind === "itemDetail") setTakeAmt(1);
    const id = requestAnimationFrame(() => firstInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [modalKey]);

  useEffect(() => {
    if (modal?.kind !== "editActivity") return;
    const entry = checkoutLog?.find((e) => e.id === modal.entryId);
    if (entry) {
      setTakeAmt(entry.qtyTaken);
      setTakeNote(entry.note || "");
    }
  }, [modalKey, checkoutLog, modal]);

  useEffect(() => {
    if (modal?.kind !== "editLocation") return;
    const loc = locations?.find((l) => l.id === modal.locId);
    if (loc) {
      setF1(loc.name?.en || "");
      setF2(loc.name?.ar || "");
      setLocColor(loc.color || "#2e7d46");
    }
  }, [modalKey, locations, modal]);

  if (!modal) return null;
  const close = () => setModal(null);

  const LocationColorField = () => (
    <div className="mb-3">
      <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.locationColor}</label>
      <input type="color" value={locColor} onChange={(e) => setLocColor(e.target.value)}
        className="w-full h-10 rounded border border-[#2f3b2f]/20 bg-white cursor-pointer" />
    </div>
  );

  if (modal.kind === "addColumn") {
    return (
      <ModalWrap title={t.addColumnTitle} onClose={close}>
        <ModalField inputRef={firstInputRef} label={t.columnNameEn} value={f1} onChange={setF1} placeholder="e.g. Supplier" />
        <ModalField label={t.columnNameAr} value={f2} onChange={setF2} placeholder="مثال: المورد" />
        <div className="mb-2">
          <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.columnType}</label>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1.5"><input type="radio" checked={colType === "text"} onChange={() => setColType("text")} /> {t.typeText}</label>
            <label className="flex items-center gap-1.5"><input type="radio" checked={colType === "number"} onChange={() => setColType("number")} /> {t.typeNumber}</label>
          </div>
        </div>
        <ModalButtons cancelLabel={t.cancel} onClose={close} confirmLabel={t.add} disabled={!f1.trim() && !f2.trim()} onConfirm={() => {
          const key = "col_" + Math.random().toString(36).slice(2, 8);
          updateCategory(modal.catId, (c) => ({
            ...c,
            columns: [...c.columns, { key, label: { en: f1.trim() || f2.trim(), ar: f2.trim() || f1.trim() }, type: colType }],
            rows: c.rows.map((r) => ({ ...r, values: { ...r.values, [key]: colType === "number" ? 0 : "" } })),
          }));
          showToast(t.toastColumnAdded);
          close();
        }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "addLocation") {
    return (
      <ModalWrap title={t.addLocationTitle} onClose={close}>
        <ModalField inputRef={firstInputRef} label={t.locationNameEn} value={f1} onChange={setF1} placeholder="e.g. Warehouse 2" />
        <ModalField label={t.locationNameAr} value={f2} onChange={setF2} placeholder="مثال: المخزن ٢" />
        <LocationColorField />
        <ModalButtons cancelLabel={t.cancel} onClose={close} confirmLabel={t.add} disabled={!f1.trim() && !f2.trim()} onConfirm={() => {
          const palette = ["#2e7d46", "#8a5a2e", "#6b4fa0", "#1f6f8b", "#b23b3b", "#a8842e", "#4a7c8c"];
          setLocations((prev) => [...prev, { id: "loc_" + Math.random().toString(36).slice(2, 8), name: { en: f1.trim() || f2.trim(), ar: f2.trim() || f1.trim() }, color: locColor || palette[prev.length % palette.length] }]);
          showToast(t.toastLocationAdded);
          close();
        }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "editLocation") {
    const loc = locations.find((l) => l.id === modal.locId);
    if (!loc) return null;
    return (
      <ModalWrap title={t.editLocationTitle} onClose={close}>
        <ModalField inputRef={firstInputRef} label={t.locationNameEn} value={f1} onChange={setF1} placeholder="e.g. Warehouse 2" />
        <ModalField label={t.locationNameAr} value={f2} onChange={setF2} placeholder="مثال: المخزن ٢" />
        <LocationColorField />
        <ModalButtons cancelLabel={t.cancel} onClose={close} confirmLabel={t.save} disabled={!f1.trim() && !f2.trim()} onConfirm={() => {
          setLocations((prev) => prev.map((l) => l.id === modal.locId
            ? { ...l, name: { en: f1.trim() || f2.trim(), ar: f2.trim() || f1.trim() }, color: locColor }
            : l));
          showToast(t.toastLocationUpdated);
          close();
        }} />
        {modal.locId !== "loc_unassigned" && (
          <button type="button" onClick={() => setModal({ kind: "confirmDeleteLocation", locId: modal.locId })}
            className="w-full mt-3 py-2 rounded border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50">
            {t.deleteLocation}
          </button>
        )}
      </ModalWrap>
    );
  }

  if (modal.kind === "confirmDeleteLocation") {
    const loc = locations.find((l) => l.id === modal.locId);
    return (
      <ModalWrap title={t.confirmDeleteLocationTitle} danger onClose={close}>
        <p className="text-sm text-[#5c6b57]">{t.confirmDeleteLocationBody}</p>
        {loc && <p className="text-sm font-semibold mt-2">{nameOf(loc.name, lang)}</p>}
        <ModalButtons cancelLabel={t.cancel} onClose={close} danger confirmLabel={t.delete} onConfirm={() => { deleteLocationNow(modal.locId); close(); }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "addSheet") {
    return (
      <ModalWrap title={t.addSheetTitle} onClose={close}>
        <ModalField inputRef={firstInputRef} label={t.sheetNameEn} value={f1} onChange={setF1} placeholder="e.g. Boxes" />
        <ModalField label={t.sheetNameAr} value={f2} onChange={setF2} placeholder="مثال: كراتين" />
        <ModalButtons cancelLabel={t.cancel} onClose={close} confirmLabel={t.add} disabled={!f1.trim() && !f2.trim()} onConfirm={() => {
          const newCat = mkCat(f1.trim() || f2.trim(), f2.trim() || f1.trim(), 5, [["", "", 0, ""]], "mat_unassigned");
          withHistory((prev) => [...prev, newCat]);
          setActiveCat(newCat.id);
          showToast(t.toastSheetAdded);
          close();
        }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "threshold") {
    return (
      <ModalWrap title={t.thresholdTitle} onClose={close}>
        <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.thresholdLabel}</label>
        <input ref={firstInputRef} type="number" min={0} value={numVal} onChange={(e) => setNumVal(Number(e.target.value))}
          className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#4a6b52]" />
        <ModalButtons cancelLabel={t.cancel} onClose={close} confirmLabel={t.save} onConfirm={() => { updateCategory(modal.catId, (c) => ({ ...c, lowStockAt: Math.max(0, numVal) })); close(); }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "confirmDeleteRow") {
    return (
      <ModalWrap title={t.confirmDeleteRowTitle} danger onClose={close}>
        <p className="text-sm text-[#5c6b57]">{t.confirmDeleteRowBody}</p>
        <ModalButtons cancelLabel={t.cancel} onClose={close} danger confirmLabel={t.delete} onConfirm={() => { deleteRowNow(modal.catId, modal.rowId); close(); }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "confirmDeleteSheet") {
    return (
      <ModalWrap title={t.confirmDeleteSheetTitle} danger onClose={close}>
        <p className="text-sm text-[#5c6b57]">{t.confirmDeleteSheetBody}</p>
        <ModalButtons cancelLabel={t.cancel} onClose={close} danger confirmLabel={t.delete} onConfirm={() => { deleteCategoryNow(modal.catId); close(); }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "confirmClearBackups") {
    return (
      <ModalWrap title={t.confirmClearBackupsTitle} danger onClose={close}>
        <p className="text-sm text-[#5c6b57]">{t.confirmClearBackupsBody}</p>
        <ModalButtons cancelLabel={t.cancel} onClose={close} danger confirmLabel={t.clearAllBackups} onConfirm={() => { clearBackupHistory(); close(); }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "confirmClearActivity") {
    return (
      <ModalWrap title={t.confirmClearActivityTitle} danger onClose={close}>
        <p className="text-sm text-[#5c6b57]">{t.confirmClearActivityBody}</p>
        <ModalButtons cancelLabel={t.cancel} onClose={close} danger confirmLabel={t.clearAllActivity} onConfirm={() => { clearAllActivity(); close(); }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "confirmDeleteActivity") {
    const entry = checkoutLog?.find((e) => e.id === modal.entryId);
    return (
      <ModalWrap title={t.confirmDeleteActivityTitle} danger onClose={close}>
        <p className="text-sm text-[#5c6b57] mb-3">{t.confirmDeleteActivityBody}</p>
        {entry && (
          <p className="text-sm font-semibold mb-3">{entry.desc || entry.ref || "—"} · -{entry.qtyTaken}</p>
        )}
        <label className="flex items-center gap-2 text-sm mb-2 cursor-pointer">
          <input type="checkbox" checked={restoreStock} onChange={(e) => setRestoreStock(e.target.checked)} />
          {t.restoreStockLabel}
        </label>
        <ModalButtons cancelLabel={t.cancel} onClose={close} danger confirmLabel={t.delete} onConfirm={() => { deleteActivityEntry(modal.entryId, restoreStock); close(); }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "editActivity") {
    const entry = checkoutLog?.find((e) => e.id === modal.entryId);
    if (!entry) return null;
    return (
      <ModalWrap title={t.editActivityTitle} onClose={close}>
        <p className="text-sm font-semibold mb-3">{entry.desc || entry.ref || "—"} · {entry.catName}</p>
        <div className="mb-3">
          <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.quantityToTake}</label>
          <input ref={firstInputRef} type="number" min={0} value={takeAmt} onChange={(e) => setTakeAmt(Number(e.target.value))}
            className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#4a6b52]" />
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.optionalNote}</label>
          <input value={takeNote} onChange={(e) => setTakeNote(e.target.value)}
            className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#4a6b52]" />
        </div>
        <p className="text-xs text-[#5c6b57] mb-2">{lang === "ar" ? "تغيير الكمية يعدّل المخزون تلقائياً." : "Changing the quantity adjusts stock automatically."}</p>
        <ModalButtons cancelLabel={t.cancel} onClose={close} confirmLabel={t.save} onConfirm={() => { saveActivityEdit(modal.entryId, takeAmt, takeNote); close(); }} />
      </ModalWrap>
    );
  }

  if (modal.kind === "itemDetail") {
    const c = categories.find((cc) => cc.id === modal.catId);
    const r = c?.rows.find((rr) => rr.id === modal.rowId);
    if (!c || !r) return null;
    const qty = Number(r.values.qty) || 0;
    const width = parseWidth(r.values.desc, r.values.ref);
    const finishWidth = isFinishWidthSheet(c);
    const meterCode = normalizeMeterRef(r.values.ref) || r.values.ref || "";
    const totalMeters = rowTotalMeters(r, c);
    const meterSev = rowMeterSeverity(r, c);
    const clampedTake = Math.max(1, Math.min(takeAmt || 1, Math.max(1, qty)));
    const finishLabel = (v) => {
      if (lang === "ar" && v === "Matt") return "مات";
      if (lang === "ar" && v === "Glossy") return "لامع";
      return v;
    };

    return (
      <ModalWrap title={t.itemDetails} wide onClose={close}>
        <div className="mb-4">
          <div className="text-xs text-[#5c6b57] mb-1 flex items-center gap-1"><Tag size={11} /> {nameOf(c.name, lang)}</div>
          <div className="text-lg font-bold">{finishWidth ? finishLabel(r.values.desc) || "—" : (r.values.desc || "—")}</div>
          {(finishWidth ? (r.values.desc || meterCode || qty > 0) : (width > 0 || qty > 0)) && (
            <div className="text-xs text-[#5c6b57] mt-1">
              {finishWidth ? (
                <>
                  {finishLabel(r.values.desc) || "—"}
                  {meterCode ? ` · ${lang === "ar" ? "متر" : "Meters"} ${meterCode}` : ""}
                  {" · "}{lang === "ar" ? "الكمية" : "Qty"} {qty}
                </>
              ) : (
                <>
                  {qty} × {width.toLocaleString()} {lang === "ar" ? "عرض" : "width"}
                  {meterCode ? ` · ${lang === "ar" ? "رمز" : "code"} ${meterCode}` : ""}
                  {" = "}<span className="font-semibold">{totalMeters.toLocaleString()} {lang === "ar" ? "م كلي" : "m total"}</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.location}</label>
          <LocationSelect value={r.values.location} locations={locations} lang={lang} onChange={(v) => changeCell(c.id, r.id, "location", v)} full />
        </div>

        <div className={`rounded-lg border p-3 mb-4 flex items-center justify-between ${meterSev === "low" || meterSev === "out" ? "border-red-200 bg-red-50" : meterSev === "critical" ? "border-amber-300 bg-amber-50" : "border-[#2f3b2f]/10 bg-[#f4f2ec]"}`}>
          <div>
            <div className="text-xs text-[#5c6b57]">{t.availableQty}</div>
            <div className={`text-2xl font-bold ${meterSev ? "text-red-700" : "text-[#2f3b2f]"}`}>{qty}</div>
            {r.values.ref && !finishWidth && (
              <div className={`text-sm mt-1 font-semibold ${meterSev === "critical" ? "text-amber-800" : meterSev ? "text-red-700" : "text-[#5c6b57]"}`}>
                {lang === "ar" ? "إجمالي الأمتار" : "Total meters"}: {totalMeters.toLocaleString()}
              </div>
            )}
            {finishWidth && meterCode && (
              <div className="text-sm mt-1 text-[#5c6b57]">
                {lang === "ar" ? "متر" : "Meters"}: {meterCode}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => bumpQty(c.id, r.id, -1)} className="w-8 h-8 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"><Minus size={14} /></button>
            <button type="button" onClick={() => bumpQty(c.id, r.id, 1)} className="w-8 h-8 flex items-center justify-center rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"><Plus size={14} /></button>
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
          <button type="button" disabled={qty <= 0} onClick={() => { takeOutStock(c.id, r.id, clampedTake, takeNote); close(); }}
            className="w-full py-2 rounded text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ backgroundColor: qty <= 0 ? "#c9c9c9" : "#6b4fa0", color: "#ffffff", opacity: qty <= 0 ? 0.6 : 1, cursor: qty <= 0 ? "not-allowed" : "pointer" }}>
            <PackageMinus size={15} /> {t.confirmTakeout}
          </button>
        </div>

        <button type="button" onClick={() => { jumpToResult(c.id, r.id); }} className="w-full mt-1 py-2 rounded border border-[#2f3b2f]/20 text-sm hover:bg-[#f4f2ec]">
          {t.goToItem}
        </button>
      </ModalWrap>
    );
  }

  return null;
}
