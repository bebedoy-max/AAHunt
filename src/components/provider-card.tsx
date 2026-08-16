import type { Provider } from "@/lib/api-client";
import {
  ExternalLink, CreditCard, Clock, CheckCircle2,
  XCircle, AlertCircle, Video, Flame, Gift, Star,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProviderModal } from "./provider-modal";

function ensureAbsoluteUrl(url: string): string {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function sanitizeName(name: string): string {
  try {
    if (/^https?:\/\//i.test(name.trim())) {
      return new URL(name.trim()).hostname.replace(/^www\./, "");
    }
  } catch { /* not a URL */ }
  return name;
}

function truncateCredit(text: string | null | undefined, max = 22): string {
  if (!text) return "—";
  return text.length > max ? text.substring(0, max) + "…" : text;
}

// ─── Brand theme lookup ───────────────────────────────────────────────────────
interface BrandTheme { accent: string; glow: string; badge: string }

const DEFAULT_CATEGORY_THEMES: Record<string, BrandTheme> = {
  "Video AI":   { accent: "#00f0ff", glow: "rgba(0,240,255,0.25)",   badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" },
  "Image AI":   { accent: "#a855f7", glow: "rgba(168,85,247,0.25)",  badge: "border-purple-500/40 bg-purple-500/10 text-purple-300" },
  "LLM":        { accent: "#3b82f6", glow: "rgba(59,130,246,0.25)",  badge: "border-blue-500/40 bg-blue-500/10 text-blue-300" },
  "Multimodal": { accent: "#10b981", glow: "rgba(16,185,129,0.25)",  badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  "Audio AI":   { accent: "#f97316", glow: "rgba(249,115,22,0.25)",  badge: "border-orange-500/40 bg-orange-500/10 text-orange-300" },
  "Other":      { accent: "#6b7280", glow: "rgba(107,114,128,0.25)", badge: "border-slate-500/40 bg-slate-500/10 text-slate-300" },
};

const PROVIDER_THEMES: Record<string, BrandTheme> = {
  "kling":      { accent: "#00f0ff", glow: "rgba(0,240,255,0.3)",   badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "kuaishou":   { accent: "#ff6b35", glow: "rgba(255,107,53,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "runway":     { accent: "#7c3aed", glow: "rgba(124,58,237,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "pika":       { accent: "#f472b6", glow: "rgba(244,114,182,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "luma":       { accent: "#f59e0b", glow: "rgba(245,158,11,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "hailuo":     { accent: "#60a5fa", glow: "rgba(96,165,250,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "minimax":    { accent: "#60a5fa", glow: "rgba(96,165,250,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "sora":       { accent: "#10a37f", glow: "rgba(16,163,127,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "veo":        { accent: "#4285f4", glow: "rgba(66,133,244,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "seedance":   { accent: "#fe2c55", glow: "rgba(254,44,85,0.3)",   badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "viggle":     { accent: "#ff4500", glow: "rgba(255,69,0,0.3)",    badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "haiper":     { accent: "#8b5cf6", glow: "rgba(139,92,246,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "pixverse":   { accent: "#06b6d4", glow: "rgba(6,182,212,0.3)",   badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "wan":        { accent: "#34d399", glow: "rgba(52,211,153,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "vidu":       { accent: "#818cf8", glow: "rgba(129,140,248,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "morph":      { accent: "#c084fc", glow: "rgba(192,132,252,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "kaiber":     { accent: "#e879f9", glow: "rgba(232,121,249,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "invideo":    { accent: "#3b82f6", glow: "rgba(59,130,246,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "genmo":      { accent: "#10b981", glow: "rgba(16,185,129,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "lightricks": { accent: "#ec4899", glow: "rgba(236,72,153,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "jimeng":     { accent: "#fe2c55", glow: "rgba(254,44,85,0.3)",   badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "cogvideo":   { accent: "#818cf8", glow: "rgba(129,140,248,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "hunyuan":    { accent: "#1db954", glow: "rgba(29,185,84,0.3)",   badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "midjourney": { accent: "#818cf8", glow: "rgba(129,140,248,0.3)", badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "stability":  { accent: "#a78bfa", glow: "rgba(167,139,250,0.3)", badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "ideogram":   { accent: "#c084fc", glow: "rgba(192,132,252,0.3)", badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "flux":       { accent: "#fb923c", glow: "rgba(251,146,60,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "adobe":      { accent: "#ff0000", glow: "rgba(255,0,0,0.3)",     badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "firefly":    { accent: "#ff0000", glow: "rgba(255,0,0,0.3)",     badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "freepik":    { accent: "#1fb860", glow: "rgba(31,184,96,0.3)",   badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "canva":      { accent: "#00c4cc", glow: "rgba(0,196,204,0.3)",   badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "nightcafe":  { accent: "#e879f9", glow: "rgba(232,121,249,0.3)", badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "leonardo":   { accent: "#ef4444", glow: "rgba(239,68,68,0.3)",   badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "magnific":   { accent: "#f59e0b", glow: "rgba(245,158,11,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "tensor":     { accent: "#8b5cf6", glow: "rgba(139,92,246,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "civitai":    { accent: "#6366f1", glow: "rgba(99,102,241,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "wujie":      { accent: "#ff6b35", glow: "rgba(255,107,53,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "tongyi":     { accent: "#ff6a00", glow: "rgba(255,106,0,0.3)",   badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "imagen":     { accent: "#4285f4", glow: "rgba(66,133,244,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "dall":       { accent: "#10a37f", glow: "rgba(16,163,127,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "openai":     { accent: "#10a37f", glow: "rgba(16,163,127,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "anthropic":  { accent: "#d97706", glow: "rgba(217,119,6,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "claude":     { accent: "#d97706", glow: "rgba(217,119,6,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "google":     { accent: "#4285f4", glow: "rgba(66,133,244,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Multimodal"]!.badge },
  "gemini":     { accent: "#4285f4", glow: "rgba(66,133,244,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Multimodal"]!.badge },
  "groq":       { accent: "#f97316", glow: "rgba(249,115,22,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "mistral":    { accent: "#7c3aed", glow: "rgba(124,58,237,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "together":   { accent: "#3b82f6", glow: "rgba(59,130,246,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "cohere":     { accent: "#39d353", glow: "rgba(57,211,83,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "replicate":  { accent: "#6366f1", glow: "rgba(99,102,241,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "hugging":    { accent: "#ffd21e", glow: "rgba(255,210,30,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "perplexity": { accent: "#20b2aa", glow: "rgba(32,178,170,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "deepseek":   { accent: "#4f6ef7", glow: "rgba(79,110,247,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "moonshot":   { accent: "#7c8cf8", glow: "rgba(124,140,248,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "kimi":       { accent: "#7c8cf8", glow: "rgba(124,140,248,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "zhipu":      { accent: "#2563eb", glow: "rgba(37,99,235,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "glm":        { accent: "#2563eb", glow: "rgba(37,99,235,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "baidu":      { accent: "#2932e1", glow: "rgba(41,50,225,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "ernie":      { accent: "#2932e1", glow: "rgba(41,50,225,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "alibaba":    { accent: "#ff6a00", glow: "rgba(255,106,0,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "qwen":       { accent: "#ff6a00", glow: "rgba(255,106,0,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "tencent":    { accent: "#1db954", glow: "rgba(29,185,84,0.3)",   badge: DEFAULT_CATEGORY_THEMES["Multimodal"]!.badge },
  "yi":         { accent: "#6366f1", glow: "rgba(99,102,241,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "stepfun":    { accent: "#818cf8", glow: "rgba(129,140,248,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "fireworks":  { accent: "#f97316", glow: "rgba(249,115,22,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "anyscale":   { accent: "#3b82f6", glow: "rgba(59,130,246,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "xai":        { accent: "#e5e7eb", glow: "rgba(229,231,235,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "grok":       { accent: "#e5e7eb", glow: "rgba(229,231,235,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "yandex":     { accent: "#fc3f1d", glow: "rgba(252,63,29,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "sber":       { accent: "#21a038", glow: "rgba(33,160,56,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "naver":      { accent: "#03c75a", glow: "rgba(3,199,90,0.3)",    badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "kakao":      { accent: "#fee500", glow: "rgba(254,229,0,0.3)",   badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "fal":        { accent: "#8b5cf6", glow: "rgba(139,92,246,0.3)",  badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "suno":       { accent: "#a855f7", glow: "rgba(168,85,247,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Audio AI"]!.badge },
  "udio":       { accent: "#ec4899", glow: "rgba(236,72,153,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Audio AI"]!.badge },
  "elevenlabs": { accent: "#6366f1", glow: "rgba(99,102,241,0.3)",  badge: DEFAULT_CATEGORY_THEMES["Audio AI"]!.badge },
};

function getTheme(provider: Provider): BrandTheme {
  const nameLower = provider.name.toLowerCase();
  for (const [key, theme] of Object.entries(PROVIDER_THEMES)) {
    if (nameLower.includes(key)) return theme;
  }
  return DEFAULT_CATEGORY_THEMES[provider.category] ?? DEFAULT_CATEGORY_THEMES["Other"]!;
}

function getFaviconUrl(websiteUrl: string): string {
  try {
    const domain = new URL(websiteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch { return ""; }
}

// ─── Quality badge ────────────────────────────────────────────────────────────
function QualityBadge({ score }: { score: number }) {
  const tier =
    score >= 90 ? { label: "S", cls: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" } :
    score >= 70 ? { label: "A", cls: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" } :
    score >= 50 ? { label: "B", cls: "border-blue-500/50 bg-blue-500/10 text-blue-400" } :
    score >= 30 ? { label: "C", cls: "border-slate-500/40 bg-slate-500/10 text-slate-400" } :
                  { label: "D", cls: "border-red-500/30 bg-red-500/10 text-red-400/70" };
  return (
    <span
      title={`Quality score: ${score}/100`}
      className={cn("inline-flex items-center gap-0.5 text-[9px] font-black px-1 py-0 rounded border font-mono", tier.cls)}
    >
      <Star className="w-2 h-2" />{tier.label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
interface ProviderCardProps { provider: Provider }

export function ProviderCard({ provider }: ProviderCardProps) {
  const theme = getTheme(provider);
  const faviconUrl = getFaviconUrl(provider.website_url);
  const [imgOk, setImgOk] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [visitHovered, setVisitHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const isActive = provider.status === "active";
  const isExpired = provider.status === "expired";

  return (
    <>
      <div
        className="relative flex flex-col rounded-xl overflow-hidden border border-border/60 bg-card transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group cursor-pointer"
        style={{
          height: "272px",
          boxShadow: hovered ? `0 8px 32px ${theme.glow}, 0 0 0 1px ${theme.accent}33` : undefined,
        }}
        onClick={() => setModalOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Semi-transparent background branding ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {/* Radial brand glow from bottom-right */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 85% 90%, ${theme.accent}22 0%, transparent 65%)`,
            }}
          />
          {/* Large blurred favicon watermark */}
          {faviconUrl && imgOk && (
            <img
              src={faviconUrl}
              alt=""
              aria-hidden
              className="absolute pointer-events-none object-contain select-none"
              style={{
                width: 120,
                height: 120,
                bottom: -16,
                right: -16,
                opacity: 0.1,
                filter: "blur(10px)",
                transform: "scale(1.4)",
              }}
              onError={() => setImgOk(false)}
            />
          )}
        </div>

        {/* Brand colour top strip */}
        <div
          className="h-[3px] w-full shrink-0 relative z-10"
          style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}88, transparent)` }}
        />

        {/* Header */}
        <div
          className="px-4 pt-3 pb-2 relative z-10"
          style={{ background: `linear-gradient(135deg, ${theme.accent}0d 0%, transparent 60%)` }}
        >
          {/* Kling badge */}
          {provider.has_kling && (
            <div className="absolute top-2.5 right-3 z-10">
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border animate-pulse"
                style={{
                  borderColor: `${theme.accent}60`,
                  backgroundColor: `${theme.accent}15`,
                  color: theme.accent,
                  boxShadow: `0 0 8px ${theme.glow}`,
                }}
              >
                <Video className="w-2.5 h-2.5" /> KLING
              </span>
            </div>
          )}

          {/* Hot badge */}
          {isActive && !provider.requires_credit_card && !provider.expiry_days && !provider.has_kling && (
            <div className="absolute top-2.5 right-3 z-10">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-orange-500/50 bg-orange-500/10 text-orange-400">
                <Flame className="w-2.5 h-2.5" /> HOT
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 pr-10">
            {/* Logo */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border"
              style={{
                borderColor: `${theme.accent}30`,
                background: `${theme.accent}10`,
                boxShadow: `0 0 12px ${theme.glow}`,
              }}
            >
              {faviconUrl && imgOk ? (
                <img
                  src={faviconUrl}
                  alt={provider.name}
                  className="w-6 h-6 object-contain"
                  onError={() => setImgOk(false)}
                />
              ) : (
                <span className="text-sm font-black font-mono" style={{ color: theme.accent }}>
                  {sanitizeName(provider.name).substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name + category */}
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] leading-tight truncate" style={{ color: hovered ? theme.accent : undefined }}>
                {sanitizeName(provider.name)}
              </h3>
              <span className={cn("inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0 rounded-full border", theme.badge)}>
                {provider.category}
              </span>
            </div>
          </div>
        </div>

        {/* Credit amount — hero metric */}
        <div
          className="mx-4 mb-2 rounded-lg px-3 py-2 border relative z-10"
          style={{ borderColor: `${theme.accent}20`, background: `${theme.accent}08` }}
        >
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-0.5 flex items-center gap-1">
            <Gift className="w-3 h-3" /> Free Credits
          </div>
          <div
            className="font-black text-xl font-mono leading-tight tracking-tight truncate"
            style={{ color: theme.accent }}
            title={provider.free_credit_amount ?? undefined}
          >
            {truncateCredit(provider.free_credit_amount)}
          </div>
          {provider.credit_type && (
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{provider.credit_type}</div>
          )}
        </div>

        {/* Info row */}
        <div className="px-4 mb-2 grid grid-cols-2 gap-2 text-xs relative z-10">
          <div className={cn("flex items-center gap-1.5 font-medium", provider.requires_credit_card ? "text-red-400" : "text-emerald-400")}>
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            {provider.requires_credit_card ? "CC required" : "No CC"}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {provider.expiry_days ? `${provider.expiry_days}d` : "No limit"}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/40 flex items-center justify-between bg-muted/5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider">
              {isActive ? (
                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Active</span></>
              ) : isExpired ? (
                <><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-red-400">Expired</span></>
              ) : (
                <><AlertCircle className="w-3.5 h-3.5 text-amber-400" /><span className="text-amber-400">Unverified</span></>
              )}
            </div>
            <QualityBadge score={provider.quality_score ?? 0} />
          </div>

          {/* Visit button — stops card click from firing */}
          <a
            href={ensureAbsoluteUrl(provider.website_url)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Kunjungi ${sanitizeName(provider.name)}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all duration-200"
            style={{
              borderColor: visitHovered ? `${theme.accent}70` : `${theme.accent}30`,
              color: theme.accent,
              background: visitHovered ? `${theme.accent}18` : undefined,
            }}
            onMouseEnter={(e) => { e.stopPropagation(); setVisitHovered(true); }}
            onMouseLeave={(e) => { e.stopPropagation(); setVisitHovered(false); }}
          >
            Visit <ExternalLink className="w-3 h-3" aria-hidden />
          </a>
        </div>
      </div>

      {/* Detail modal — rendered outside card to avoid z-index issues */}
      <ProviderModal
        provider={provider}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
