import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Brain, Crosshair, LayoutDashboard, Crown, KeyRound, Tag, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/king-of-cheap", label: "King Of Cheap", icon: Crown },
  { href: "/code-hunter", label: "Code Hunter", icon: Tag },
  { href: "/research", label: "Research Jobs", icon: Activity },
  { href: "/training-engine", label: "Training Engine", icon: Brain },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
];

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const location = useRouterState({ select: (st) => st.location.pathname });

  return (
    <>
      <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
        <Crosshair className="w-5 h-5 text-primary mr-3" />
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          AA Hunt
        </span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNav}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 mr-3 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border shrink-0">
        <div className="px-3 py-3 rounded-lg bg-card border border-border/50 shadow-inner flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <span className="text-xs font-bold text-white">SYS</span>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">System Online</p>
            <p className="text-[10px] text-muted-foreground font-mono">v1.0.42</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card/50 backdrop-blur-xl flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent onNav={() => setMobileOpen(false)} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Mobile Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-4 md:hidden sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <Crosshair className="w-5 h-5 text-primary mr-2" />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AA Hunt
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
