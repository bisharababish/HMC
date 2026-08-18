import { useState } from "react";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { createWorkbookUser, revokeWorkbookAccess } from "../lib/auth.js";

export default function WorkbookUsersPanel({ t, lang, moduleId, users, onRefresh, showToast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const addUser = async () => {
    if (!email.trim() || password.length < 6) {
      showToast(t.userAccountFieldsRequired);
      return;
    }
    setBusy(true);
    try {
      await createWorkbookUser(email, password, moduleId);
      setEmail("");
      setPassword("");
      await onRefresh();
      showToast(t.userAccountCreated);
    } catch (e) {
      showToast(e.message || t.userAccountCreateFailed);
    } finally {
      setBusy(false);
    }
  };

  const removeUser = async (accessId) => {
    setBusy(true);
    try {
      await revokeWorkbookAccess(accessId);
      await onRefresh();
      showToast(t.userAccessRevoked);
    } catch {
      showToast(t.userAccountCreateFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#2f3b2f]/15">
      <h4 className="text-sm font-bold mb-2">{t.workbookUsersTitle}</h4>
      <p className="text-xs text-[#5c6b57] mb-3">{t.workbookUsersHint}</p>

      <div className="space-y-2 mb-4">
        <label className="text-xs font-semibold text-[#5c6b57] block">{t.loginEmail}</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 text-sm" placeholder="staff@company.com" />
        <label className="text-xs font-semibold text-[#5c6b57] block">{t.loginPassword}</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full px-3 py-2 rounded border border-[#2f3b2f]/20 text-sm" placeholder={t.userPasswordHint} />
        <button type="button" disabled={busy} onClick={addUser}
          className="w-full py-2 rounded text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
          style={{ backgroundColor: "#4a6b52" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          {t.createUserAccount}
        </button>
      </div>

      {users.length === 0 ? (
        <p className="text-xs text-[#5c6b57]">{t.noWorkbookUsers}</p>
      ) : (
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {users.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 text-sm bg-[#f4f2ec] rounded px-3 py-2">
              <span className="truncate">{row.profiles?.email || "—"}</span>
              <button type="button" disabled={busy} onClick={() => removeUser(row.id)} className="text-red-600 hover:text-red-800 shrink-0" title={t.revokeAccess}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
