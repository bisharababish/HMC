import { useState } from "react";
import { Loader2, Lock, LogIn } from "lucide-react";
import { STR } from "../i18n/strings.js";

export default function LoginScreen({ onLogin, lang, setLang }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = STR[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError(t.loginMissingFields);
      return;
    }
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#f4f2ec] text-[#2f3b2f] flex items-center justify-center p-4" style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}>
      <div className="w-full max-w-md bg-[#fbfaf5] rounded-xl shadow-lg border border-[#2f3b2f]/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-[#2f3b2f]/10 bg-[#eee9dc]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{t.appTitle}</h1>
            </div>
            <Lock size={28} className="text-[#8a5a2e] shrink-0" />
          </div>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.loginEmail}</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#4a6b52]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5c6b57] mb-1 block">{t.loginPassword}</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded border border-[#2f3b2f]/20 bg-white text-sm outline-none focus:border-[#4a6b52]"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: "#8a5a2e" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {t.loginButton}
          </button>

          <div className="flex justify-center pt-2">
            <button type="button" onClick={() => setLang(lang === "en" ? "ar" : "en")} className="text-xs text-[#5c6b57] hover:text-[#2f3b2f] underline">
              {t.langToggle}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
