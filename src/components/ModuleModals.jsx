import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

function ModalWrap({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="rounded-xl shadow-xl w-full max-w-md border border-[#2f3b2f]/10 overflow-hidden bg-[#fbfaf5]">
        <div className="px-5 py-3.5 border-b border-[#2f3b2f]/10 flex items-center justify-between bg-[#f4f2ec]">
          <h3 className="font-bold">{title}</h3>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function ModuleModals({ modal, setModal, t, onSave, onDelete }) {
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [color, setColor] = useState("#8a5a2e");
  const [moduleType, setModuleType] = useState("labeling");
  const firstRef = useRef(null);

  useEffect(() => {
    if (!modal) return;
    if (modal.kind === "addModule") {
      setNameEn("");
      setNameAr("");
      setColor("#8a5a2e");
      setModuleType("labeling");
    }
    if (modal.kind === "editModule" && modal.module) {
      setNameEn(modal.module.name?.en || "");
      setNameAr(modal.module.name?.ar || "");
      setColor(modal.module.color || "#8a5a2e");
    }
    firstRef.current?.focus();
  }, [modal]);

  if (!modal) return null;

  if (modal.kind === "confirmDeleteModule") {
    return (
      <ModalWrap title={t.confirmDeleteModuleTitle} onClose={() => setModal(null)}>
        <p className="text-sm text-[#5c6b57] mb-4">{t.confirmDeleteModuleBody}</p>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded border text-sm">{t.cancel}</button>
          <button type="button" onClick={() => { onDelete(modal.moduleId); setModal(null); }} className="px-4 py-2 rounded bg-red-600 text-white text-sm font-semibold">{t.delete}</button>
        </div>
      </ModalWrap>
    );
  }

  if (modal.kind === "addModule" || modal.kind === "editModule") {
    const isEdit = modal.kind === "editModule";
    return (
      <ModalWrap title={isEdit ? t.editModuleTitle : t.addModuleTitle} onClose={() => setModal(null)}>
        {!isEdit && (
          <div className="mb-3">
            <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.moduleTypeLabel}</label>
            <select value={moduleType} onChange={(e) => { setModuleType(e.target.value); setColor(e.target.value === "storages" ? "#1f6f8b" : "#8a5a2e"); }}
              className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 bg-white text-sm">
              <option value="labeling">{t.moduleTypeLabeling}</option>
              <option value="storages">{t.moduleTypeStorages}</option>
            </select>
          </div>
        )}
        {isEdit && modal.module && (
          <p className="text-xs text-[#5c6b57] mb-3">
            {modal.module.type === "storages" ? t.moduleTypeStorages : t.moduleTypeLabeling}
          </p>
        )}
        <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.moduleNameEn}</label>
        <input ref={firstRef} value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full mb-3 px-3 py-2 rounded border border-[#2f3b2f]/20 text-sm" />
        <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.moduleNameAr}</label>
        <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="w-full mb-3 px-3 py-2 rounded border border-[#2f3b2f]/20 text-sm" dir="rtl" />
        <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.moduleColor}</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 mb-4 rounded border border-[#2f3b2f]/20" />
        <div className="flex gap-2 justify-between flex-wrap">
          <div>
            {isEdit && (
              <button type="button" onClick={() => setModal({ kind: "confirmDeleteModule", moduleId: modal.module.id })} className="px-3 py-1.5 text-sm text-red-600 hover:underline">{t.deleteModule}</button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded border text-sm">{t.cancel}</button>
            <button type="button" onClick={() => { onSave(isEdit ? { kind: "edit", moduleId: modal.module.id, nameEn, nameAr, color } : { kind: "add", type: moduleType, nameEn, nameAr, color }); setModal(null); }}
              className="px-4 py-2 rounded text-white text-sm font-semibold" style={{ backgroundColor: color }}>
              {isEdit ? t.save : t.add}
            </button>
          </div>
        </div>
      </ModalWrap>
    );
  }

  return null;
}
