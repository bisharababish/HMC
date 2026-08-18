import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import InventoryApp from "./InventoryApp.jsx";
import { STR } from "./i18n/strings.js";

function NoAccessScreen({ t, dir, onLogout }) {
  return (
    <div dir={dir} className="min-h-screen bg-[#f4f2ec] flex items-center justify-center p-4">
      <div className="max-w-md bg-[#fbfaf5] rounded-xl border border-[#2f3b2f]/10 p-6 text-center">
        <p className="text-[#2f3b2f] mb-4">{t.noWorkbookAccess}</p>
        <button type="button" onClick={onLogout} className="px-4 py-2 rounded text-white text-sm font-semibold" style={{ backgroundColor: "#8a5a2e" }}>
          {t.logout}
        </button>
      </div>
    </div>
  );
}

export default function AppRoot() {
  const { session, profile, authLoading, isAdmin, workbookAccess, login, logout } = useAuth();
  const [lang, setLang] = useState("en");
  const t = STR[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f2ec]">
        <div className="flex items-center gap-2 text-[#2f3b2f]">
          <Loader2 className="animate-spin" size={20} />
          <span>{t.loading}</span>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <LoginScreen onLogin={login} lang={lang} setLang={setLang} />;
  }

  if (!isAdmin && workbookAccess.length === 0) {
    return <NoAccessScreen t={t} dir={dir} onLogout={logout} />;
  }

  return (
    <InventoryApp
      auth={{ profile, isAdmin, workbookAccess, logout }}
      lang={lang}
      setLang={setLang}
    />
  );
}
