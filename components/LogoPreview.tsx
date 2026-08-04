"use client";

import { useState } from "react";
import { Download, ZoomIn, ZoomOut, Sun, Moon, Sparkles, ImageIcon } from "lucide-react";
import type { GeneratedLogo } from "@/app/page";

interface Props {
  logos: GeneratedLogo[];
  isGenerating: boolean;
  error: string | null;
  brandName?: string;
  onUpgradeClick?: () => void;
}

export default function LogoPreview({ logos, isGenerating, error, brandName, onUpgradeClick }: Props) {
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [darkBg, setDarkBg] = useState(true);

  const currentLogo = logos[selected];

  const handleDownload = async () => {
    if (!currentLogo) return;
    try {
      const res = await fetch(currentLogo.url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${brandName || "logo"}-${selected + 1}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(currentLogo.url, "_blank");
    }
  };

  if (isGenerating) {
    return (
      <div
        className="glow-card flex flex-col items-center justify-center gap-6"
        style={{ minHeight: "520px" }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.05)",
              borderTopColor: "#00D4FF",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "8px",
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.03)",
              borderTopColor: "#00FF88",
              animation: "spin 1.5s linear infinite reverse",
            }}
          />
          <Sparkles
            className="w-6 h-6"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              color: "#00D4FF",
            }}
          />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Creating your logos</p>
          <p style={{ color: "#666", fontSize: "14px", marginTop: "6px" }}>
            AI is crafting unique designs for{" "}
            <span style={{ color: "#A0A0A0" }}>{brandName || "your brand"}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "rgba(0,212,255,0.4)",
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    const isUpgradeError = error.includes("credits") || error.includes("upgrade") || error.includes("plan");
    return (
      <div
        className="glow-card flex flex-col items-center justify-center gap-4"
        style={{
          minHeight: "520px",
          borderColor: isUpgradeError ? "rgba(0,212,255,0.3)" : "rgba(239,68,68,0.3)",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: isUpgradeError ? "rgba(0,212,255,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${isUpgradeError ? "rgba(0,212,255,0.3)" : "rgba(239,68,68,0.3)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
          }}
        >
          {isUpgradeError ? "⚡" : "⚠️"}
        </div>
        <div className="text-center px-6">
          <p className="text-white font-semibold mb-2">
            {isUpgradeError ? "Out of credits" : "Generation failed"}
          </p>
          <p style={{ color: "#999", fontSize: "14px" }}>{error}</p>
        </div>
        {isUpgradeError && onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #00FF88 100%)",
              border: "none",
              borderRadius: "100px",
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: "14px",
              color: "#050505",
              cursor: "pointer",
            }}
          >
            ⚡ Get more credits
          </button>
        )}
      </div>
    );
  }

  if (logos.length === 0) {
    return (
      <div
        className="glow-card flex flex-col items-center justify-center gap-5"
        style={{ minHeight: "520px" }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ImageIcon className="w-8 h-8" style={{ color: "#333" }} />
        </div>
        <div className="text-center max-w-xs">
          <p className="text-white font-semibold text-lg mb-2">Your logos will appear here</p>
          <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.6" }}>
            Fill in your brand details on the left and click{" "}
            <span style={{ color: "#A0A0A0" }}>Generate Logos</span> to get started.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-2 w-full max-w-sm">
          {["Minimalist", "Modern", "Luxury"].map((s) => (
            <div
              key={s}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(0,212,255,0.1)",
                  margin: "0 auto 8px",
                }}
              />
              <span style={{ color: "#666", fontSize: "12px" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main preview */}
      <div
        className="glow-card overflow-hidden"
        style={{ minHeight: "400px" }}
      >
        {/* Toolbar */}
        <div
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ color: "#666", fontSize: "12px", fontFamily: "monospace" }}>
            Logo {selected + 1} of {logos.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkBg(!darkBg)}
              title="Toggle background"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "6px",
                cursor: "pointer",
                color: "#A0A0A0",
                display: "flex",
                alignItems: "center",
                transition: "all 200ms ease",
              }}
            >
              {darkBg ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              disabled={zoom <= 0.5}
              title="Zoom out"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "6px",
                cursor: zoom <= 0.5 ? "not-allowed" : "pointer",
                color: zoom <= 0.5 ? "#333" : "#A0A0A0",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span style={{ color: "#666", fontSize: "12px", fontFamily: "monospace", minWidth: "36px", textAlign: "center" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              disabled={zoom >= 2}
              title="Zoom in"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "6px",
                cursor: zoom >= 2 ? "not-allowed" : "pointer",
                color: zoom >= 2 ? "#333" : "#A0A0A0",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #00FF88 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "6px 14px",
                cursor: "pointer",
                color: "#050505",
                fontWeight: 700,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "opacity 200ms ease",
              }}
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        {/* Image display */}
        <div
          style={{
            background: darkBg
              ? "radial-gradient(circle at 50% 50%, #0d0d0d 0%, #050505 100%)"
              : "radial-gradient(circle at 50% 50%, #f5f5f5 0%, #e8e8e8 100%)",
            minHeight: "380px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            overflow: "hidden",
            transition: "background 300ms ease",
          }}
        >
          {currentLogo && (
            <img
              src={currentLogo.url}
              alt={`Generated logo ${selected + 1}`}
              style={{
                maxWidth: "100%",
                maxHeight: "320px",
                objectFit: "contain",
                transform: `scale(${zoom})`,
                transformOrigin: "center",
                transition: "transform 200ms ease",
                borderRadius: "4px",
              }}
            />
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {logos.length > 1 && (
        <div className="flex gap-3">
          {logos.map((logo, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelected(idx);
                setZoom(1);
              }}
              style={{
                flex: 1,
                background: selected === idx ? "rgba(0,212,255,0.1)" : "#0d0d0d",
                border: selected === idx
                  ? "1px solid rgba(0,212,255,0.5)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "8px",
                cursor: "pointer",
                transition: "all 200ms ease",
                overflow: "hidden",
              }}
            >
              <img
                src={logo.url}
                alt={`Logo variation ${idx + 1}`}
                style={{
                  width: "100%",
                  height: "64px",
                  objectFit: "contain",
                  borderRadius: "4px",
                }}
              />
              <div
                style={{
                  color: selected === idx ? "#00D4FF" : "#666",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  marginTop: "6px",
                  textAlign: "center",
                }}
              >
                Variation {idx + 1}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Prompt used */}
      {currentLogo?.prompt && (
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              color: "#444",
              fontSize: "10px",
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}
          >
            Generation Prompt
          </div>
          <p style={{ color: "#666", fontSize: "12px", lineHeight: "1.6" }}>
            {currentLogo.prompt}
          </p>
        </div>
      )}
    </div>
  );
}
