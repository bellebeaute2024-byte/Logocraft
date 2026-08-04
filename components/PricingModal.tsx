"use client";

import { useState } from "react";
import { X, Sparkles, Check, Zap } from "lucide-react";
import { initializePaddle } from "@paddle/paddle-js";

interface Props {
  onClose: () => void;
  userId?: string;
  userEmail?: string;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter Pack",
    price: 5,
    credits: 10,
    type: "one_time" as const,
    priceId: "pri_01kytv54kjq5ghe3xhjda43mq8",
    features: ["10 logo generations", "2 variations each", "Full quality download", "No expiry"],
    badge: null,
    color: "#A0A0A0",
  },
  {
    id: "pro",
    name: "Pro Pack",
    price: 12,
    credits: 30,
    type: "one_time" as const,
    priceId: "pri_01kyw39cr0e9gbzr7tvpdyrt7q",
    features: ["30 logo generations", "2 variations each", "Full quality download", "No expiry"],
    badge: "Popular",
    color: "#00D4FF",
  },
  {
    id: "growth",
    name: "Growth Pack",
    price: 25,
    credits: 75,
    type: "one_time" as const,
    priceId: "pri_01kywbkj1rpqf13ccq9tkct19j",
    features: ["75 logo generations", "2 variations each", "Full quality download", "No expiry"],
    badge: "Best Value",
    color: "#00FF88",
  },
  {
    id: "basic",
    name: "Basic Plan",
    price: 9,
    credits: 50,
    type: "subscription" as const,
    priceId: "pri_01kywc0272dgymekhr8pxpz2v5",
    features: ["50 logos/month", "2 variations each", "Full quality download", "Monthly renewal"],
    badge: null,
    color: "#7C3AED",
  },
  {
    id: "unlimited",
    name: "Unlimited Plan",
    price: 29,
    credits: -1,
    type: "subscription" as const,
    priceId: "pri_01kywc9v5f4r1nratwfde1wx6w",
    features: ["Unlimited logos/month", "2 variations each", "Full quality download", "Priority generation"],
    badge: "Pro",
    color: "#F59E0B",
  },
];

export default function PricingModal({ onClose, userId, userEmail }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<"packs" | "subscriptions">("packs");

  const handleBuy = async (plan: typeof PLANS[0]) => {
    setLoading(plan.id);
    try {
      const paddle = await initializePaddle({
        token: "live_5a43d0eae58afbae84266363cd0",
        environment: "production",
      });

      if (!paddle) {
        alert("Payment system failed to load. Please try again.");
        setLoading(null);
        return;
      }

      paddle.Checkout.open({
        items: [{ priceId: plan.priceId, quantity: 1 }],
        customer: userEmail ? { email: userEmail } : undefined,
        customData: userId ? { user_id: userId } : undefined,
        settings: {
          displayMode: "overlay",
          theme: "dark",
          successUrl: `${window.location.origin}?payment=success`,
        },
      });
    } catch (err) {
      console.error("Paddle error:", err);
      alert("Failed to open payment. Please try again.");
    }
    setLoading(null);
  };

  const packs = PLANS.filter(p => p.type === "one_time");
  const subscriptions = PLANS.filter(p => p.type === "subscription");
  const displayed = tab === "packs" ? packs : subscriptions;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "32px",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5" style={{ color: "#00D4FF" }} />
              <h2 className="text-xl font-bold text-white">Get more logos</h2>
            </div>
            <p style={{ color: "#666", fontSize: "13px" }}>
              Choose a credit pack or subscribe for ongoing generations
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className="flex mb-6"
          style={{
            background: "#0a0a0a",
            borderRadius: "12px",
            padding: "4px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {(["packs", "subscriptions"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: tab === t ? "rgba(255,255,255,0.08)" : "transparent",
                color: tab === t ? "#fff" : "#666",
                fontWeight: tab === t ? 600 : 400,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 200ms ease",
                textTransform: "capitalize",
              }}
            >
              {t === "packs" ? "💳 Credit Packs" : "🔄 Subscriptions"}
            </button>
          ))}
        </div>

        {/* Plans */}
        <div className="flex flex-col gap-3">
          {displayed.map(plan => (
            <div
              key={plan.id}
              style={{
                background: "#111",
                border: plan.badge ? `1px solid ${plan.color}33` : "1px solid rgba(255,255,255,0.07)",
                borderRadius: "16px",
                padding: "20px",
                position: "relative",
                transition: "border-color 200ms ease",
              }}
            >
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: "-10px",
                    right: "16px",
                    background: plan.color,
                    color: "#050505",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 10px",
                    borderRadius: "100px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span style={{ fontSize: "24px", fontWeight: 800, color: plan.color }}>
                      ${plan.price}
                    </span>
                    <span style={{ color: "#666", fontSize: "12px" }}>
                      {plan.type === "subscription" ? "/month" : " one-time"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.features.slice(0, 2).map(f => (
                      <div key={f} className="flex items-center gap-1">
                        <Check className="w-3 h-3" style={{ color: plan.color }} />
                        <span style={{ color: "#A0A0A0", fontSize: "12px" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(plan)}
                  disabled={loading === plan.id}
                  style={{
                    background: plan.badge ? plan.color : "rgba(255,255,255,0.1)",
                    color: plan.badge ? "#050505" : "#fff",
                    border: "none",
                    borderRadius: "100px",
                    padding: "10px 20px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: loading === plan.id ? "not-allowed" : "pointer",
                    opacity: loading === plan.id ? 0.7 : 1,
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    minWidth: "80px",
                    justifyContent: "center",
                  }}
                >
                  {loading === plan.id ? (
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        border: "2px solid rgba(0,0,0,0.3)",
                        borderTopColor: "#000",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Buy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p style={{ color: "#444", fontSize: "11px", textAlign: "center", marginTop: "16px" }}>
          Secure payments powered by Paddle · Cancel anytime
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
