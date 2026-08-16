import { ChevronDown, Layers } from "lucide-react";
import { nameOf } from "../i18n/strings.js";
import { MATERIAL_TYPES } from "../constants/index.js";

export function Panel({ icon, title, children }) {
  return (
    <div className="bg-[#fbfaf5] rounded-lg shadow-sm border border-[#2f3b2f]/10 overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-[#2f3b2f]/10 bg-[#f4f2ec] flex items-center gap-2">
        {icon}<h2 className="font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function LocationBadge({ loc, lang }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: loc.color + "1a", color: loc.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: loc.color }} />
      {nameOf(loc.name, lang)}
    </span>
  );
}

export function TypeBadge({ type, lang }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: type.color + "1a", color: type.color }}>
      <Layers size={10} />
      {nameOf(type.name, lang)}
    </span>
  );
}

export function LocationSelect({ value, locations, lang, onChange, full }) {
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

export function TypeSelect({ value, lang, onChange }) {
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

export function StatCard({ label, value, accent, onClick, hint }) {
  return (
    <div onClick={onClick} className={`bg-[#fbfaf5] rounded-lg border border-[#2f3b2f]/10 px-5 py-4 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}>
      <div className="text-xs text-[#5c6b57] mb-1">{label}</div>
      <div className="text-3xl font-bold" style={{ color: accent }}>{value}</div>
      {hint && <div className="text-[10px] text-[#5c6b57] mt-1">{hint}</div>}
    </div>
  );
}
