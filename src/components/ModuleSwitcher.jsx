import { Tag, Warehouse } from "lucide-react";

export default function ModuleSwitcher({ active, onChange, t }) {
  const tabs = [
    { id: "labeling", label: t.moduleLabeling, icon: Tag },
    { id: "storages", label: t.moduleStorages, icon: Warehouse },
  ];
  return (
    <div className="flex items-center gap-2 mb-4 p-1 rounded-lg bg-[#e8e4d8] border border-[#2f3b2f]/10 w-fit flex-wrap">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors ${
            active === id
              ? "bg-[#fbfaf5] text-[#2f3b2f] shadow-sm border border-[#2f3b2f]/10"
              : "text-[#5c6b57] hover:text-[#2f3b2f] hover:bg-[#f4f2ec]/60"
          }`}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
}
