import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_LOCATIONS } from "../src/constants/index.js";

function loadEnv() {
  const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const get = (key) => text.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim();
  return { url: get("VITE_SUPABASE_URL"), key: get("VITE_SUPABASE_ANON_KEY") };
}

const { url, key } = loadEnv();
if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const sb = createClient(url, key);

const { count: backupCount, error: delErr } = await sb
  .from("change_log")
  .delete({ count: "exact" })
  .neq("id", "00000000-0000-0000-0000-000000000000");

if (delErr) {
  console.error("Failed to delete backups:", delErr.message);
  process.exit(1);
}

const { data: current, error: getErr } = await sb
  .from("app_state")
  .select("data")
  .eq("id", "main")
  .maybeSingle();

if (getErr) {
  console.error("Failed to read app_state:", getErr.message);
  process.exit(1);
}

const prev = current?.data ?? {};
const next = {
  categories: Array.isArray(prev.categories) ? prev.categories : [],
  locations: Array.isArray(prev.locations) && prev.locations.length > 0 ? prev.locations : DEFAULT_LOCATIONS,
  checkoutLog: [],
  lang: prev.lang === "ar" ? "ar" : "en",
};

const { error: upsertErr } = await sb.from("app_state").upsert({
  id: "main",
  data: next,
  updated_at: new Date().toISOString(),
});

if (upsertErr) {
  console.error("Failed to update app_state:", upsertErr.message);
  process.exit(1);
}

console.log(`Removed ${backupCount ?? 0} backup snapshot(s) from change_log.`);
console.log("Cleared Recent Activity (checkoutLog). Kept your current sheets and locations.");
console.log("Refresh the app in your browser.");
