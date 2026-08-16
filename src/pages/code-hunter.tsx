import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Tag, Copy, CheckCheck, ExternalLink,
  Search, AlertCircle, CheckCircle2, Clock,
  RefreshCw, Shield, Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PromoCode {
  id: number;
  provider_name: string;
  provider_url: string | null;
  code: string;
  description: string;
  discount_type: string | null;
  discount_value: string | null;
  source_url: string | null;
  source_name: string | null;
  expires_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ensureUrl(url: string | null): string {
  if (!url) return "#";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const DISCOUNT_TYPE_COLORS: Record<string, string> = {
  percentage: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  free_credits: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  free_trial: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  fixed_amount: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  other: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

// ─── Code Card ────────────────────────────────────────────────────────────────
function CodeCard({ code }: { code: PromoCode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code.code]);

  const isActive = code.status === "active";
  const isExpired = code.status === "expired";
  const typeColor = DISCOUNT_TYPE_COLORS[code.discount_type ?? "other"] ?? DISCOUNT_TYPE_COLORS["other"];

  const expiryDate = code.expires_at ? new Date(code.expires_at) : null;
  const isExpiredDate = expiryDate ? expiryDate < new Date() : false;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200",
        "hover:scale-[1.01] hover:-translate-y-0.5",
        isExpired || isExpiredDate
          ? "border-border/30 opacity-60"
          : "border-border/60 hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,240,255,0.08)]"
      )}
    >
      {/* Top accent strip */}
      <div
        className="h-[2px] w-full"
        style={{
          background: isActive
            ? "linear-gradient(90deg, #00f0ff, #00f0ff88, transparent)"
            : isExpired
            ? "linear-gradient(90deg, #6b7280, transparent)"
            : "linear-gradient(90deg, #f59e0b, #f59e0b88, transparent)",
        }}
      />

      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-sm text-foreground truncate">{code.provider_name}</div>
            {code.discount_value && (
              <div className="text-xs text-primary font-mono font-semibold mt-0.5">{code.discount_value}</div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {code.discount_type && (
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wide", typeColor)}>
                {code.discount_type.replace("_", " ")}
              </span>
            )}
            <span
              className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wide",
                isActive ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : isExpired ? "border-red-500/30 bg-red-500/10 text-red-400/70"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-400"
              )}
            >
              {code.status}
            </span>
          </div>
        </div>

        {/* Code box */}
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200 group w-full text-left",
            "border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50",
          )}
        >
          <span className="font-mono font-black text-base tracking-widest text-primary">
            {code.code}
          </span>
          <span className={cn(
            "text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors",
            copied ? "text-emerald-400" : "text-muted-foreground group-hover:text-primary"
          )}>
            {copied
              ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</>
              : <><Copy className="w-3.5 h-3.5" /> Copy</>
            }
          </span>
        </button>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">{code.description}</p>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
          <div className="flex items-center gap-2 min-w-0">
            {code.source_name && (
              <span className="flex items-center gap-1 truncate">
                <Shield className="w-3 h-3 shrink-0" />
                {code.source_url
                  ? <a href={ensureUrl(code.source_url)} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline underline-offset-2 truncate">{code.source_name}</a>
                  : code.source_name
                }
              </span>
            )}
            {expiryDate && (
              <span className={cn("flex items-center gap-0.5 shrink-0", isExpiredDate ? "text-red-400/70" : "text-muted-foreground")}>
                <Clock className="w-3 h-3" />
                {isExpiredDate ? "Expired" : `Exp ${expiryDate.toLocaleDateString()}`}
              </span>
            )}
          </div>
          {code.provider_url && (
            <a
              href={ensureUrl(code.provider_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 hover:text-primary transition-colors shrink-0"
            >
              Visit <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CodeHunterPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "unverified" | "expired">("all");

  const fetchCodes = useCallback(async () => {
    try {
      const r = await fetch("/api/codes");
      if (r.ok) setCodes(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  // Filter + search
  const filtered = codes.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.provider_name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCodes = codes.filter((c) => c.status === "active").length;
  const unverifiedCodes = codes.filter((c) => c.status === "unverified").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          <Tag className="w-3.5 h-3.5" /> CODE HUNTER
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-primary">Promo</span>{" "}
          <span className="text-foreground">Codes</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kode promo & diskon aktif dari berbagai platform AI — dicari & diverifikasi via AI.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Kode", value: codes.length, icon: Tag, accent: "text-primary" },
          { label: "Aktif", value: activeCodes, icon: CheckCircle2, accent: "text-emerald-400" },
          { label: "Belum Diverifikasi", value: unverifiedCodes, icon: AlertCircle, accent: "text-amber-400" },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card px-4 py-3 flex items-center gap-3">
            <Icon className={cn("w-4 h-4 shrink-0", accent)} />
            <div>
              <div className={cn("text-2xl font-black font-mono", accent)}>{value}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-muted/20 rounded-lg p-1 border border-border/40">
          {(["all", "active", "unverified", "expired"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-md transition-all capitalize",
                filterStatus === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "Semua" : s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-40 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari provider atau kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <button
          onClick={fetchCodes}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} kode
        </span>
      </div>

      {/* Empty state */}
      {!loading && codes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-full border border-border/60 bg-muted/20 flex items-center justify-center">
            <Gift className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Belum ada kode promo</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Pergi ke <strong>Research Jobs</strong> dan pilih target <em>Promo Codes</em> untuk mencari kode aktif dari Reddit, deal sites, dan sumber resmi provider AI.
            </p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-card h-52 animate-pulse" />
          ))}
        </div>
      )}

      {/* Code grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <CodeCard key={c.id} code={c} />
          ))}
        </div>
      )}

      {/* No results from search */}
      {!loading && codes.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Tidak ada kode yang cocok dengan pencarian &quot;{search}&quot;
        </div>
      )}
    </div>
  );
}
