import { supabase, isSupabaseEnabled } from "./supabase.js";
import { STORAGE_KEY } from "../constants/index.js";

async function cloudGet() {
  const { data, error } = await supabase
    .from("app_state")
    .select("data, updated_at")
    .eq("id", "main")
    .maybeSingle();
  if (error) throw error;
  if (!data?.data) return null;
  return { value: JSON.stringify(data.data), updated_at: data.updated_at };
}

async function cloudSet(value) {
  const parsed = JSON.parse(value);
  const updatedAt = new Date().toISOString();
  const { error: upsertErr } = await supabase.from("app_state").upsert({
    id: "main",
    data: parsed,
    updated_at: updatedAt,
  });
  if (upsertErr) throw upsertErr;
  const { error: logErr } = await supabase.from("change_log").insert({ data: parsed });
  if (logErr) throw logErr;
  return updatedAt;
}

let lastSaveOk = false;

export function wasLastSaveCloud() {
  return lastSaveOk;
}

export async function fetchBackupHistory(limit = 15) {
  if (!isSupabaseEnabled()) return [];
  const { data, error } = await supabase
    .from("change_log")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}

export async function loadBackupSnapshot(id) {
  if (!isSupabaseEnabled()) return null;
  const { data, error } = await supabase
    .from("change_log")
    .select("data")
    .eq("id", id)
    .maybeSingle();
  if (error || !data?.data) return null;
  return data.data;
}

export async function clearAllBackups() {
  if (!isSupabaseEnabled()) return 0;
  const { count, error } = await supabase
    .from("change_log")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
  return count ?? 0;
}

/** One-time: push old browser data to Supabase, then clear local storage */
async function migrateLocalToCloudOnce() {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    const localLang = localStorage.getItem("stock-ledger-lang");
    if (!local && !localLang) return;

    const cloud = await cloudGet();
    let cloudEmpty = true;
    if (cloud?.value) {
      const parsed = JSON.parse(cloud.value);
      cloudEmpty = !(parsed.categories?.length > 0);
    }

    if (local && cloudEmpty) {
      let payload = JSON.parse(local);
      if (localLang && !payload.lang) payload.lang = localLang;
      await cloudSet(JSON.stringify(payload));
    } else if (localLang && cloud?.value) {
      const parsed = JSON.parse(cloud.value);
      if (!parsed.lang) {
        parsed.lang = localLang;
        await cloudSet(JSON.stringify(parsed));
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("stock-ledger-lang");
    localStorage.removeItem(`${STORAGE_KEY}-updated`);
  } catch (e) {
    console.warn("Local migration skipped", e);
  }
}

function initStorage() {
  window.storage = {
    async get(key) {
      if (!isSupabaseEnabled()) {
        throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
      }
      if (key !== STORAGE_KEY) return null;

      await migrateLocalToCloudOnce();
      const cloud = await cloudGet();
      if (!cloud) return null;
      lastSaveOk = true;
      return { value: cloud.value, updated_at: cloud.updated_at };
    },

    async set(key, value) {
      if (!isSupabaseEnabled()) {
        throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
      }
      if (key !== STORAGE_KEY) return null;

      const savedAt = await cloudSet(value);
      lastSaveOk = true;
      return savedAt;
    },
  };
}

initStorage();
