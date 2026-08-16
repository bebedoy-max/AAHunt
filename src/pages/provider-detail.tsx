import { useGetProvider, getGetProviderQueryKey } from "@/lib/api-client";
import { Link, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, CreditCard, Clock, CheckCircle2, XCircle, AlertCircle, Video, Globe, Zap, Check, AlertTriangle, Calendar } from "lucide-react";
import { format } from "date-fns";

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

export default function ProviderDetailPage() {
  const params = useParams({ from: "/providers/$id" });
  const id = parseInt(params.id || "0", 10);
  
  const { data: provider, isLoading, isError } = useGetProvider(id, {
    query: { enabled: !!id, queryKey: getGetProviderQueryKey(id) }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="h-40 bg-card rounded-xl border border-border" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-card rounded-xl border border-border" />
          <div className="h-64 bg-card rounded-xl border border-border" />
        </div>
      </div>
    );
  }

  if (isError || !provider) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Provider Not Found</h2>
        <p className="text-muted-foreground mb-6">The intelligence record you requested does not exist or has been removed.</p>
        <Button asChild>
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" className="uppercase font-mono tracking-wider"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
      case "expired":
        return <Badge variant="destructive" className="uppercase font-mono tracking-wider"><XCircle className="w-3 h-3 mr-1" /> Expired</Badge>;
      default:
        return <Badge variant="warning" className="uppercase font-mono tracking-wider"><AlertCircle className="w-3 h-3 mr-1" /> Unverified</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground -ml-4">
        <Link to="/">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Header Hero */}
        <div className="flex-1 w-full bg-card rounded-xl border border-border overflow-hidden shadow-lg shadow-black/20">
          <div className="h-24 bg-gradient-to-r from-primary/10 via-card to-card border-b border-border/50 relative">
            {provider.has_kling && (
              <div className="absolute top-4 right-4">
                <Badge variant="kling" className="shadow-[0_0_20px_rgba(0,240,255,0.4)] px-3 py-1 text-sm">
                  <Video className="w-4 h-4 mr-2" /> Kling Support Confirmed
                </Badge>
              </div>
            )}
          </div>
          
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-10 mb-4">
              <div className="w-20 h-20 rounded-xl bg-card border-2 border-border flex items-center justify-center overflow-hidden shadow-xl">
                {provider.logo_url ? (
                  <img src={provider.logo_url} alt={provider.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold font-mono text-muted-foreground">{sanitizeName(provider.name).substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-foreground">{sanitizeName(provider.name)}</h1>
                  {getStatusBadge(provider.status)}
                </div>
                <div className="flex items-center text-muted-foreground text-sm font-mono">
                  <Badge variant="outline" className="mr-3 bg-background">{provider.category}</Badge>
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  <a href={ensureAbsoluteUrl(provider.website_url)} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    {provider.website_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                  </a>
                </div>
              </div>
              
              <Button asChild size="lg" className="md:ml-auto shrink-0 font-bold tracking-wide">
                <a href={ensureAbsoluteUrl(provider.website_url)} target="_blank" rel="noopener noreferrer">
                  Access Platform <ExternalLink className="w-4 h-4 ml-2 opacity-80" />
                </a>
              </Button>
            </div>
            
            {provider.description && (
              <p className="text-muted-foreground leading-relaxed">
                {provider.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Credit Details */}
          <Card className="bg-card border-border shadow-md">
            <div className="px-6 py-4 border-b border-border/50 flex items-center">
              <Zap className="w-5 h-5 text-primary mr-2" />
              <h2 className="font-bold text-lg">Credit Allocation</h2>
            </div>
            <CardContent className="p-6">
              <div className="bg-background/50 border border-border rounded-lg p-6 flex flex-col md:flex-row items-center justify-center text-center md:text-left md:justify-start gap-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-2xl font-mono">$</span>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-mono uppercase mb-2">Initial Grant</div>
                  <div className="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-mono mb-2">
                    {provider.free_credit_amount || "N/A"}
                  </div>
                  {provider.credit_type && (
                    <div className="text-muted-foreground text-sm border border-border bg-card inline-block px-2 py-1 rounded">
                      {provider.credit_type}
                    </div>
                  )}
                </div>
              </div>

              {provider.has_kling && provider.kling_detail && (
                <div className="mt-6 border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg p-5">
                  <div className="flex items-center mb-3 text-purple-400 font-bold">
                    <Video className="w-5 h-5 mr-2" />
                    Kling Motion Intelligence
                  </div>
                  <p className="text-purple-100 text-sm leading-relaxed font-mono">
                    {provider.kling_detail}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {provider.notes && (
             <Card className="bg-card border-border shadow-md">
              <div className="px-6 py-4 border-b border-border/50 flex items-center">
                <AlertTriangle className="w-5 h-5 text-amber-400 mr-2" />
                <h2 className="font-bold text-lg">Field Notes</h2>
              </div>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm whitespace-pre-wrap font-mono">
                  {provider.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Quick Facts */}
          <Card className="bg-card border-border shadow-md">
             <div className="px-6 py-4 border-b border-border/50">
              <h2 className="font-bold">Requirements</h2>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center text-sm font-medium text-muted-foreground">
                    <CreditCard className="w-4 h-4 mr-2" /> Credit Card
                  </div>
                  {provider.requires_credit_card ? (
                    <span className="text-destructive text-sm font-bold flex items-center"><XCircle className="w-3.5 h-3.5 mr-1" /> Required</span>
                  ) : (
                    <span className="text-emerald-400 text-sm font-bold flex items-center"><Check className="w-3.5 h-3.5 mr-1" /> Not Required</span>
                  )}
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center text-sm font-medium text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" /> Expiration
                  </div>
                  <span className="text-foreground text-sm font-bold font-mono">
                    {provider.expiry_days ? `${provider.expiry_days} Days` : "Does not expire"}
                  </span>
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center text-sm font-medium text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" /> Last Verified
                  </div>
                  <span className="text-foreground text-sm font-mono">
                    {provider.last_verified_at ? format(new Date(provider.last_verified_at), 'MMM d, yyyy') : "Unknown"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {provider.source_url && (
            <a 
              href={ensureAbsoluteUrl(provider.source_url!)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border transition-all flex items-center justify-between group"
            >
              <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-mono">
                View Source Discussion
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
