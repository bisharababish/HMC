import { Tag, Warehouse, Plus, Pencil } from "lucide-react";
import { nameOf } from "../i18n/strings.js";

const ICONS = { labeling: Tag, storages: Warehouse };

export default function ModuleSwitcher({
  modules,
  activeModuleId,
  onChange,
  onAdd,
  onEdit,
  lang,
  t,
}) {
  return (
    <div className="flex items-center gap-2 mb-4 p-1 rounded-lg bg-[#e8e4d8] border border-[#2f3b2f]/10 flex-wrap">
      {modules.map((mod) => {
        const Icon = ICONS[mod.type] || Tag;
        const active = mod.id === activeModuleId;
        return (
          <div key={mod.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onChange(mod.id)}
              className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors ${
                active
                  ? "bg-[#fbfaf5] text-[#2f3b2f] shadow-sm border border-[#2f3b2f]/10"
                  : "text-[#5c6b57] hover:text-[#2f3b2f] hover:bg-[#f4f2ec]/60"
              }`}
            >
              <Icon size={16} style={active ? { color: mod.color } : undefined} />
              {nameOf(mod.name, lang)}
            </button>
            {active && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(mod.id)}
                title={t.editModule}
                className="ml-0.5 p-1.5 rounded text-[#5c6b57] hover:text-[#1f6f8b] hover:bg-[#f4f2ec]"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
        );
      })}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-1.5 text-[#8a5a2e] hover:bg-[#f4f2ec]/80"
        >
          <Plus size={16} /> {t.addModule}
        </button>
      )}
    </div>
  );
}
