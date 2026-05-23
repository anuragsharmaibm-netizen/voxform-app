import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Mic } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Mic className="h-7 w-7 animate-pulse" />
      </div>
    </div>
  );
}
