import { ChevronDown, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { nameOf } from "../i18n/strings.js";
import { DEFAULT_LOCATIONS, MATERIAL_TYPES, normalizeMeterRef } from "../constants/index.js";

const FALLBACK_LOC = DEFAULT_LOCATIONS.find((l) => l.id === "loc_unassigned") || DEFAULT_LOCATIONS[0];
const FALLBACK_TYPE = MATERIAL_TYPES.find((m) => m.id === "mat_unassigned") || MATERIAL_TYPES[0];

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
  const safe = loc || FALLBACK_LOC;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: safe.color + "1a", color: safe.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: safe.color }} />
      {nameOf(safe.name, lang)}
    </span>
  );
}

export function TypeBadge({ type, lang }) {
  const safe = type || FALLBACK_TYPE;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: safe.color + "1a", color: safe.color }}>
      <Layers size={10} />
      {nameOf(safe.name, lang)}
    </span>
  );
}

export function LocationSelect({ value, locations, lang, onChange, full }) {
  const list = locations?.length ? locations : DEFAULT_LOCATIONS;
  const loc = list.find((l) => l.id === value) || list.find((l) => l.id === "loc_unassigned") || FALLBACK_LOC;
  const rtl = lang === "ar";
  return (
    <div className="relative inline-block">
      <select value={value || "loc_unassigned"} onChange={(e) => onChange(e.target.value)}
        className={`appearance-none text-xs font-semibold ${rtl ? "pr-6 pl-2" : "pl-6 pr-2"} py-1 rounded-full border-0 cursor-pointer outline-none ${full ? "w-full" : ""}`}
        style={{ background: loc.color + "1a", color: loc.color }}>
        {list.map((l) => <option key={l.id} value={l.id}>{nameOf(l.name, lang)}</option>)}
      </select>
      <ChevronDown size={10} className={`absolute ${rtl ? "right-1.5" : "left-1.5"} top-1/2 -translate-y-1/2 pointer-events-none`} style={{ color: loc.color }} />
    </div>
  );
}

export function TypeSelect({ value, lang, onChange }) {
  const type = MATERIAL_TYPES.find((m) => m.id === value) || FALLBACK_TYPE;
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

function optionList(options, current) {
  const nums = options.map(String);
  const cur = current != null && String(current).trim() !== "" ? String(current).trim() : "";
  if (cur && !nums.includes(cur)) nums.unshift(cur);
  return nums;
}

function sortWidthOptions(options) {
  const allNumeric = options.every((o) => !Number.isNaN(Number(o)) && String(o).trim() !== "");
  if (allNumeric) return optionList(options).sort((a, b) => Number(b) - Number(a));
  return optionList(options);
}

export function WidthSelect({ value, options, lang, onChange, className = "" }) {
  if (!options?.length) return null;
  const rtl = lang === "ar";
  const opts = sortWidthOptions(options);
  const label = (w) => {
    if (lang === "ar") {
      if (w === "Matt") return "مات";
      if (w === "Glossy") return "لامع";
    }
    return w;
  };
  return (
    <div className={`relative inline-block w-full min-w-[4.5rem] ${className}`}>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none text-xs font-semibold ${rtl ? "pr-6 pl-2" : "pl-6 pr-2"} py-1.5 rounded border border-[#2f3b2f]/15 bg-white cursor-pointer outline-none focus:border-[#4a6b52]`}>
        {!value && <option value="">{lang === "ar" ? "النوع" : "Finish"}</option>}
        {opts.map((w) => <option key={w} value={w}>{label(w)}</option>)}
      </select>
      <ChevronDown size={10} className={`absolute ${rtl ? "right-1.5" : "left-1.5"} top-1/2 -translate-y-1/2 pointer-events-none text-[#5c6b57]`} />
    </div>
  );
}

export function MetersCodeSelect({ value, options, lang, onChange, className = "" }) {
  if (!options?.length) return null;
  const rtl = lang === "ar";
  const normalized = normalizeMeterRef(value);
  const opts = optionList(options, normalized || value).sort((a, b) => Number(b) - Number(a));
  const selected = opts.find((c) => normalizeMeterRef(c) === normalized || c === value) ?? normalized ?? value ?? "";

  return (
    <div className={`relative inline-block w-full min-w-[4rem] ${className}`}>
      <select value={selected} onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none text-xs font-semibold ${rtl ? "pr-6 pl-2" : "pl-6 pr-2"} py-1.5 rounded border border-[#2f3b2f]/15 bg-white cursor-pointer outline-none focus:border-[#4a6b52]`}>
        {!selected && <option value="">{lang === "ar" ? "متر" : "Meters"}</option>}
        {opts.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <ChevronDown size={10} className={`absolute ${rtl ? "right-1.5" : "left-1.5"} top-1/2 -translate-y-1/2 pointer-events-none text-[#5c6b57]`} />
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

/** Keeps local edit state while focused so parent re-renders do not steal focus. */
export function SheetCellInput({ value, onCommit, type = "text", className, placeholder }) {
  const external = value ?? (type === "number" ? 0 : "");
  const [local, setLocal] = useState(external);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setLocal(external);
  }, [external]);

  const commit = () => {
    if (type === "number") {
      const n = local === "" ? 0 : Number(local);
      if (!Number.isNaN(n) && n !== Number(value ?? 0)) onCommit(n);
      return;
    }
    if (local !== (value ?? "")) onCommit(local);
  };

  return (
    <input
      type={type}
      value={local}
      placeholder={placeholder}
      onFocus={() => { focused.current = true; }}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onChange={(e) => setLocal(type === "number" ? e.target.value : e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={className}
    />
  );
}
