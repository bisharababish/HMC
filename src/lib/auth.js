import { supabase } from "./supabase.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    if (/not confirmed|email.*confirm/i.test(error.message || "")) {
      throw new Error("Account not active yet. Ask the owner to re-run supabase/auth.sql in Supabase SQL Editor.");
    }
    throw error;
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, display_name, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMyWorkbookAccess(userId) {
  const { data, error } = await supabase
    .from("workbook_access")
    .select("module_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => r.module_id);
}

export async function fetchWorkbookUsers(moduleId) {
  const { data, error } = await supabase
    .from("workbook_access")
    .select("id, user_id, created_at, profiles(id, email, display_name, role)")
    .eq("module_id", moduleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Create staff login — auto-confirmed via auth.sql trigger, no verification email */
export async function createWorkbookUser(email, password, moduleId) {
  const res = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      data: { role: "user" },
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.msg || body.error_description || body.message || "Could not create user");
  }

  const userId = body.user?.id || body.id;
  if (!userId) throw new Error("User created but no id returned");

  const { error: accessErr } = await supabase
    .from("workbook_access")
    .insert({ user_id: userId, module_id: moduleId });
  if (accessErr) throw accessErr;

  return { id: userId, email: email.trim().toLowerCase() };
}

export async function revokeWorkbookAccess(accessId) {
  const { error } = await supabase.from("workbook_access").delete().eq("id", accessId);
  if (error) throw error;
}

export function isAdmin(profile) {
  return profile?.role === "admin";
}

export function canAccessModule(profile, moduleId, module, accessModuleIds) {
  if (!profile || !module) return false;
  if (isAdmin(profile)) return true;
  if (module.type === "storages") return false;
  if (!module.userAccessEnabled) return false;
  return accessModuleIds.includes(moduleId);
}
