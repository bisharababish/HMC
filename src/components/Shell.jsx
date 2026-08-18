import {
  Search, Undo2, Save, Loader2, Languages, HelpCircle, Sparkles, Tag,
  LayoutDashboard, FolderPlus, Plus, PlusCircle, MapPin, AlertTriangle, PackageMinus, X,
} from "lucide-react";
import { nameOf } from "../i18n/strings.js";
import { LocationBadge } from "./ui.jsx";
import ModuleSwitcher from "./ModuleSwitcher.jsx";

export default function Shell({
  t, lang, setLang, title, subtitle, saving, cloudSynced, cloudSavedAt, categories, activeCat, setActiveCat, addCategory, undo, toast, dir,
  globalQuery, setGlobalQuery, globalOpen, setGlobalOpen, globalResults, globalBoxRef, openDetail,
  helpOpen, setHelpOpen, loadError, children,
  moduleSwitcherProps,
}) {
  return (
    <div dir={dir} className="min-h-screen bg-[#f4f2ec] text-[#2f3b2f]" style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}>
      <style>{`
        @keyframes rowGlow {
          0% { background-color: rgba(46,125,70,0.35); box-shadow: 0 0 0 2px rgba(46,125,70,0.5) inset; }
          60% { background-color: rgba(46,125,70,0.22); box-shadow: 0 0 0 2px rgba(46,125,70,0.35) inset; }
          100% { background-color: transparent; box-shadow: 0 0 0 0 rgba(46,125,70,0); }
        }
        .row-flash { animation: rowGlow 2.2s ease-out; }
      `}</style>

      <header className="border-b-2 border-[#2f3b2f]/20 px-6 py-4 sticky top-0 z-20" style={{ backgroundColor: "#eee9dc", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", WebkitTransform: "translateZ(0)", transform: "translateZ(0)", willChange: "transform" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm text-[#5c6b57] mt-0.5">{subtitle}</p> : null}
          </div>

          <div className="relative flex-1 max-w-md" ref={globalBoxRef}>
            <Search size={15} className={`absolute top-1/2 -translate-y-1/2 text-[#5c6b57] ${lang === "ar" ? "right-3" : "left-3"}`} />
            <Sparkles size={13} className={`absolute top-1/2 -translate-y-1/2 text-[#2e7d46] opacity-70 ${lang === "ar" ? "left-3" : "right-3"}`} />
            <input
              value={globalQuery}
              onChange={(e) => { setGlobalQuery(e.target.value); setGlobalOpen(true); }}
              onFocus={() => setGlobalOpen(true)}
              placeholder={t.searchPlaceholder}
              className={`w-full py-2 rounded-lg border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#2e7d46] focus:ring-2 focus:ring-[#2e7d46]/20 ${lang === "ar" ? "pr-9 pl-8" : "pl-9 pr-8"}`}
            />
            {globalOpen && globalQuery.trim() && (
              <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-[#2f3b2f]/15 max-h-72 overflow-y-auto z-40">
                {globalResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[#5c6b57]">{t.noMatches}</div>
                ) : (
                  globalResults.slice(0, 8).map((res, i) => (
                    <button key={i} onClick={() => openDetail(res.catId, res.row.id)}
                      className={`w-full px-4 py-2.5 hover:bg-green-50 border-b border-[#2f3b2f]/5 flex items-center justify-between gap-2 ${lang === "ar" ? "text-right" : "text-left"}`}>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{res.row.values.desc || res.row.values.ref || ""}</div>
                        <div className="text-xs text-[#5c6b57] flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Tag size={10} /> {res.catName} · {res.row.values.qty ?? 0}
                        </div>
                      </div>
                      <LocationBadge loc={res.location} lang={lang} />
                    </button>
                  ))
                )}
                {globalResults.length > 8 && (
                  <div className="px-4 py-2 text-xs text-[#5c6b57] text-center bg-[#f4f2ec]">
                    {lang === "ar" ? `+${globalResults.length - 8} نتيجة أخرى — دقّق البحث` : `+${globalResults.length - 8} more — refine your search`}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded border border-[#2f3b2f]/20 hover:bg-[#f4f2ec]">
              <Languages size={14} /> {t.langToggle}
            </button>
            <button onClick={() => setHelpOpen(true)} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded border border-[#2f3b2f]/20 hover:bg-[#f4f2ec]">
              <HelpCircle size={14} /> {t.help}
            </button>
            <button onClick={undo} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded border border-[#2f3b2f]/20 hover:bg-[#f4f2ec]"><Undo2 size={14} /> {t.undo}</button>
            <div className="text-xs text-[#5c6b57] flex flex-col items-end gap-0.5 whitespace-nowrap">
              <span className="flex items-center gap-1">
                {saving ? (
                  <><Loader2 size={13} className="animate-spin" /> {t.cloudSaving}</>
                ) : cloudSynced ? (
                  <><Save size={13} className="text-[#2e7d46]" /> {t.cloudSaved}</>
                ) : (
                  <><Save size={13} className="text-red-600" /> {t.cloudSaveFailed}</>
                )}
              </span>
              {cloudSynced && cloudSavedAt && (
                <span className="text-[10px] opacity-80">
                  {new Date(cloudSavedAt).toLocaleString(lang === "ar" ? "ar" : "en")}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-5">
        {moduleSwitcherProps && (
          <ModuleSwitcher {...moduleSwitcherProps} />
        )}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <button onClick={() => setActiveCat("__dashboard__")}
            className={`px-4 py-2 rounded-t-md text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${activeCat === "__dashboard__" ? "bg-[#fbfaf5] border-[#8a5a2e] text-[#2f3b2f]" : "bg-transparent border-transparent text-[#5c6b57] hover:text-[#2f3b2f]"}`}>
            <LayoutDashboard size={15} /> {t.dashboardTab}
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`px-4 py-2 rounded-t-md text-sm font-semibold border-b-2 transition-colors ${c.id === activeCat ? "bg-[#fbfaf5] border-[#8a5a2e] text-[#2f3b2f]" : "bg-transparent border-transparent text-[#5c6b57] hover:text-[#2f3b2f]"}`}>
              {nameOf(c.name, lang)}
            </button>
          ))}
          <button onClick={addCategory} className="px-3 py-2 rounded-t-md text-sm font-semibold text-[#8a5a2e] hover:bg-[#eee9dc] flex items-center gap-1">
            <FolderPlus size={16} /> {t.addSheet}
          </button>
        </div>

        {loadError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            {loadError}
          </div>
        )}

        {children}

        <p className="text-xs text-[#5c6b57] pb-8 text-center">{t.autosaveFooter}</p>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50" style={{ backgroundColor: "#2f3b2f" }}>{toast}</div>}

      {helpOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setHelpOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-xl shadow-xl w-full max-w-md border border-[#2f3b2f]/10 overflow-hidden" style={{ backgroundColor: "#fbfaf5", opacity: 1 }}>
            <div className="px-5 py-3.5 border-b border-[#2f3b2f]/10 flex items-center justify-between" style={{ backgroundColor: "#f4f2ec" }}>
              <h3 className="font-bold flex items-center gap-2" style={{ color: "#2f3b2f" }}><HelpCircle size={16} /> {t.helpTitle}</h3>
              <button onClick={() => setHelpOpen(false)} style={{ color: "#2f3b2f" }}><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm" style={{ backgroundColor: "#fbfaf5", color: "#2f3b2f" }}>
              <p className="flex gap-2"><Search size={15} className="shrink-0 mt-0.5 text-[#2e7d46]" /> {t.helpSearch}</p>
              <p className="flex gap-2"><Plus size={15} className="shrink-0 mt-0.5 text-[#8a5a2e]" /> {t.helpQty}</p>
              <p className="flex gap-2"><MapPin size={15} className="shrink-0 mt-0.5 text-[#1f6f8b]" /> {t.helpLocation}</p>
              <p className="flex gap-2"><PackageMinus size={15} className="shrink-0 mt-0.5 text-[#6b4fa0]" /> {t.helpCheckout}</p>
              <p className="flex gap-2"><AlertTriangle size={15} className="shrink-0 mt-0.5 text-[#b23b3b]" /> {t.helpLowStock}</p>
              <p className="flex gap-2"><PlusCircle size={15} className="shrink-0 mt-0.5 text-[#6b4fa0]" /> {t.helpAdd}</p>
            </div>
            <div className="px-5 pb-5" style={{ backgroundColor: "#fbfaf5" }}>
              <button onClick={() => setHelpOpen(false)} className="w-full py-2 rounded text-white text-sm font-semibold" style={{ backgroundColor: "#8a5a2e" }}>{t.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
