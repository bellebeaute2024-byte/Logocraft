"use client";

import { useState, useEffect, useCallback } from "react";
import LogoForm from "@/components/LogoForm";
import LogoPreview from "@/components/LogoPreview";
import PricingModal from "@/components/PricingModal";
import { Sparkles, Zap, LogOut, User } from "lucide-react";
import { openHappySeedsLogin } from "@/lib/auth-popup";

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

export default function Home() {
  const [logos, setLogos] = useState<GeneratedLogo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<LogoConfig | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [showPricing, setShowPricing] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setCsrfToken(data.csrf_token || "");
        // Fetch credits
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

  useEffect(() => {
    fetchMe();

    // Listen for auth completion from popup
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "happyseeds:auth-complete") {
        fetchMe();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [fetchMe]);

  // Check for payment success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      window.history.replaceState({}, "", "/");
      setTimeout(() => fetchMe(), 2000); // Give webhook time to process
    }
  }, [fetchMe]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "x-csrf-token": csrfToken },
    });
    setUser(null);
    setCredits(null);
    setLogos([]);
  };

  const handleGenerate = async (config: LogoConfig) => {
    if (!user) {
      openHappySeedsLogin();
      return;
    }

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
        if (res.status === 401 || data.requiresLogin) {
          openHappySeedsLogin();
          setError("Please log in to generate logos");
          return;
        }
        if (res.status === 402 || data.requiresUpgrade) {
          setShowPricing(true);
          setError("You need credits to generate logos.");
          return;
        }
        throw new Error(data.error || "Failed to generate logo");
      }

      setLogos(data.logos || []);
      if (typeof data.credits === "number") {
        setCredits(data.credits);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#050505" }}>
      {/* Nav */}
      <nav
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5,5,5,0.8)",
          backdropFilter: "blur(12px)",
        }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00FF88 100%)" }}
            >
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold text-white tracking-tight">LogoCraft</span>
          </div>

          <div className="flex items-center gap-3">
            {!authLoading && (
              user ? (
                <>
                  {/* Credits badge */}
                  <button
                    onClick={() => setShowPricing(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(0,212,255,0.08)",
                      border: "1px solid rgba(0,212,255,0.2)",
                      borderRadius: "100px",
                      padding: "5px 12px",
                      cursor: "pointer",
                      transition: "all 200ms ease",
                    }}
                  >
                    <Zap className="w-3 h-3" style={{ color: "#00D4FF" }} />
                    <span style={{ color: "#00D4FF", fontSize: "12px", fontWeight: 600 }}>
                      {credits === -1 ? "∞" : credits ?? "..."} credits
                    </span>
                  </button>

                  {/* User avatar */}
                  <div className="flex items-center gap-2">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="avatar"
                        style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                    ) : (
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <User className="w-3 h-3" style={{ color: "#666" }} />
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#666",
                        display: "flex",
                        alignItems: "center",
                        padding: "4px",
                      }}
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => openHappySeedsLogin()}
                  style={{
                    background: "#FFFFFF",
                    border: "none",
                    borderRadius: "100px",
                    padding: "7px 16px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    color: "#050505",
                  }}
                >
                  Sign in
                </button>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
          style={{
            border: "1px solid rgba(0,212,255,0.3)",
            color: "#00D4FF",
            background: "rgba(0,212,255,0.05)",
          }}
        >
          <Sparkles className="w-3 h-3" />
          <span>Powered by AI</span>
        </div>

        <h1
          className="text-5xl font-bold mb-4"
          style={{ letterSpacing: "-2px", lineHeight: 1.1 }}
        >
          Create stunning logos for your{" "}
          <span className="gradient-text">brand</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "#A0A0A0" }}>
          Describe your brand, pick a style, and let AI generate professional logo concepts in seconds.
        </p>

        {!user && !authLoading && (
          <div
            style={{
              marginTop: "16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0,255,136,0.05)",
              border: "1px solid rgba(0,255,136,0.2)",
              borderRadius: "100px",
              padding: "8px 16px",
              fontSize: "13px",
              color: "#00FF88",
            }}
          >
            🎁 Sign in to get 2 free logo generations
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left: Form */}
          <LogoForm
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            isLoggedIn={!!user}
            onLoginClick={() => openHappySeedsLogin()}
          />

          {/* Right: Preview */}
          <LogoPreview
            logos={logos}
            isGenerating={isGenerating}
            error={error}
            brandName={lastConfig?.brandName}
            onUpgradeClick={() => setShowPricing(true)}
          />
        </div>
      </div>

      {/* Pricing modal */}
      {showPricing && (
        <PricingModal
          onClose={() => {
            setShowPricing(false);
            fetchMe(); // Refresh credits after modal closes
          }}
          userId={user?.openid}
          userEmail={user?.email ?? undefined}
        />
      )}
    </div>
  );
}
