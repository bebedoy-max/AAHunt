import type { Provider } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ExternalLink, CreditCard, Clock, CheckCircle2, XCircle, AlertCircle,
  Video, Gift, Star, Globe, FileText, Info, Link2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  "kling": { accent: "#00f0ff", glow: "rgba(0,240,255,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "runway": { accent: "#7c3aed", glow: "rgba(124,58,237,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "pika": { accent: "#f472b6", glow: "rgba(244,114,182,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "luma": { accent: "#f59e0b", glow: "rgba(245,158,11,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "hailuo": { accent: "#60a5fa", glow: "rgba(96,165,250,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "minimax": { accent: "#60a5fa", glow: "rgba(96,165,250,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "sora": { accent: "#10a37f", glow: "rgba(16,163,127,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "openai": { accent: "#10a37f", glow: "rgba(16,163,127,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "anthropic": { accent: "#d97706", glow: "rgba(217,119,6,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "claude": { accent: "#d97706", glow: "rgba(217,119,6,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "google": { accent: "#4285f4", glow: "rgba(66,133,244,0.3)", badge: DEFAULT_CATEGORY_THEMES["Multimodal"]!.badge },
  "gemini": { accent: "#4285f4", glow: "rgba(66,133,244,0.3)", badge: DEFAULT_CATEGORY_THEMES["Multimodal"]!.badge },
  "groq": { accent: "#f97316", glow: "rgba(249,115,22,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "mistral": { accent: "#7c3aed", glow: "rgba(124,58,237,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "midjourney": { accent: "#818cf8", glow: "rgba(129,140,248,0.3)", badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "stability": { accent: "#a78bfa", glow: "rgba(167,139,250,0.3)", badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "ideogram": { accent: "#c084fc", glow: "rgba(192,132,252,0.3)", badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "canva": { accent: "#00c4cc", glow: "rgba(0,196,204,0.3)", badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "leonardo": { accent: "#ef4444", glow: "rgba(239,68,68,0.3)", badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "freepik": { accent: "#1fb860", glow: "rgba(31,184,96,0.3)", badge: DEFAULT_CATEGORY_THEMES["Image AI"]!.badge },
  "suno": { accent: "#a855f7", glow: "rgba(168,85,247,0.3)", badge: DEFAULT_CATEGORY_THEMES["Audio AI"]!.badge },
  "elevenlabs": { accent: "#6366f1", glow: "rgba(99,102,241,0.3)", badge: DEFAULT_CATEGORY_THEMES["Audio AI"]!.badge },
  "deepseek": { accent: "#4f6ef7", glow: "rgba(79,110,247,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "perplexity": { accent: "#20b2aa", glow: "rgba(32,178,170,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "replicate": { accent: "#6366f1", glow: "rgba(99,102,241,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "hugging": { accent: "#ffd21e", glow: "rgba(255,210,30,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "together": { accent: "#3b82f6", glow: "rgba(59,130,246,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "cohere": { accent: "#39d353", glow: "rgba(57,211,83,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "fal": { accent: "#8b5cf6", glow: "rgba(139,92,246,0.3)", badge: DEFAULT_CATEGORY_THEMES["LLM"]!.badge },
  "pixverse": { accent: "#06b6d4", glow: "rgba(6,182,212,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "vidu": { accent: "#818cf8", glow: "rgba(129,140,248,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "invideo": { accent: "#3b82f6", glow: "rgba(59,130,246,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "kaiber": { accent: "#e879f9", glow: "rgba(232,121,249,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "haiper": { accent: "#8b5cf6", glow: "rgba(139,92,246,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "viggle": { accent: "#ff4500", glow: "rgba(255,69,0,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
  "seedance": { accent: "#fe2c55", glow: "rgba(254,44,85,0.3)", badge: DEFAULT_CATEGORY_THEMES["Video AI"]!.badge },
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

function QualityBadge({ score }: { score: number }) {
  const tier =
    score >= 90 ? { label: "S", cls: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" } :
    score >= 70 ? { label: "A", cls: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" } :
    score >= 50 ? { label: "B", cls: "border-blue-500/50 bg-blue-500/10 text-blue-400" } :
    score >= 30 ? { label: "C", cls: "border-slate-500/40 bg-slate-500/10 text-slate-400" } :
                  { label: "D", cls: "border-red-500/30 bg-red-500/10 text-red-400/70" };
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded border font-mono", tier.cls)}>
      <Star className="w-2.5 h-2.5" /> {tier.label}
    </span>
  );
}

interface ProviderModalProps {
  provider: Provider;
  open: boolean;
  onClose: () => void;
}

export function ProviderModal({ provider, open, onClose }: ProviderModalProps) {
  const theme = getTheme(provider);
  const faviconUrl = getFaviconUrl(provider.website_url);
  const [imgOk, setImgOk] = useState(true);

  const isActive = provider.status === "active";
  const isExpired = provider.status === "expired";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-border/60 bg-card">
        {/* Coloured top strip */}
        <div
          className="h-1 w-full shrink-0"
          style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}55, transparent)` }}
        />

        {/* Hero header */}
        <div
          className="px-6 pt-5 pb-4 relative"
          style={{ background: `linear-gradient(135deg, ${theme.accent}12 0%, transparent 60%)` }}
        >
          {/* Background watermark */}
          {faviconUrl && imgOk && (
            <img
              src={faviconUrl}
              alt=""
              aria-hidden
              className="absolute right-4 top-4 w-24 h-24 opacity-[0.07] pointer-events-none object-contain"
              style={{ filter: "blur(6px)" }}
              onError={() => setImgOk(false)}
            />
          )}

          <DialogHeader className="relative z-10">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border"
                style={{
                  borderColor: `${theme.accent}30`,
                  background: `${theme.accent}12`,
                  boxShadow: `0 0 20px ${theme.glow}`,
                }}
              >
                {faviconUrl && imgOk ? (
                  <img
                    src={faviconUrl}
                    alt={provider.name}
                    className="w-9 h-9 object-contain"
                    onError={() => setImgOk(false)}
                  />
                ) : (
                  <span className="text-xl font-black font-mono" style={{ color: theme.accent }}>
                    {sanitizeName(provider.name).substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold leading-tight mb-1 text-left">
                  {sanitizeName(provider.name)}
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", theme.badge)}>
                    {provider.category}
                  </span>
                  <QualityBadge score={provider.quality_score ?? 0} />
                  <span className={cn(
                    "text-[11px] font-mono font-semibold uppercase flex items-center gap-1",
                    isActive ? "text-emerald-400" : isExpired ? "text-red-400" : "text-amber-400"
                  )}>
                    {isActive ? <CheckCircle2 className="w-3 h-3" /> : isExpired ? <XCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {provider.status}
                  </span>
                  {provider.has_kling && (
                    <span
                      className="text-[11px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1"
                      style={{ borderColor: `${theme.accent}50`, background: `${theme.accent}12`, color: theme.accent }}
                    >
                      <Video className="w-3 h-3" /> KLING
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable body */}
        <div className="px-6 pb-6 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Free Credits hero */}
          <div
            className="rounded-xl px-4 py-3 border"
            style={{ borderColor: `${theme.accent}25`, background: `${theme.accent}0a` }}
          >
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">
              <Gift className="w-3.5 h-3.5" /> Kredit Gratis
            </div>
            <div className="font-black text-3xl font-mono leading-tight" style={{ color: theme.accent }}>
              {provider.free_credit_amount || "—"}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {provider.credit_type && (
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3" /> {provider.credit_type}
                </span>
              )}
              <span className={cn("flex items-center gap-1 font-medium", provider.requires_credit_card ? "text-red-400" : "text-emerald-400")}>
                <CreditCard className="w-3 h-3" />
                {provider.requires_credit_card ? "CC diperlukan" : "Tanpa kartu kredit"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {provider.expiry_days ? `Berlaku ${provider.expiry_days} hari` : "Tanpa batas waktu"}
              </span>
            </div>
          </div>

          {/* Kling detail */}
          {provider.has_kling && provider.kling_detail && (
            <div
              className="rounded-xl px-4 py-3 border text-sm leading-relaxed"
              style={{ borderColor: `${theme.accent}25`, background: `${theme.accent}08`, color: `${theme.accent}cc` }}
            >
              <div className="font-bold text-[11px] uppercase tracking-wider mb-1" style={{ color: theme.accent }}>
                ✦ Dukungan Kling Motion Control
              </div>
              {provider.kling_detail}
            </div>
          )}

          {/* Description */}
          {provider.description && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <FileText className="w-3.5 h-3.5" /> Tentang Program Ini
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{provider.description}</p>
            </div>
          )}

          {/* Notes */}
          {provider.notes && (
            <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Info className="w-3.5 h-3.5" /> Catatan Tambahan
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{provider.notes}</p>
            </div>
          )}

          {/* Source */}
          {provider.source_url && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              <span>Sumber:</span>
              <a
                href={ensureAbsoluteUrl(provider.source_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-primary transition-colors truncate"
              >
                {provider.source_url}
              </a>
            </div>
          )}

          {/* CTA */}
          <a
            href={ensureAbsoluteUrl(provider.website_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border font-semibold text-sm transition-all duration-200"
            style={{
              borderColor: `${theme.accent}50`,
              color: theme.accent,
              background: `${theme.accent}10`,
            }}
          >
            <Globe className="w-4 h-4" />
            Kunjungi Website & Daftar
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
