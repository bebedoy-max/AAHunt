import { useGetResearchHistory, useTriggerResearch, useGetResearchStatus, useResetAllData, getGetResearchStatusQueryKey, getGetResearchHistoryQueryKey } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Terminal, Activity, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, Database, Tag, FileText, Trash2, Square } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

const TARGET_OPTIONS = [
  {
    id: "providers",
    label: "AI Providers",
    description: "Scan 3 waves of AI provider directories for free credit offers",
    icon: Database,
  },
  {
    id: "codes",
    label: "Promo Codes",
    description: "Hunt Reddit, AppSumo, and community sites for discount codes",
    icon: Tag,
  },
  {
    id: "content",
    label: "Blog & Content",
    description: "Include blog posts, videos, and tutorials in provider results",
    icon: FileText,
  },
];

function parseTargets(targetsJson?: string | null): string[] {
  if (!targetsJson) return ["providers", "codes", "content"];
  try {
    const parsed = JSON.parse(targetsJson);
    return Array.isArray(parsed) ? parsed : ["providers", "codes", "content"];
  } catch {
    return ["providers", "codes", "content"];
  }
}

export default function ResearchPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTargets, setSelectedTargets] = useState<string[]>(["providers", "codes", "content"]);

  const triggerResearch = useTriggerResearch({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Research Job Dimulai",
          description: "Sistem sedang memindai provider baru dan memperbarui data yang ada.",
        });
        queryClient.invalidateQueries({ queryKey: getGetResearchStatusQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetResearchHistoryQueryKey() });
      },
      onError: () => {
        toast({
          title: "Gagal memulai research",
          description: "Terjadi kesalahan. Silakan coba lagi.",
          variant: "destructive",
        });
      },
    },
  });

  const resetData = useResetAllData({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Data berhasil direset",
          description: `Dihapus: ${data.providers_deleted ?? 0} provider, ${data.codes_deleted ?? 0} kode promo.`,
        });
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast({
          title: "Gagal reset data",
          description: "Terjadi kesalahan. Coba lagi.",
          variant: "destructive",
        });
      },
    },
  });

  const stopResearch = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/research/stop", { method: "POST" });
      if (!res.ok) throw new Error("stop failed");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Research dihentikan",
        description: "Proses research yang sedang berjalan sudah dihentikan.",
      });
      queryClient.invalidateQueries({ queryKey: getGetResearchStatusQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetResearchHistoryQueryKey() });
    },
    onError: () => {
      toast({
        title: "Gagal menghentikan research",
        description: "Terjadi kesalahan. Coba lagi.",
        variant: "destructive",
      });
    },
  });

  const { data: currentStatus, isLoading: isStatusLoading } = useGetResearchStatus({
    query: {
      queryKey: getGetResearchStatusQueryKey(),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "pending" || status === "running" ? 3000 : false;
      },
    },
  });

  const { data: history, isLoading: isHistoryLoading } = useGetResearchHistory({
    query: {
      queryKey: getGetResearchHistoryQueryKey(),
      refetchInterval: () =>
        currentStatus?.status === "pending" || currentStatus?.status === "running" ? 3000 : false,
    },
  });

  const isRunning = currentStatus?.status === "pending" || currentStatus?.status === "running";

  const rawLines = (currentStatus?.log ?? "").split("\n").filter((l) => l.trim().length > 0);
  const progressMarkers = rawLines
    .map((l) => l.match(/^@@PROGRESS:(\d+)@@$/))
    .filter((m): m is RegExpMatchArray => m !== null);
  const lastMarker = progressMarkers[progressMarkers.length - 1];
  const parsedPct = lastMarker ? Number(lastMarker[1]) : 0;
  const progressPct =
    currentStatus?.status === "completed"
      ? 100
      : isRunning
      ? Math.max(parsedPct, 1)
      : 0;
  // Newest first so the latest progress is always visible at the top
  const logLines = rawLines.filter((l) => !/^@@PROGRESS:\d+@@$/.test(l)).reverse();

  function toggleTarget(id: string) {
    setSelectedTargets((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function handleTrigger() {
    if (selectedTargets.length === 0) {
      toast({
        title: "Pilih minimal 1 target",
        description: "Centang setidaknya satu kategori riset sebelum memulai.",
        variant: "destructive",
      });
      return;
    }
    triggerResearch.mutate({ data: { targets: selectedTargets } });
  }

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3 mr-1" /> COMPLETED
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" /> FAILED
          </Badge>
        );
      case "running":
        return (
          <Badge variant="outline" className="border-primary text-primary animate-pulse">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> RUNNING
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" /> PENDING
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Activity className="w-8 h-8 mr-3 text-primary" />
            Research Operations
          </h1>
          <p className="text-muted-foreground mt-1">
            Pilih jenis riset yang ingin dijalankan, lalu mulai scan.
          </p>
        </div>

        {/* Reset button with confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
              disabled={resetData.isPending}
            >
              {resetData.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
                : <><Trash2 className="w-4 h-4" /> Reset Semua Data</>
              }
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset semua data riset?</AlertDialogTitle>
              <AlertDialogDescription>
                Ini akan <strong>menghapus semua provider dan kode promo</strong> dari Dashboard, King of Cheap, dan Code Hunter.
                Data bisa dikumpulkan kembali dengan menjalankan research baru.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => resetData.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ya, Hapus Semua
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: controls + terminal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Target selector card */}
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base">Target Riset</CardTitle>
              <CardDescription>Centang kategori yang ingin discan</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {TARGET_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const checked = selectedTargets.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => !isRunning && toggleTarget(opt.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? "border-primary/60 bg-primary/5"
                          : "border-border bg-background hover:bg-muted/30"
                      } ${isRunning ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <Checkbox
                        id={opt.id}
                        checked={checked}
                        onCheckedChange={() => !isRunning && toggleTarget(opt.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={opt.id}
                          className="flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <Icon className="w-4 h-4 text-primary" />
                          {opt.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isRunning ? (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => stopResearch.mutate()}
                  disabled={stopResearch.isPending}
                  className="w-full mt-4 font-bold tracking-wider"
                >
                  {stopResearch.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      STOPPING...
                    </>
                  ) : (
                    <>
                      <Square className="w-5 h-5 mr-2" />
                      STOP RESEARCH
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleTrigger}
                  disabled={triggerResearch.isPending || selectedTargets.length === 0}
                  className="w-full mt-4 font-bold tracking-wider relative overflow-hidden group"
                >
                  <Activity className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  MULAI SCAN ({selectedTargets.length} target)
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Terminal */}
          <Card className="bg-card border-border shadow-lg overflow-hidden flex flex-col h-[440px]">
            <div className="bg-black/60 border-b border-border/50 px-4 py-3 flex items-center justify-between font-mono text-sm text-muted-foreground">
              <div className="flex items-center">
                <Terminal className="w-4 h-4 mr-2 text-primary" />
                Terminal Output / Job #{currentStatus?.id || "---"}
              </div>
              <div className="flex items-center gap-2">
                {currentStatus && getJobStatusBadge(currentStatus.status)}
                <div
                  className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.6)]"
                  style={{ opacity: isRunning ? 1 : 0.3 }}
                />
              </div>
            </div>

            {/* Progress bar */}
            <div className="bg-black/40 border-b border-border/50 px-4 py-2.5">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-muted-foreground">
                  {isRunning
                    ? "Research progress"
                    : currentStatus?.status === "completed"
                    ? "Finished"
                    : currentStatus?.status === "failed"
                    ? "Stopped"
                    : "Idle"}
                </span>
                <span className="text-primary font-bold">{progressPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-primary transition-all duration-500 ${isRunning ? "animate-pulse" : ""}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <CardContent className="p-0 flex-1 bg-black text-green-500 font-mono text-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiLz48cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-20 pointer-events-none" />
              <ScrollArea className="h-full w-full">
                <div className="p-4 space-y-1">
                  {isRunning && <div className="animate-pulse">_</div>}
                  {isStatusLoading ? (
                    <div className="text-muted-foreground">Connecting to research node...</div>
                  ) : logLines.length > 0 ? (
                    logLines.map((line, i) => (
                      <div
                        key={i}
                        className={`${
                          line.includes("ERROR") || line.includes("FAILED") || line.includes("failed")
                            ? "text-red-500"
                            : line.includes("SUCCESS") || line.includes("complete") || line.includes("FOUND")
                            ? "text-primary"
                            : "text-green-500/70"
                        }`}
                      >
                        {line}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground italic">
                      No output logs available. System waiting for commands.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            {currentStatus?.status === "completed" && currentStatus.providers_found !== undefined && (
              <div className="bg-primary/10 border-t border-primary/30 px-4 py-3 text-sm font-mono flex items-center justify-between text-primary">
                <span>Scan Complete</span>
                <span>
                  Discovered: {currentStatus.providers_found} | Updated:{" "}
                  {currentStatus.providers_updated || 0}
                </span>
              </div>
            )}
          </Card>
        </div>

        {/* Right: history */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg">Operation History</CardTitle>
              <CardDescription>Job riset terbaru</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[620px]">
                {isHistoryLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-20 bg-muted/30 rounded animate-pulse" />
                    ))}
                  </div>
                ) : history && history.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {history.map((job) => {
                      const jobTargets = parseTargets(job.targets);
                      return (
                        <div
                          key={job.id}
                          className={`p-4 transition-colors hover:bg-muted/30 ${
                            currentStatus?.id === job.id ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              JOB_{job.id.toString().padStart(4, "0")}
                            </span>
                            {getJobStatusBadge(job.status)}
                          </div>
                          <div className="text-sm mb-1">
                            {format(new Date(job.started_at), "d MMM, HH:mm")}
                          </div>
                          {/* Targets badge row */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {jobTargets.map((t) => {
                              const opt = TARGET_OPTIONS.find((o) => o.id === t);
                              return (
                                <span
                                  key={t}
                                  className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                                >
                                  {opt?.label ?? t}
                                </span>
                              );
                            })}
                          </div>
                          {job.status === "completed" && (
                            <div className="text-xs text-muted-foreground font-mono mt-1 bg-background/50 p-2 rounded">
                              Found: {job.providers_found || 0} / Updated:{" "}
                              {job.providers_updated || 0}
                            </div>
                          )}
                          {job.status === "failed" && job.error_message && (
                            <div className="text-xs text-destructive mt-2 flex items-start">
                              <AlertTriangle className="w-3 h-3 mr-1 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{job.error_message}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No operations history found.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
