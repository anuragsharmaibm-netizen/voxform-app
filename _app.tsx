import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, Mic, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  const tabs = [
    { to: "/dashboard", label: "Docs", icon: Home },
    { to: "/create", label: "Capture", icon: Mic },
    { to: "/paywall", label: "Premium", icon: Sparkles },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 backdrop-blur bg-background/80 border-b border-border">
        <div className="mx-auto max-w-md flex items-center justify-between px-5 h-14">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Mic className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Voxform</span>
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/login", replace: true });
            }}
            className="text-muted-foreground hover:text-foreground p-2 -mr-2"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-md px-5 pb-28 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-md grid grid-cols-3 h-16">
          {tabs.map((t) => {
            const active = location.pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Toaster position="top-center" />
    </div>
  );
}