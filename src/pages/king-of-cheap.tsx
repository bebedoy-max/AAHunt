import { useState, useMemo } from "react";
import { useListProviders } from "@/lib/api-client";
import type { Provider } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import {
  Crown, ExternalLink, Search, CreditCard, Gift, Video,
  Database, Activity, Sparkles, CheckCircle2, XCircle, AlertCircle, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProviderModal } from "@/components/provider-modal";
import { Link } from "@tanstack/react-router";

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

function getFaviconUrl(websiteUrl: string): string {
  try {
    const domain = new URL(websiteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch { return ""; }
}

const CATEGORY_FILTERS = [
  { id: "all",        label: "Semua",     color: "text-primary border-primary/40 bg-primary/10" },
  { id: "Video AI",   label: "Video AI",  color: "text-cyan-400 border-cyan-400/40 bg-cyan-400/10" },
  { id: "Image AI",   label: "Image AI",  color: "text-purple-400 border-purple-400/40 bg-purple-400/10" },
  { id: "LLM",        label: "LLM",       color: "text-blue-400 border-blue-400/40 bg-blue-400/10" },
  { id: "Multimodal", label: "Multimodal",color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" },
  { id: "Audio AI",   label: "Audio AI",  color: "text-orange-400 border-orange-400/40 bg-orange-400/10" },
  { id: "kling",      label: "🎬 Kling",  color: "text-cyan-300 border-cyan-300/40 bg-cyan-300/10" },
  { id: "nocc",       label: "No CC",     color: "text-violet-400 border-violet-400/40 bg-violet-400/10" },
];

const RANK_CONFIG = [
  { emoji: "🥇", ring: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400", row: "bg-gradient-to-r from-yellow-500/8 to-transparent border-yellow-500/20" },
  { emoji: "🥈", ring: "border-slate-400/50 bg-slate-400/10 text-slate-300",   row: "bg-gradient-to-r from-slate-400/8 to-transparent border-slate-400/20" },
  { emoji: "🥉", ring: "border-orange-500/50 bg-orange-500/10 text-orange-400", row: "bg-gradient-to-r from-orange-500/8 to-transparent border-orange-500/20" },
];

function ProviderRow({ provider, rank, onInfoClick }: { provider: Provider; rank: number; onInfoClick: () => void }) {
  const [imgOk, setImgOk] = useState(true);
  const faviconUrl = getFaviconUrl(provider.website_url);
  const rankCfg = RANK_CONFIG[rank];
  const isTop3 = rank < 3;
  const isActive  = provider.status === "active";
  const isExpired = provider.status === "expired";

  const qualityTier =
    (provider.quality_score ?? 0) >= 90 ? { label: "S", cls: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10" } :
    (provider.quality_score ?? 0) >= 70 ? { label: "A", cls: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" } :
    (provider.quality_score ?? 0) >= 50 ? { label: "B", cls: "border-blue-500/50 text-blue-400 bg-blue-500/10" } :
    (provider.quality_score ?? 0) >= 30 ? { label: "C", cls: "border-slate-500/50 text-slate-400 bg-slate-500/10" } :
                                           { label: "D", cls: "border-red-500/30 text-red-400 bg-red-500/10" };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer group",
        isTop3
          ? rankCfg!.row
          : "bg-card border-border/50 hover:border-border/80 hover:bg-muted/10"
      )}
      onClick={onInfoClick}
    >
      {/* ── Top row: rank + favicon + name + status ── */}
      <div className="flex items-center gap-3">
        {/* Rank badge */}
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border",
            isTop3
              ? rankCfg!.ring
              : "bg-muted/50 text-muted-foreground border-border/50"
          )}
        >
          {isTop3 ? rankCfg!.emoji : `#${rank + 1}`}
        </div>

        {/* Favicon */}
        <div className="w-8 h-8 rounded-lg border border-border/50 bg-muted/20 flex items-center justify-center shrink-0 overflow-hidden">
          {faviconUrl && imgOk ? (
            <img
              src={faviconUrl}
              alt={sanitizeName(provider.name)}
              className="w-5 h-5 object-contain"
              onError={() => setImgOk(false)}
            />
          ) : (
            <span className="text-[10px] font-black text-muted-foreground">
              {sanitizeName(provider.name).substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name + category */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-[140px] sm:max-w-none">
              {sanitizeName(provider.name)}
            </span>
            <span className="text-[9px] px-1.5 py-0 rounded-full border font-medium text-muted-foreground border-border/40 bg-muted/30 shrink-0">
              {provider.category}
            </span>
            {provider.has_kling && (
              <span className="text-[9px] px-1.5 py-0 rounded-full border font-bold text-cyan-400 border-cyan-400/40 bg-cyan-400/10 flex items-center gap-0.5 shrink-0">
                <Video className="w-2.5 h-2.5" /> KLING
              </span>
            )}
          </div>
        </div>

        {/* Status — right side */}
        <div className="shrink-0 text-[10px] font-mono font-semibold uppercase">
          {isActive ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden sm:inline">Active</span>
            </span>
          ) : isExpired ? (
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="w-3 h-3" />
              <span className="hidden sm:inline">Expired</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertCircle className="w-3 h-3" />
              <span className="hidden sm:inline">Unverified</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Bottom row: credit + badges + visit ── */}
      <div className="flex items-center justify-between gap-2 pl-11">
        {/* Credit amount */}
        <div className="flex items-center gap-1 min-w-0">
          <Gift className="w-3 h-3 text-emerald-400 shrink-0" />
          <span
            className="text-xs font-black font-mono text-emerald-400 truncate"
            title={provider.free_credit_amount ?? undefined}
          >
            {provider.free_credit_amount
              ? (provider.free_credit_amount.length > 32
                  ? provider.free_credit_amount.substring(0, 32) + "…"
                  : provider.free_credit_amount)
              : "—"}
          </span>
        </div>

        {/* Badges + visit */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!provider.requires_credit_card && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border bg-blue-500/10 border-blue-500/30 text-blue-400 flex items-center gap-0.5">
              <CreditCard className="w-2 h-2" /> No CC
            </span>
          )}
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full border font-mono font-bold flex items-center gap-0.5",
            qualityTier.cls
          )}>
            <Star className="w-2 h-2" /> {qualityTier.label}
          </span>
          <a
            href={ensureAbsoluteUrl(provider.website_url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
          >
            Visit <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function KingOfCheapPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const { data: providers, isLoading } = useListProviders({
    entity_type: "ai_provider",
    has_kling: categoryFilter === "kling" ? true : undefined,
  } as Parameters<typeof useListProviders>[0]);

  const filtered = useMemo(() => {
    let list = providers ?? [];

    if (categoryFilter === "nocc") {
      list = list.filter((p) => !p.requires_credit_card);
    } else if (categoryFilter !== "all" && categoryFilter !== "kling") {
      list = list.filter((p) => p.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        sanitizeName(p.name).toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.free_credit_amount ?? "").toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0));
  }, [providers, categoryFilter, search]);

  const activeCount = filtered.filter((p) => p.status === "active").length;
  const noCcCount   = filtered.filter((p) => !p.requires_credit_card).length;
  const klingCount  = filtered.filter((p) => p.has_kling).length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400/30 to-yellow-600/20 border border-yellow-500/40 flex items-center justify-center shadow-[0_0_16px_rgba(234,179,8,0.15)]">
              <Crown className="w-4 h-4 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">King of Cheap</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Ranking AI provider berdasarkan kualitas deal — diurutkan dari score tertinggi.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          LIVE DATA
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {[
          { label: "Total", value: filtered.length, icon: Database, accent: "text-primary" },
          { label: "No CC", value: noCcCount, icon: CreditCard, accent: "text-violet-400" },
          { label: "Kling", value: klingCount, icon: Video, accent: "text-cyan-400" },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 md:px-4 md:py-3">
            <Icon className={cn("w-3.5 h-3.5 shrink-0", accent)} />
            <div>
              <div className={cn("text-xl md:text-2xl font-black font-mono", accent)}>{value}</div>
              <div className="text-[9px] md:text-[10px] text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategoryFilter(f.id)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all",
                categoryFilter === f.id
                  ? f.color
                  : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground bg-transparent"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari provider, kategori, atau deskripsi…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/60"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/20 animate-pulse border border-border/40" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-full border border-border/60 bg-muted/20 flex items-center justify-center">
            {(providers?.length ?? 0) === 0
              ? <Activity className="w-7 h-7 text-muted-foreground" />
              : <Sparkles className="w-7 h-7 text-muted-foreground" />
            }
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">
              {(providers?.length ?? 0) === 0 ? "Belum ada data provider" : "Tidak ada hasil yang cocok"}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {(providers?.length ?? 0) === 0
                ? "Jalankan Research Jobs untuk mengumpulkan data provider AI."
                : "Coba ubah filter atau kata kunci pencarian."
              }
            </p>
          </div>
          {(providers?.length ?? 0) === 0 && (
            <Link to="/research">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/10 transition-all">
                <Activity className="w-4 h-4" /> Jalankan Research
              </button>
            </Link>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground/60 font-mono mb-2">
            {filtered.length} provider — quality score · {activeCount} aktif
          </p>
          {filtered.map((provider, idx) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              rank={idx}
              onInfoClick={() => setSelectedProvider(provider)}
            />
          ))}
        </div>
      )}

      {selectedProvider && (
        <ProviderModal
          provider={selectedProvider}
          open={true}
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </div>
  );
}
