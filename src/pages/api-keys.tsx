import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound, Plus, CheckCircle2, ExternalLink, Loader2,
  Eye, EyeOff, AlertTriangle, ShieldAlert, Package, Upload,
  FileText, XCircle, Trash2, Copy, Check, ChevronDown,
  ChevronUp, RotateCcw, ShieldCheck, ShieldX, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// ─── Provider catalogue ───────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: "gemini", name: "Google Gemini", emoji: "🔵", color: "#4285F4", glow: "rgba(66,133,244,0.25)",
    uses: ["Research", "Structuring"],
    description: "Provider utama. Grounded search + JSON extraction. Bisa tambah banyak key untuk rotasi saat quota habis.",
    free: "1.500 req/hari gratis", getKeyUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIza... / AQ...", prefixes: ["AIza", "AQ"],
  },
  {
    id: "openai", name: "OpenAI", emoji: "⚫", color: "#10a37f", glow: "rgba(16,163,127,0.25)",
    uses: ["Structuring"],
    description: "Fallback untuk fase structuring (JSON extraction). Gunakan GPT-4o-mini yang murah.",
    free: "$5 trial credits", getKeyUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-...", prefixes: ["sk-"],
  },
  {
    id: "tavily", name: "Tavily", emoji: "🟠", color: "#ff6b35", glow: "rgba(255,107,53,0.25)",
    uses: ["Research"],
    description: "Search API populer untuk AI agents. Alternatif research saat Gemini habis.",
    free: "1.000 search/bulan gratis", getKeyUrl: "https://app.tavily.com/",
    placeholder: "tvly-...", prefixes: ["tvly-"],
  },
  {
    id: "exa", name: "Exa", emoji: "🟣", color: "#7c3aed", glow: "rgba(124,58,237,0.25)",
    uses: ["Research"],
    description: "Neural search engine, hasilnya sangat relevan untuk riset AI providers.",
    free: "1.000 search/bulan gratis", getKeyUrl: "https://dashboard.exa.ai/api-keys",
    placeholder: "exa-...", prefixes: ["exa-"],
  },
  {
    id: "firecrawl", name: "Firecrawl", emoji: "🔴", color: "#ef4444", glow: "rgba(239,68,68,0.25)",
    uses: ["Research"],
    description: "Web scraping + search API. Cocok untuk mengambil konten lengkap halaman AI provider.",
    free: "500 halaman/bulan gratis", getKeyUrl: "https://www.firecrawl.dev/",
    placeholder: "fc-...", prefixes: ["fc-"],
  },
  {
    id: "serper", name: "Serper (Google Search)", emoji: "🟡", color: "#f59e0b", glow: "rgba(245,158,11,0.25)",
    uses: ["Research"],
    description: "Akses Google Search via API. Hasil langsung dari Google, sangat akurat.",
    free: "2.500 query/bulan gratis", getKeyUrl: "https://serper.dev/",
    placeholder: "your-serper-key", prefixes: [],
  },
  {
    id: "perplexity", name: "Perplexity", emoji: "🔷", color: "#06b6d4", glow: "rgba(6,182,212,0.25)",
    uses: ["Research", "Structuring"],
    description: "AI-powered search + LLM. Bisa dipakai untuk research DAN structuring saat Gemini/OpenAI habis quota.",
    free: "$5 trial API credits", getKeyUrl: "https://www.perplexity.ai/settings/api",
    placeholder: "pplx-...", prefixes: ["pplx-"],
  },
  {
    id: "groq", name: "Groq", emoji: "⚡", color: "#f97316", glow: "rgba(249,115,22,0.25)",
    uses: ["Structuring"],
    description: "Inferensi LLM GRATIS dan super cepat (Llama 3.3 70B). Rekomendasi sebagai fallback structuring.",
    free: "GRATIS — 14.400 req/hari", getKeyUrl: "https://console.groq.com/keys",
    placeholder: "gsk_...", prefixes: ["gsk_"],
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

function validateKeyFormat(providerId: string, key: string): boolean {
  const provider = PROVIDERS.find((p) => p.id === providerId);
  if (!provider || provider.prefixes.length === 0) return true;
  return provider.prefixes.some((prefix) => key.startsWith(prefix));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── API types ────────────────────────────────────────────────────────────────
interface ApiKeyRecord {
  id: number;
  provider: string;
  label: string;
  apiKey: string;
  prefixValid: boolean;
  isActive: boolean;
  createdAt: string;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Key Detail Row ───────────────────────────────────────────────────────────
function KeyDetailRow({ record, accentColor, index }: { record: ApiKeyRecord; accentColor: string; index: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/api/api-keys/${record.id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["api-keys"] }); toast({ title: "Key dihapus" }); },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  async function handleCopy() {
    await navigator.clipboard.writeText(record.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5 transition-all hover:border-border/60">
      {/* Top row: order chip + masked key + validity */}
      <div className="flex items-center gap-2 mb-2">
        {/* Auto-rotate order badge */}
        <span
          className="text-[9px] font-black shrink-0 w-6 h-5 flex items-center justify-center rounded border font-mono"
          style={{ borderColor: `${accentColor}30`, background: `${accentColor}10`, color: accentColor }}
          title={`Urutan rotasi ke-${index + 1}`}
        >
          #{index + 1}
        </span>
        <code className="flex-1 text-[11px] font-mono text-muted-foreground truncate">{record.apiKey}</code>

        {/* Validity badge */}
        {record.prefixValid ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 shrink-0">
            <ShieldCheck className="w-3 h-3" /> Format OK
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-medium text-red-400 shrink-0">
            <ShieldX className="w-3 h-3" /> Format Error
          </span>
        )}
      </div>

      {/* Bottom row: date + actions */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
          <Calendar className="w-3 h-3" />
          {formatDate(record.createdAt)}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Copy key"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Delete single */}
          <button
            onClick={() => { if (confirm(`Hapus key #${index + 1}?`)) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
            className="p-1.5 rounded hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
            title="Hapus key ini"
          >
            {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Format error hint */}
      {!record.prefixValid && (
        <div className="mt-2 text-[10px] text-red-400/80 leading-relaxed">
          ⚠️ Format key tidak sesuai — periksa atau ganti key ini. Key mungkin tidak berfungsi saat research dijalankan.
        </div>
      )}
    </div>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────
function ProviderCard({ provider, keys, onAdd }: {
  provider: (typeof PROVIDERS)[number];
  keys: ApiKeyRecord[];
  onAdd: (id: ProviderId) => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const keyCount = keys.length;
  const hasKeys = keyCount > 0;
  const invalidCount = keys.filter((k) => !k.prefixValid).length;

  const deleteAllMutation = useMutation({
    mutationFn: () => apiFetch(`/api/api-keys/by-provider/${provider.id}`, { method: "DELETE" }),
    onSuccess: (data: { deleted: number }) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: `Semua key ${provider.name} dihapus`, description: `${data.deleted} key berhasil dihapus.` });
      setDeletingAll(false);
      setExpanded(false);
    },
    onError: (e: Error) => {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
      setDeletingAll(false);
    },
  });

  return (
    <div
      className="rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col transition-all duration-300 hover:border-[var(--accent-40)]"
      style={{ "--accent-40": `${provider.color}40` } as React.CSSProperties}
    >
      {/* Accent strip */}
      <div className="h-[3px] w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${provider.color}, ${provider.color}66, transparent)` }} />

      {/* Header */}
      <div className="px-4 pt-4 pb-3"
        style={{ background: `linear-gradient(135deg, ${provider.color}0d 0%, transparent 60%)` }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border"
              style={{ borderColor: `${provider.color}30`, background: `${provider.color}15`, boxShadow: `0 0 12px ${provider.glow}` }}>
              {provider.emoji}
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground leading-tight">{provider.name}</h3>
              <div className="flex gap-1 mt-1 flex-wrap">
                {provider.uses.map((u) => (
                  <span key={u} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                    style={{ borderColor: `${provider.color}40`, background: `${provider.color}12`, color: provider.color }}>
                    {u.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: key count + auto-rotate status */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border"
              style={{
                borderColor: hasKeys ? `${provider.color}30` : "var(--border)",
                background: hasKeys ? `${provider.color}10` : "transparent",
                color: hasKeys ? provider.color : "var(--muted-foreground)",
              }}>
              <Package className="w-3 h-3" />
              {keyCount} key{keyCount !== 1 ? "s" : ""}
            </div>
            {hasKeys ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <RotateCcw className="w-3 h-3" /> Auto-rotate
              </span>
            ) : null}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-2.5 leading-relaxed">{provider.description}</p>

        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[10px] font-mono text-emerald-400/80">✦ {provider.free}</span>
          <a href={provider.getKeyUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
            Dapatkan key <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Invalid key warning */}
      {invalidCount > 0 && (
        <div className="mx-3 mb-2 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
          <ShieldX className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-400 leading-relaxed">
            {invalidCount} key memiliki format yang tidak sesuai — klik Lihat untuk detail.
          </p>
        </div>
      )}

      {/* View toggle + expanded key list */}
      {hasKeys && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/25 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            <span className="flex items-center gap-1.5">
              {expanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {expanded ? "Sembunyikan" : `Lihat ${keyCount} key`}
            </span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {/* Auto-rotate info banner */}
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/20 border border-border/30">
                <RotateCcw className="w-3 h-3 text-primary/60 shrink-0" />
                <p className="text-[10px] text-muted-foreground/70">
                  Key dipakai berurutan (#1 → #2 → …). Jika satu limit, sistem otomatis lanjut ke berikutnya.
                </p>
              </div>

              {keys.map((k, i) => (
                <KeyDetailRow key={k.id} record={k} accentColor={provider.color} index={i} />
              ))}

              {/* Delete All for this provider */}
              {!deletingAll ? (
                <button
                  onClick={() => setDeletingAll(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/20 text-[11px] font-semibold text-red-400/70 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 transition-all mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus semua key {provider.name}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-[10px] text-red-400 flex-1">Hapus semua {keyCount} key {provider.name}?</p>
                  <button
                    onClick={() => deleteAllMutation.mutate()}
                    disabled={deleteAllMutation.isPending}
                    className="text-[10px] px-2 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-400 font-bold hover:bg-red-500/30 transition-all shrink-0"
                  >
                    {deleteAllMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ya, Hapus"}
                  </button>
                  <button
                    onClick={() => setDeletingAll(false)}
                    disabled={deleteAllMutation.isPending}
                    className="text-[10px] px-2 py-1 rounded border border-border/40 text-muted-foreground hover:text-foreground transition-all shrink-0"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add button */}
      <div className="px-3 pb-3 pt-1 mt-auto">
        <button
          onClick={() => onAdd(provider.id as ProviderId)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed text-sm font-medium transition-all duration-200"
          style={{ borderColor: `${provider.color}30`, color: `${provider.color}99` }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = `${provider.color}70`; el.style.color = provider.color; el.style.background = `${provider.color}08`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = `${provider.color}30`; el.style.color = `${provider.color}99`; el.style.background = "";
          }}
        >
          <Plus className="w-4 h-4" /> Tambah key
        </button>
      </div>
    </div>
  );
}

// ─── Reset All Dialog ─────────────────────────────────────────────────────────
function ResetAllDialog({ open, totalKeys, onClose }: { open: boolean; totalKeys: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const resetMutation = useMutation({
    mutationFn: () => apiFetch("/api/api-keys", { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "Semua API key dihapus", description: `${totalKeys} key berhasil dihapus.` });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !resetMutation.isPending) onClose(); }}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <RotateCcw className="w-5 h-5" />
            Reset Semua API Key
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {/* Warning box */}
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-red-400">Peringatan! Tindakan ini tidak bisa dibatalkan.</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Seluruh <span className="font-bold text-foreground">{totalKeys} API key</span> dari semua provider
                akan dihapus permanen. Sistem tidak akan bisa menjalankan research sampai Anda menambahkan key baru.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Ketik <span className="font-mono font-bold text-foreground">RESET</span> untuk konfirmasi.
          </p>
          <ConfirmInput onConfirmed={() => resetMutation.mutate()} isPending={resetMutation.isPending} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={resetMutation.isPending}>
            Batal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmInput({ onConfirmed, isPending }: { onConfirmed: () => void; isPending: boolean }) {
  const [value, setValue] = useState("");
  const confirmed = value === "RESET";
  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ketik RESET"
        className={cn(
          "font-mono bg-background border-border",
          confirmed ? "border-red-500/60" : "",
        )}
        disabled={isPending}
      />
      <Button
        variant="destructive"
        onClick={onConfirmed}
        disabled={!confirmed || isPending}
        className="shrink-0"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </Button>
    </div>
  );
}

// ─── Add Key Dialog ───────────────────────────────────────────────────────────
function AddKeyDialog({ open, defaultProvider, onClose }: {
  open: boolean; defaultProvider?: ProviderId | undefined; onClose: () => void;
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [provider, setProvider] = useState<string>(defaultProvider ?? "gemini");
  const [apiKey, setApiKey] = useState("");
  const [setActive, setSetActive] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const abortRef = useRef(false);

  useEffect(() => { if (open && defaultProvider) setProvider(defaultProvider); }, [open, defaultProvider]);
  useEffect(() => {
    if (open) { setApiKey(""); setShowKey(false); setBulkText(""); setBulkProgress(null); abortRef.current = false; }
  }, [open]);

  const qc = useQueryClient();
  const { toast } = useToast();
  const providerMeta = PROVIDERS.find((p) => p.id === provider);
  const singleFormatValid = apiKey.trim().length === 0 || validateKeyFormat(provider, apiKey.trim());

  const addMutation = useMutation({
    mutationFn: () => apiFetch("/api/api-keys", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey: apiKey.trim(), setActive }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "API key ditambahkan", description: `Key berhasil disimpan untuk ${providerMeta?.name}.` });
      setApiKey(""); onClose();
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const parsedBulkKeys = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
  const bulkValid = parsedBulkKeys.filter((k) => validateKeyFormat(provider, k));
  const bulkInvalid = parsedBulkKeys.filter((k) => !validateKeyFormat(provider, k));
  const hasPrefixCheck = (providerMeta?.prefixes.length ?? 0) > 0;
  const isBulkRunning = bulkProgress !== null;

  async function handleBulkSubmit() {
    if (bulkValid.length === 0) return;
    abortRef.current = false;
    setBulkProgress({ done: 0, total: bulkValid.length });
    let savedCount = 0; let errorCount = 0;
    for (let i = 0; i < bulkValid.length; i++) {
      if (abortRef.current) break;
      try {
        await apiFetch("/api/api-keys", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, apiKey: bulkValid[i], setActive: i === 0 }),
        });
        savedCount++;
      } catch { errorCount++; }
      setBulkProgress({ done: i + 1, total: bulkValid.length });
    }
    qc.invalidateQueries({ queryKey: ["api-keys"] });
    setBulkProgress(null);
    if (errorCount === 0) {
      toast({ title: `${savedCount} key berhasil disimpan`, description: `Provider: ${providerMeta?.name}` });
    } else {
      toast({ title: `${savedCount} berhasil, ${errorCount} gagal`, variant: "destructive" });
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isBulkRunning) onClose(); }}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <KeyRound className="w-5 h-5 text-primary" /> Tambah API Key
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
            <button onClick={() => setMode("single")}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2 transition-colors",
                mode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}>
              <FileText className="w-3.5 h-3.5" /> Single
            </button>
            <button onClick={() => setMode("bulk")}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2 transition-colors border-l border-border",
                mode === "bulk" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}>
              <Upload className="w-3.5 h-3.5" /> Bulk Import
            </button>
          </div>

          {/* Provider selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Provider</label>
            <Select value={provider} onValueChange={(v) => { setProvider(v); setApiKey(""); setBulkText(""); }}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Single mode */}
          {mode === "single" && (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API Key</label>
                  {providerMeta && (
                    <a href={providerMeta.getKeyUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1">
                      Dapatkan key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Input type={showKey ? "text" : "password"} placeholder={providerMeta?.placeholder ?? "your-api-key"}
                    value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                    className={cn("bg-background border-border pr-10 font-mono text-sm",
                      !singleFormatValid && "border-red-500/60 focus-visible:ring-red-500/30")} />
                  <button type="button" onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!singleFormatValid && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-400">
                      Format tidak sesuai. Seharusnya diawali{" "}
                      <span className="font-mono font-bold">{providerMeta?.prefixes.join(" / ")}</span>.
                    </p>
                  </div>
                )}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setSetActive((v) => !v)}
                  className={cn("w-9 h-5 rounded-full border-2 relative transition-all duration-200",
                    setActive ? "bg-primary border-primary" : "bg-muted border-border")}>
                  <div className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200",
                    setActive ? "left-[calc(100%-16px)]" : "left-0.5")} />
                </div>
                <span className="text-sm text-foreground">Jadikan aktif sekarang</span>
              </label>
            </>
          )}

          {/* Bulk mode */}
          {mode === "bulk" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paste Keys (satu per baris)</label>
                  {providerMeta && (
                    <a href={providerMeta.getKeyUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1">
                      Dapatkan key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <Textarea
                  placeholder={`${providerMeta?.placeholder ?? "apikey1"}\n${providerMeta?.placeholder ?? "apikey2"}\n...`}
                  value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                  className="bg-background border-border font-mono text-xs min-h-[140px] resize-none leading-relaxed"
                  disabled={isBulkRunning} />
              </div>

              {parsedBulkKeys.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {hasPrefixCheck ? bulkValid.length : parsedBulkKeys.length} key valid
                    </span>
                    {hasPrefixCheck && bulkInvalid.length > 0 && (
                      <span className="flex items-center gap-1.5 text-red-400 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        {bulkInvalid.length} format salah (dilewati)
                      </span>
                    )}
                  </div>
                  {hasPrefixCheck && bulkInvalid.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Key {providerMeta?.name} harus diawali{" "}
                      <span className="font-mono font-bold text-foreground">{providerMeta?.prefixes.join(" / ")}</span>
                    </p>
                  )}
                </div>
              )}

              {isBulkRunning && bulkProgress && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Menyimpan key {bulkProgress.done} / {bulkProgress.total}...
                    </span>
                    <button onClick={() => { abortRef.current = true; }} className="text-red-400 hover:text-red-300">
                      Batalkan
                    </button>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground">
                Key pertama yang valid akan otomatis dijadikan aktif. Sisanya disimpan sebagai cadangan rotasi.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isBulkRunning || addMutation.isPending}>Batal</Button>
          {mode === "single" ? (
            <Button onClick={() => addMutation.mutate()} disabled={!apiKey.trim() || !singleFormatValid || addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Simpan Key
            </Button>
          ) : (
            <Button onClick={handleBulkSubmit} disabled={bulkValid.length === 0 || isBulkRunning}>
              {isBulkRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {isBulkRunning ? "Menyimpan..." : `Import ${hasPrefixCheck ? bulkValid.length : parsedBulkKeys.length} Key`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApiKeysPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogProvider, setAddDialogProvider] = useState<ProviderId | undefined>();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const { data: keys = [], isLoading, error } = useQuery<ApiKeyRecord[]>({
    queryKey: ["api-keys"],
    queryFn: () => apiFetch("/api/api-keys"),
    refetchInterval: 10_000,
  });

  const keysByProvider = (id: string) => keys.filter((k) => k.provider === id);
  const totalKeys = keys.length;
  const activeCount = keys.filter((k) => k.isActive).length;
  const providersCovered = [...new Set(keys.filter((k) => k.isActive).map((k) => k.provider))].length;

  function openAdd(id?: ProviderId) { setAddDialogProvider(id); setAddDialogOpen(true); }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-muted-foreground uppercase mb-2">
            <KeyRound className="w-3.5 h-3.5 text-primary" /> API KEY MANAGER
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">API Keys</span>{" "}
            <span className="text-foreground">& Providers</span>
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Kelola API key dari berbagai provider. Tambah banyak key Gemini untuk rotasi otomatis, atau pakai Tavily / Exa / Firecrawl sebagai alternatif research.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalKeys > 0 && (
            <Button variant="outline" onClick={() => setResetDialogOpen(true)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset Semua
            </Button>
          )}
          <Button onClick={() => openAdd()}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Key
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Stok Key", value: totalKeys, color: "text-primary" },
          { label: "Keys Aktif", value: activeCount, color: "text-emerald-400" },
          { label: "Provider Siap", value: `${providersCovered}/8`, color: "text-cyan-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card px-4 py-3">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{s.label}</div>
            <div className={cn("text-2xl font-black font-mono mt-0.5", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground leading-relaxed space-y-1">
        <div><span className="font-semibold text-foreground">🔍 Research:</span> Gemini → Tavily → Exa → Firecrawl → Serper → Perplexity</div>
        <div><span className="font-semibold text-foreground">🧩 Structuring:</span> Gemini → OpenAI → Perplexity → <span className="text-orange-400 font-semibold">Groq (GRATIS!)</span></div>
        <div className="text-[11px] mt-1.5 text-muted-foreground/70">
          Semua key per provider dicoba secara berurutan sebelum loncat ke provider berikutnya.
          Klik <span className="font-semibold text-foreground">View</span> di tiap card untuk melihat detail key, status format, dan tanggal ditambahkan.
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat API keys...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-red-400 text-sm">
          Gagal memuat API keys: {(error as Error).message}
        </div>
      )}

      {/* Provider grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {PROVIDERS.map((p) => (
            <ProviderCard key={p.id} provider={p} keys={keysByProvider(p.id)} onAdd={openAdd} />
          ))}
        </div>
      )}

      <AddKeyDialog open={addDialogOpen} defaultProvider={addDialogProvider} onClose={() => setAddDialogOpen(false)} />
      <ResetAllDialog open={resetDialogOpen} totalKeys={totalKeys} onClose={() => setResetDialogOpen(false)} />
    </div>
  );
}
