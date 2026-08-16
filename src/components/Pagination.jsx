import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ t, lang, page, totalPages, setPage, pageSize, setPageSize, rangeStart, rangeEnd, totalRows }) {
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
