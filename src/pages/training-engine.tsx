import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain, Plus, Loader2, Trash2, RefreshCw, ExternalLink, CheckCircle2,
  AlertTriangle, Sparkles, Power, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "provider_aggregator", label: "Provider/Aggregator AI", emoji: "🤖" },
  { id: "blog_tutorial", label: "Blog/Tutorial", emoji: "📝" },
  { id: "social_media", label: "Sosial Media", emoji: "💬" },
  { id: "news", label: "Berita", emoji: "📰" },
  { id: "promo_code", label: "Promo Code", emoji: "🏷️" },
];

interface TrainingSource {
  id: number;
  url: string;
  category: string;
  categoryLabel: string;
  label: string | null;
  notes: string | null;
  isActive: boolean;
  status: string;
  siteName: string | null;
  summary: string | null;
  knowledge: {
    site_name: string;
    what_it_is: string;
    why_useful: string;
    key_entities: string[];
    search_queries: string[];
    extraction_hints: string[];
    update_frequency: string | null;
    reliability: string | null;
  } | null;
  contentChars: number | null;
  errorMessage: string | null;
  lastLearnedAt: string | null;
  createdAt: string;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request gagal (${res.status})`);
  return data;
}

const STATUS_STYLE: Record<string, string> = {
  learned: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  learning: "bg-primary/10 text-primary border-primary/30",
  pending: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function TrainingEnginePage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]!.id);
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["training-sources"],
    queryFn: () => api<TrainingSource[]>("/api/training-sources"),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["training-sources"] });

  const addSource = useMutation({
    mutationFn: () =>
      api<TrainingSource>("/api/training-sources", {
        method: "POST",
        body: JSON.stringify({ url, category, notes, learnNow: true }),
      }),
    onSuccess: (row) => {
      setUrl("");
      setNotes("");
      invalidate();
      toast(
        row.status === "learned"
          ? { title: "Sumber dipelajari", description: `${row.siteName ?? row.url} — ${row.contentChars?.toLocaleString()} karakter dianalisis.` }
          : { title: "Sumber ditambahkan", description: "Belum berhasil dipelajari — klik Learn untuk mencoba lagi.", variant: "destructive" as const },
      );
    },
    onError: (e: Error) => toast({ title: "Gagal menambah sumber", description: e.message, variant: "destructive" }),
  });

  const learnOne = useMutation({
    mutationFn: (id: number) => api<TrainingSource>(`/api/training-sources/${id}/learn`, { method: "POST" }),
    onSuccess: (row) => {
      invalidate();
      toast(
        row.status === "learned"
          ? { title: "Belajar selesai", description: `${row.siteName ?? row.url} — ${row.knowledge?.search_queries.length ?? 0} query baru dipelajari.` }
          : { title: "Belajar gagal", description: row.errorMessage ?? "Tidak diketahui", variant: "destructive" as const },
      );
    },
    onError: (e: Error) => toast({ title: "Belajar gagal", description: e.message, variant: "destructive" }),
  });

  const learnAll = useMutation({
    mutationFn: () => api<{ message: string }>("/api/training-sources/learn-all", { method: "POST" }),
    onSuccess: (r) => {
      invalidate();
      toast({ title: "Training selesai", description: r.message });
    },
    onError: (e: Error) => toast({ title: "Training gagal", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api<TrainingSource>(`/api/training-sources/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api(`/api/training-sources/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Sumber dihapus" });
    },
  });

  const visible = filter === "all" ? sources : sources.filter((s) => s.category === filter);
  const learnedCount = sources.filter((s) => s.status === "learned").length;
  const queryCount = sources.reduce((acc, s) => acc + (s.knowledge?.search_queries.length ?? 0), 0);

  return (
    <>
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="w-7 h-7 text-primary" />
            Training Engine
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
            Database parameter untuk melatih AI researcher. Masukkan link website per kategori riset — mesin akan
            benar-benar membuka halamannya, menganalisis isinya dengan AI, lalu menyimpan pengetahuan (entitas kunci,
            query pencarian, pola ekstraksi) yang otomatis dipakai saat research dijalankan.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sumber", value: sources.length },
            { label: "Sudah Dipelajari", value: learnedCount },
            { label: "Query Terlatih", value: queryCount },
            { label: "Aktif", value: sources.filter((s) => s.isActive).length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold font-mono mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Add form */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Tambah Sumber Training
          </h2>
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <Input
              placeholder="https://contoh.com/halaman-promo-ai"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Catatan opsional: apa yang harus diperhatikan dari sumber ini…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => addSource.mutate()} disabled={!url.trim() || addSource.isPending}>
              {addSource.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Tambah & Pelajari Sekarang
            </Button>
            <Button variant="outline" onClick={() => learnAll.mutate()} disabled={learnAll.isPending}>
              {learnAll.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Latih Ulang Yang Belum Terpelajari
            </Button>
          </div>
        </section>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {[{ id: "all", label: "Semua", emoji: "✳️" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                filter === c.id
                  ? "bg-primary/10 text-primary border-primary/40"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c.emoji} {c.label}
              {c.id !== "all" && (
                <span className="ml-1.5 font-mono opacity-70">
                  {sources.filter((s) => s.category === c.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat sumber training…
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground text-sm">
            Belum ada sumber training di kategori ini. Tambahkan link website di atas.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-4 flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{s.siteName ?? s.label ?? new URL(s.url).hostname}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase", STATUS_STYLE[s.status] ?? STATUS_STYLE["pending"])}>
                        {s.status}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                        {s.categoryLabel}
                      </span>
                      {!s.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                          nonaktif
                        </span>
                      )}
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1 break-all"
                    >
                      {s.url} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    {s.summary && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.summary}</p>}
                    {s.errorMessage && (
                      <p className="text-xs text-destructive mt-2 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {s.errorMessage}
                      </p>
                    )}
                    {s.status === "learned" && (
                      <p className="text-[11px] text-muted-foreground font-mono mt-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {s.contentChars?.toLocaleString()} char dianalisis · {s.knowledge?.search_queries.length ?? 0} query ·{" "}
                        {s.lastLearnedAt ? new Date(s.lastLearnedAt).toLocaleString("id-ID") : "-"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => learnOne.mutate(s.id)} disabled={learnOne.isPending}>
                      {learnOne.isPending && learnOne.variables === s.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span className="ml-1.5">{s.status === "learned" ? "Re-learn" : "Learn"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title={s.isActive ? "Nonaktifkan" : "Aktifkan"}
                      onClick={() => toggleActive.mutate({ id: s.id, isActive: !s.isActive })}
                    >
                      <Power className={cn("w-3.5 h-3.5", s.isActive ? "text-emerald-400" : "text-muted-foreground")} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(s.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                    {s.knowledge && (
                      <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                        {expanded === s.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>

                {expanded === s.id && s.knowledge && (
                  <div className="border-t border-border bg-muted/30 p-4 space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-foreground mb-1">Apa ini</p>
                      <p className="text-muted-foreground">{s.knowledge.what_it_is}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Kenapa berguna</p>
                      <p className="text-muted-foreground">{s.knowledge.why_useful}</p>
                    </div>
                    {s.knowledge.key_entities.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground mb-1">Entitas kunci</p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.knowledge.key_entities.map((e) => (
                            <span key={e} className="px-2 py-0.5 rounded-md border border-border bg-card">{e}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.knowledge.search_queries.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground mb-1">Query hasil belajar (dipakai saat research)</p>
                        <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground font-mono">
                          {s.knowledge.search_queries.map((q) => <li key={q}>{q}</li>)}
                        </ul>
                      </div>
                    )}
                    {s.knowledge.extraction_hints.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground mb-1">Pola ekstraksi</p>
                        <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                          {s.knowledge.extraction_hints.map((h) => <li key={h}>{h}</li>)}
                        </ul>
                      </div>
                    )}
                    <p className="text-muted-foreground font-mono">
                      Reliability: {s.knowledge.reliability ?? "-"} · Update: {s.knowledge.update_frequency ?? "-"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
