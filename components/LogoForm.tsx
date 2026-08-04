"use client";

import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import type { LogoConfig } from "@/app/page";

interface Props {
  onGenerate: (config: LogoConfig) => void;
  isGenerating: boolean;
  isLoggedIn: boolean;
  onLoginClick: () => void;
}

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Fashion",
  "Beauty & Cosmetics", "Food & Beverage", "Real Estate", "Media & Entertainment",
  "Sports & Fitness", "Travel", "Legal", "Consulting", "E-commerce", "Other",
];

const STYLES = [
  { id: "minimalist", label: "Minimalist", desc: "Clean, simple, timeless" },
  { id: "modern", label: "Modern", desc: "Sleek, professional, bold" },
  { id: "vintage", label: "Vintage", desc: "Classic, retro, nostalgic" },
  { id: "playful", label: "Playful", desc: "Fun, colorful, friendly" },
  { id: "luxury", label: "Luxury", desc: "Elegant, premium, refined" },
  { id: "tech", label: "Tech", desc: "Futuristic, digital, sharp" },
  { id: "organic", label: "Organic", desc: "Natural, earthy, flowing" },
  { id: "geometric", label: "Geometric", desc: "Abstract, structured, bold" },
];

const COLOR_PRESETS = [
  { label: "Cyan & Green", primary: "#00D4FF", secondary: "#00FF88" },
  { label: "Purple & Pink", primary: "#7C3AED", secondary: "#EC4899" },
  { label: "Gold & Black", primary: "#F59E0B", secondary: "#1C1C1E" },
  { label: "Red & Orange", primary: "#EF4444", secondary: "#F97316" },
  { label: "Blue & White", primary: "#3B82F6", secondary: "#FFFFFF" },
  { label: "Green & Teal", primary: "#10B981", secondary: "#06B6D4" },
  { label: "Midnight", primary: "#6366F1", secondary: "#8B5CF6" },
  { label: "Custom", primary: "", secondary: "" },
];

export default function LogoForm({ onGenerate, isGenerating, isLoggedIn, onLoginClick }: Props) {
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [style, setStyle] = useState("modern");
  const [colorPreset, setColorPreset] = useState(0);
  const [primaryColor, setPrimaryColor] = useState("#00D4FF");
  const [secondaryColor, setSecondaryColor] = useState("#00FF88");
  const [description, setDescription] = useState("");

  const handleColorPreset = (idx: number) => {
    setColorPreset(idx);
    if (COLOR_PRESETS[idx].primary) {
      setPrimaryColor(COLOR_PRESETS[idx].primary);
      setSecondaryColor(COLOR_PRESETS[idx].secondary);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    onGenerate({
      brandName: brandName.trim(),
      tagline: tagline.trim(),
      industry,
      style,
      primaryColor,
      secondaryColor,
      description: description.trim(),
    });
  };

  const inputStyle: React.CSSProperties = {
    background: "#0a0a0a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#fff",
    padding: "10px 14px",
    fontSize: "14px",
    width: "100%",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    color: "#A0A0A0",
    fontSize: "12px",
    fontFamily: "Geist Mono, monospace",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "8px",
    display: "block",
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div
        className="glow-card p-5 flex flex-col gap-5"
        style={{ position: "sticky", top: "72px" }}
      >
        <div>
          <span style={labelStyle}>Brand Name *</span>
          <input
            style={inputStyle}
            placeholder="e.g. NovaSpark"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            required
            maxLength={60}
          />
        </div>

        <div>
          <span style={labelStyle}>Tagline (optional)</span>
          <input
            style={inputStyle}
            placeholder="e.g. Ignite your potential"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={80}
          />
        </div>

        <div>
          <span style={labelStyle}>Industry</span>
          <div className="relative">
            <select
              style={{ ...inputStyle, appearance: "none", paddingRight: "36px", cursor: "pointer" }}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind} style={{ background: "#111" }}>
                  {ind}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4"
              style={{ color: "#666" }}
            />
          </div>
        </div>

        <div>
          <span style={labelStyle}>Logo Style</span>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                style={{
                  background: style === s.id ? "rgba(0,212,255,0.1)" : "#0a0a0a",
                  border: style === s.id
                    ? "1px solid rgba(0,212,255,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 200ms ease",
                }}
              >
                <div style={{ color: style === s.id ? "#00D4FF" : "#fff", fontSize: "13px", fontWeight: 600 }}>
                  {s.label}
                </div>
                <div style={{ color: "#666", fontSize: "11px", marginTop: "2px" }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span style={labelStyle}>Color Palette</span>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {COLOR_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                title={preset.label}
                onClick={() => handleColorPreset(idx)}
                style={{
                  borderRadius: "8px",
                  padding: "4px",
                  border: colorPreset === idx
                    ? "2px solid rgba(0,212,255,0.6)"
                    : "2px solid transparent",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "border 200ms ease",
                }}
              >
                {preset.primary ? (
                  <div
                    style={{
                      height: "28px",
                      borderRadius: "6px",
                      background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: "28px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px dashed rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                      fontSize: "10px",
                    }}
                  >
                    Custom
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <div style={{ color: "#666", fontSize: "11px", marginBottom: "4px", fontFamily: "monospace" }}>
                Primary
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    setColorPreset(7);
                  }}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    background: "none",
                    padding: "2px",
                  }}
                />
                <input
                  style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }}
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    setColorPreset(7);
                  }}
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex-1">
              <div style={{ color: "#666", fontSize: "11px", marginBottom: "4px", fontFamily: "monospace" }}>
                Secondary
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => {
                    setSecondaryColor(e.target.value);
                    setColorPreset(7);
                  }}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    background: "none",
                    padding: "2px",
                  }}
                />
                <input
                  style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }}
                  value={secondaryColor}
                  onChange={(e) => {
                    setSecondaryColor(e.target.value);
                    setColorPreset(7);
                  }}
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <span style={labelStyle}>Brand Description (optional)</span>
          <textarea
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical", lineHeight: "1.5" }}
            placeholder="Describe your brand's personality, values, or anything specific you want in the logo..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
          />
        </div>

        <button
          type="submit"
          disabled={isGenerating || (!isLoggedIn ? false : !brandName.trim())}
          onClick={!isLoggedIn ? (e) => { e.preventDefault(); onLoginClick(); } : undefined}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "100px",
            border: "none",
            background: isGenerating
              ? "rgba(255,255,255,0.1)"
              : "#FFFFFF",
            color: isGenerating ? "#666" : "#050505",
            fontWeight: 700,
            fontSize: "15px",
            cursor: isGenerating ? "not-allowed" : "pointer",
            transition: "all 200ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isGenerating ? (
            <>
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Generating logos...
            </>
          ) : !isLoggedIn ? (
            <>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Sign in to Generate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Logos
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}
