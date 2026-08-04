"use client";

import { Sparkles } from "lucide-react";
import { openHappySeedsLogin } from "@/lib/auth-popup";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#050505" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00FF88 100%)" }}
          >
            <Sparkles className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome to LogoCraft</h1>
          <p style={{ color: "#666", fontSize: "14px" }}>Sign in to generate AI logos</p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            padding: "32px",
          }}
        >
          <p style={{ color: "#A0A0A0", fontSize: "14px", textAlign: "center", marginBottom: "24px", lineHeight: "1.6" }}>
            Create an account or sign in to start generating professional logos for your brand.
          </p>

          <button
            onClick={() => openHappySeedsLogin()}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "100px",
              border: "none",
              background: "#FFFFFF",
              color: "#050505",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "opacity 200ms ease",
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "rgba(0,212,255,0.05)",
              border: "1px solid rgba(0,212,255,0.15)",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#666",
              textAlign: "center",
              lineHeight: "1.6",
            }}
          >
            🎁 New users get <span style={{ color: "#00D4FF", fontWeight: 600 }}>2 free logo generations</span> on signup
          </div>
        </div>
      </div>
    </div>
  );
}
