import { useRef } from "react";
import { useListProviders, useGetProvidersSummary, useGetResearchStatus, getGetResearchStatusQueryKey } from "@/lib/api-client";
import { ProviderCard } from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, Loader2, Zap, Video, CreditCard, Activity,
  Database, Wifi, Globe2, TrendingUp, Flame, BookOpen,
  Share2, Film, Newspaper, LayoutGrid,
} from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type EntityTab = "ai_provider" | "blog" | "video" | "social_media" | "news" | "aggregator" | "other";

const ENTITY_TABS: { id: EntityTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: "ai_provider",  label: "Provider AI",  icon: Database,    color: "bg-primary text-primary-foreground" },
  { id: "blog",         label: "Blog",          icon: BookOpen,    color: "bg-amber-600 text-white" },
  { id: "video",        label: "Video",         icon: Film,        color: "bg-red-600 text-white" },
  { id: "social_media", label: "Sosial Media",  icon: Share2,      color: "bg-pink-600 text-white" },
  { id: "news",         label: "Berita",        icon: Newspaper,   color: "bg-sky-600 text-white" },
  { id: "aggregator",   label: "Agregator",     icon: LayoutGrid,  color: "bg-violet-600 text-white" },
];

const CATEGORY_FILTERS: { id: string; label: string }[] = [
  { id: "all",        label: "Semua" },
  { id: "Video AI",   label: "Video AI" },
  { id: "Image AI",   label: "Image AI" },
  { id: "LLM",        label: "LLM" },
  { id: "Multimodal", label: "Multimodal" },
  { id: "Audio AI",   label: "Audio AI" },
  { id: "kling",      label: "🎬 Kling" },
  { id: "nocc",       label: "No CC" },
];

function StatCard({ label, value, icon: Icon, accent, sub, active, onClick }: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  accent: string;
  sub?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl border bg-card overflow-hidden px-3 py-3 md:px-5 md:py-4 flex flex-col gap-0.5 text-left w-full transition-all duration-200",
        onClick ? "cursor-pointer hover:scale-[1.03] active:scale-[0.98]" : "cursor-default",
        active
          ? "border-primary/60 ring-1 ring-primary/30 shadow-[0_0_16px_rgba(0,240,255,0.12)]"
          : "border-border/60 hover:border-border/80"
      )}
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 md:w-28 md:h-28 rounded-full blur-2xl opacity-20 bg-current" />
      <div className={cn("flex items-center gap-1.5 text-[10px] md:text-xs font-semibold uppercase tracking-wider", accent)}>
        <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" /> {label}
      </div>
      <div className="text-3xl md:text-4xl font-black font-mono leading-none mt-0.5">
        {value === undefined
          ? <div className="h-8 md:h-10 w-14 bg-muted/50 animate-pulse rounded-lg" />
          : <span className={accent}>{value}</span>}
      </div>
      {sub && <p className="text-[9px] md:text-[10px] text-muted-foreground">{sub}</p>}
      {onClick && (
        <p className="text-[9px] text-muted-foreground/50 mt-0.5 font-mono">
          {active ? "✓ aktif" : "klik untuk filter"}
        </p>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [entityTab, setEntityTab] = useState<EntityTab>("ai_provider");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeOnly, setActiveOnly] = useState(false);

  const { data: summary } = useGetProvidersSummary();
  const { data: researchStatus } = useGetResearchStatus({
    query: {
      queryKey: getGetResearchStatusQueryKey(),
      refetchInterval: (query) => {
        const s = query.state.data?.status;
        return s === "pending" || s === "running" ? 2000 : false;
      },
    },
  });

  const isResearching = researchStatus?.status === "pending" || researchStatus?.status === "running";

  const { data: providers, isLoading: isProvidersLoading } = useListProviders({
    entity_type: entityTab,
    has_kling: categoryFilter === "kling" ? true : undefined,
  } as Parameters<typeof useListProviders>[0]);

  const filtered = providers?.filter((p) => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q) && !(p.description ?? "").toLowerCase().includes(q)) return false;
    if (categoryFilter === "nocc" && p.requires_credit_card) return false;
    if (categoryFilter !== "all" && categoryFilter !== "kling" && categoryFilter !== "nocc") {
      if (p.category !== categoryFilter) return false;
    }
    if (activeOnly && p.status !== "active") return false;
    return true;
  });

  const lastScan = researchStatus?.completed_at
    ? new Date(researchStatus.completed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "Belum ada";

  function scrollToGrid() {
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function handleStatClick(filter: "all" | "kling" | "nocc" | "active") {
    setEntityTab("ai_provider");
    setSearch("");
    if (filter === "active") {
      setCategoryFilter("all");
      setActiveOnly((prev) => !prev);
    } else {
      setActiveOnly(false);
      setCategoryFilter((prev) => prev === filter ? "all" : filter);
    }
    scrollToGrid();
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe2 className="w-5 h-5 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Provider Intel</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Free Credits</span>{" "}
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Tracker real-time kredit gratis AI provider dari seluruh dunia — diperbarui otomatis via AI research.
          </p>
        </div>
        <Link to="/research">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-mono cursor-pointer transition-all",
            isResearching
              ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_20px_rgba(0,240,255,0.15)]"
              : "bg-card border-border/60 hover:border-border text-muted-foreground hover:text-foreground",
          )}>
            {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            {isResearching ? "SCANNING..." : `Last scan: ${lastScan}`}
          </div>
        </Link>
      </div>

      {/* Stats — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Tracked" value={summary?.total_providers}
          icon={Database} accent="text-primary" sub="total hasil research"
          active={categoryFilter === "all" && !activeOnly}
          onClick={() => handleStatClick("all")}
        />
        <StatCard
          label="Kling Support" value={summary?.kling_providers}
          icon={Video} accent="text-cyan-400" sub="motion control"
          active={categoryFilter === "kling"}
          onClick={() => handleStatClick("kling")}
        />
        <StatCard
          label="Active" value={summary?.active_providers}
          icon={Zap} accent="text-emerald-400" sub="offer masih aktif"
          active={activeOnly}
          onClick={() => handleStatClick("active")}
        />
        <StatCard
          label="No CC" value={summary?.no_credit_card_required}
          icon={CreditCard} accent="text-violet-400" sub="tanpa kartu kredit"
          active={categoryFilter === "nocc"}
          onClick={() => handleStatClick("nocc")}
        />
      </div>

      {/* Main content panel */}
      <div ref={gridRef} className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">

        {/* Entity-type tab bar */}
        <div className="px-5 pt-4 border-b border-border/50">
          <div className="flex items-center gap-1 overflow-x-auto pb-0 scrollbar-none">
            {ENTITY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = entityTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setEntityTab(tab.id); setCategoryFilter("all"); setActiveOnly(false); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap border border-transparent border-b-0 transition-all duration-150 mb-[-1px]",
                    isActive
                      ? `${tab.color} border-border/60 border-b-card`
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-border/40 bg-muted/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {entityTab === "ai_provider" ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeOnly && (
                <button
                  onClick={() => setActiveOnly(false)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                >
                  ✓ Active only ×
                </button>
              )}
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setCategoryFilter(f.id); setActiveOnly(false); }}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all",
                    categoryFilter === f.id
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground bg-transparent",
                  )}
                >
                  {f.id === "nocc" ? (
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {f.label}</span>
                  ) : f.id === "kling" ? (
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {f.label}</span>
                  ) : f.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">
              {entityTab === "blog" && "Konten blog/artikel yang membahas kredit gratis AI."}
              {entityTab === "video" && "Video YouTube atau tutorial yang membahas kredit gratis AI."}
              {entityTab === "social_media" && "Postingan sosial media terkait kredit gratis AI."}
              {entityTab === "news" && "Berita & press release tentang AI provider."}
              {entityTab === "aggregator" && "Direktori & agregator tools AI."}
            </p>
          )}

          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari nama, kategori, deskripsi…"
              className="pl-9 h-9 bg-background/60 border-border/50 text-sm focus-visible:ring-primary/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Provider grid */}
        <div className="p-5">
          {isProvidersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 rounded-xl bg-muted/20 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <>
              <p className="text-[11px] text-muted-foreground/60 mb-4 font-mono">
                {filtered.length} item ditemukan
                {search && ` · filter: "${search}"`}
                {categoryFilter !== "all" && ` · kategori: ${categoryFilter}`}
                {activeOnly && ` · active only`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24 rounded-xl border border-dashed border-border/40">
              <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Tidak ada data</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-5">
                {providers?.length === 0
                  ? "Belum ada data di kategori ini. Jalankan Research Jobs untuk mengumpulkan data."
                  : "Tidak ada item yang cocok dengan filter saat ini."}
              </p>
              {search || categoryFilter !== "all" || activeOnly ? (
                <Button variant="outline" size="sm" onClick={() => { setSearch(""); setCategoryFilter("all"); setActiveOnly(false); }}>
                  Hapus semua filter
                </Button>
              ) : (
                <Link to="/research">
                  <Button variant="outline" size="sm">
                    <Activity className="w-3.5 h-3.5 mr-2" /> Jalankan Research
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
