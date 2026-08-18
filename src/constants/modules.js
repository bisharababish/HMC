import { rid } from "../utils/index.js";
import { DEFAULT_LOCATIONS, normalizeLocations } from "./index.js";
import { seedStorageSites, normalizeStorageSites, normalizeStorageLog } from "./storages.js";
import { seedCategories } from "../utils/index.js";

export const MODULE_TYPES = {
  labeling: { id: "labeling", icon: "tag" },
  storages: { id: "storages", icon: "warehouse" },
};

export const DEFAULT_MODULES = () => [
  {
    id: "mod_labeling",
    type: "labeling",
    name: { en: "Labeling Storage", ar: "مخزون الملصقات" },
    color: "#8a5a2e",
  },
  {
    id: "mod_storages",
    type: "storages",
    name: { en: "HMC Storages", ar: "مخازن HMC" },
    color: "#1f6f8b",
  },
];

export function createEmptyModuleData(type) {
  if (type === "storages") {
    return { sites: seedStorageSites(), log: [] };
  }
  return {
    categories: [],
    locations: DEFAULT_LOCATIONS,
    checkoutLog: [],
  };
}

export function createModule(type, nameEn, nameAr, color) {
  const palette = type === "storages" ? "#1f6f8b" : "#8a5a2e";
  return {
    id: "mod_" + rid().slice(2),
    type,
    name: { en: nameEn.trim() || (type === "storages" ? "HMC Storages" : "Labeling Storage"), ar: nameAr.trim() || nameEn.trim() || "" },
    color: color || palette,
  };
}

/** Migrate legacy flat app_state → modules + moduleData */
export function normalizeAppState(parsed) {
  const lang = parsed.lang === "ar" ? "ar" : "en";
  let modules = Array.isArray(parsed.modules) && parsed.modules.length > 0 ? parsed.modules : null;
  let moduleData = parsed.moduleData && typeof parsed.moduleData === "object" ? { ...parsed.moduleData } : {};
  let activeModuleId = parsed.activeModuleId || null;

  if (!modules) {
    modules = DEFAULT_MODULES();
    const labelingId = modules[0].id;
    const storagesId = modules[1].id;
    const cats = parsed.categories ?? (Array.isArray(parsed) ? parsed : null);
    moduleData[labelingId] = {
      categories: Array.isArray(cats) ? cats : seedCategories(),
      locations: normalizeLocations(parsed.locations),
      checkoutLog: parsed.checkoutLog || [],
    };
    moduleData[storagesId] = {
      sites: normalizeStorageSites(parsed.storageSites),
      log: normalizeStorageLog(parsed.storageLog),
    };
    if (parsed.activeModule === "storages") activeModuleId = storagesId;
    else activeModuleId = labelingId;
  }

  modules = modules.map((m, i) => {
    const def = DEFAULT_MODULES()[i] || DEFAULT_MODULES()[0];
    return {
      id: m.id || def.id,
      type: m.type === "storages" ? "storages" : "labeling",
      name: {
        en: m.name?.en?.trim() || def.name.en,
        ar: m.name?.ar?.trim() || def.name.ar,
      },
      color: m.color || def.color,
    };
  });

  modules.forEach((m) => {
    if (!moduleData[m.id]) moduleData[m.id] = createEmptyModuleData(m.type);
    if (m.type === "labeling") {
      const d = moduleData[m.id];
      moduleData[m.id] = {
        categories: Array.isArray(d.categories) ? d.categories : [],
        locations: normalizeLocations(d.locations),
        checkoutLog: d.checkoutLog || [],
      };
    } else {
      const d = moduleData[m.id];
      moduleData[m.id] = {
        sites: normalizeStorageSites(d.sites),
        log: normalizeStorageLog(d.log),
      };
    }
  });

  if (!activeModuleId || !modules.some((m) => m.id === activeModuleId)) {
    activeModuleId = modules[0].id;
  }

  return { modules, moduleData, activeModuleId, lang };
}

export function buildPersistPayload({
  modules,
  activeModuleId,
  moduleData,
  categories,
  locations,
  checkoutLog,
  storageSites,
  storageLog,
  lang,
}) {
  const data = { ...(moduleData || {}) };
  const active = modules.find((m) => m.id === activeModuleId);
  if (active?.type === "labeling") {
    data[activeModuleId] = {
      categories,
      locations: normalizeLocations(locations),
      checkoutLog,
    };
  } else if (active?.type === "storages") {
    data[activeModuleId] = {
      sites: storageSites,
      log: storageLog,
    };
  }
  return { modules, activeModuleId, moduleData: data, lang };
}

export function applyLabelingData(data, setters) {
  setters.setCategories(Array.isArray(data?.categories) ? data.categories : []);
  setters.setLocations(normalizeLocations(data?.locations));
  setters.setCheckoutLog(data?.checkoutLog || []);
  setters.setActiveCat("__dashboard__");
}

export function applyStorageData(data, setters) {
  setters.setStorageSites(normalizeStorageSites(data?.sites));
  setters.setStorageLog(normalizeStorageLog(data?.log));
}

/** On first load, fill both labeling + storage runtime state so the app never stalls on loading. */
export function hydrateInitialModuleState(normalized, setters, swapPlastic) {
  const { modules, moduleData, activeModuleId } = normalized;
  const active = modules.find((m) => m.id === activeModuleId) || modules[0];
  const labelingMod = modules.find((m) => m.type === "labeling");
  const storagesMod = modules.find((m) => m.type === "storages");

  if (labelingMod) {
    const d = { ...moduleData[labelingMod.id] };
    if (swapPlastic && d.categories) d.categories = swapPlastic(d.categories);
    applyLabelingData(d, setters);
  }
  if (storagesMod) {
    applyStorageData(moduleData[storagesMod.id], setters);
  }

  if (active?.type === "labeling" && active.id !== labelingMod?.id) {
    const d = { ...moduleData[active.id] };
    if (swapPlastic && d.categories) d.categories = swapPlastic(d.categories);
    applyLabelingData(d, setters);
  } else if (active?.type === "storages" && active.id !== storagesMod?.id) {
    applyStorageData(moduleData[active.id], setters);
  }
}
