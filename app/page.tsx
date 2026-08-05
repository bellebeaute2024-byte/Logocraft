"use client";

import { useState, useEffect, useCallback } from "react";
import LogoForm from "@/components/LogoForm";
import LogoPreview from "@/components/LogoPreview";
import PricingModal from "@/components/PricingModal";
import { Sparkles, Zap, LogOut, User, History } from "lucide-react";
import { openGoogleLogin } from "@/lib/auth-popup";
import { translations, type Lang } from "@/lib/i18n";

export interface LogoConfig {
  brandName: string;
  tagline: string;
  industry: string;
  style: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

export interface GeneratedLogo {
  url: string;
  prompt: string;
}

interface AuthUser {
  openid: string;
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface HistoryItem {
  id: string;
  brandName: string;
  imageUrls: string[];
  createdAt: string;
}

export default function Home() {
  const [logos, setLogos] = useState<GeneratedLogo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<LogoConfig | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [lang, setLang] = useState<Lang>("en");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const t = translations[lang];
  const isRtl = lang === "ar";

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        const creditsRes = await fetch("/api/user/credits");
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setCredits(creditsData.credits);
        }
      } else {
        setUser(null);
        setCredits(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/user/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchMe();
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "lc:auth-complete") fetchMe();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [fetchMe]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      window.history.replaceState({}, "", "/");
      setTimeout(() => fetchMe(), 2000);
    }
  }, [fetchMe]);

  useEffect(() => {
    if (user && showHistory) fetchHistory();
  }, [user, showHistory, fetchHistory]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCredits(null);
    setLogos([]);
  };

  const handleGenerate = async (config: LogoConfig) => {
    if (!user) { openGoogleLogin(() => fetchMe()); return; }
    setIsGenerating(true);
    setError(null);
    setLastConfig(config);
    try {
      const res = await fetch("/api/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || data.requiresLogin) { openGoogleLogin(() => fetchMe()); setError("Please log in"); return; }
        if (res.status === 402 || data.requiresUpgrade) { setShowPricing(true); setError("You need credits to generate logos."); return; }
        throw new Error(data.error || "Failed to generate logo");
      }
      setLogos(data.logos || []);
      if (typeof data.credits === "number") setCredits(data.credits);
      fetchHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#050505" }} dir={isRtl ? "rtl" : "ltr"}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.8)", backdropFilter: "blur(12px)" }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00FF88 100%)" }}>
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold text-white tracking-tight" translate="no">LogoCraft</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "100px", padding: "4px 12px", color: "#A0A0A0", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
            >
              {t.language}
            </button>

            {!authLoading && (user ? (
              <>
                {/* History button */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: showHistory ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${showHistory ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: "100px", padding: "5px 12px", cursor: "pointer", color: showHistory ? "#00D4FF" : "#A0A0A0", fontSize: "12px", fontWeight: 600 }}
                >
                  <History className="w-3 h-3" />
                  {t.history}
                </button>

                {/* Credits badge */}
                <button
                  onClick={() => setShowPricing(true)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "100px", padding: "5px 12px", cursor: "pointer" }}
                >
                  <Zap className="w-3 h-3" style={{ color: "#00D4FF" }} />
                  <span style={{ color: "#00D4FF", fontSize: "12px", fontWeight: 600 }} translate="no">
                    {credits === -1 ? "∞" : credits ?? "..."} {t.credits}
                  </span>
                </button>

                {/* Avatar + logout */}
                <div className="flex items-center gap-2">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar" style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
                  ) : (
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User className="w-3 h-3" style={{ color: "#666" }} />
                    </div>
                  )}
                  <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", padding: "4px" }} title={t.signOut}>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => openGoogleLogin(() => fetchMe())}
                style={{ background: "#FFFFFF", border: "none", borderRadius: "100px", padding: "7px 16px", fontWeight: 700, fontSize: "13px", cursor: "pointer", color: "#050505" }}
              >
                {t.signIn}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-full mb-6" style={{ border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF", background: "rgba(0,212,255,0.05)" }}>
          <Sparkles className="w-3 h-3" />
          <span>{t.poweredByAI}</span>
        </div>

        <h1 className="text-5xl font-bold mb-4" style={{ letterSpacing: "-2px", lineHeight: 1.1 }}>
          {t.heroTitle1}{" "}
          <span className="gradient-text">{t.heroTitle2}</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "#A0A0A0" }}>{t.heroSubtitle}</p>

        {!user && !authLoading && (
          <div style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "100px", padding: "8px 16px", fontSize: "13px", color: "#00FF88" }}>
            {t.freeCredits}
          </div>
        )}
      </div>

      {/* History panel */}
      {showHistory && user && (
        <div className="max-w-6xl mx-auto px-6 pb-8">
          <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px" }}>
            <h2 style={{ color: "#fff", fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>{t.history}</h2>
            {history.length === 0 ? (
              <p style={{ color: "#555", fontSize: "14px" }}>{t.noHistory}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {history.map((item) => (
                  <div key={item.id} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden", cursor: "pointer" }}
                    onClick={() => {
                      if (item.imageUrls?.[0]) {
                        setLogos(item.imageUrls.map((url) => ({ url, prompt: item.brandName })));
                        setLastConfig({ brandName: item.brandName, tagline: "", industry: "", style: "", primaryColor: "", secondaryColor: "", description: "" });
                        setShowHistory(false);
                      }
                    }}
                  >
                    {item.imageUrls?.[0] && (
                      <img src={item.imageUrls[0]} alt={item.brandName} style={{ width: "100%", height: "100px", objectFit: "contain", background: "#0d0d0d", padding: "8px" }} />
                    )}
                    <div style={{ padding: "8px 10px" }}>
                      <p style={{ color: "#ccc", fontSize: "12px", fontWeight: 600 }} translate="no">{item.brandName}</p>
                      <p style={{ color: "#555", fontSize: "10px", marginTop: "2px" }}>{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          <LogoForm onGenerate={handleGenerate} isGenerating={isGenerating} isLoggedIn={!!user} onLoginClick={() => openGoogleLogin(() => fetchMe())} lang={lang} />
          <LogoPreview logos={logos} isGenerating={isGenerating} error={error} brandName={lastConfig?.brandName} onUpgradeClick={() => setShowPricing(true)} lang={lang} />
        </div>
      </div>

      {showPricing && (
        <PricingModal onClose={() => { setShowPricing(false); fetchMe(); }} userId={user?.openid} userEmail={user?.email ?? undefined} />
      )}
    </div>
  );
}
