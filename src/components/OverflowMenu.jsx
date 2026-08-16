import { useState, useEffect, useRef } from "react";
import { MoreVertical, Download, Trash2, Columns as ColumnsIcon } from "lucide-react";

export default function OverflowMenu({ t, lang, onExport, onAddColumn, onDeleteSheet }) {
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
