import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { FileText, Mail, ClipboardList, Plus, Sparkles } from "lucide-react";
import { listDocuments, getProfile } from "@/lib/documents.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Your documents · Voxform" },
      { name: "description", content: "All of your AI-formatted voice documents in one place." },
    ],
  }),
});

const ICONS: Record<string, typeof Mail> = {
  email: Mail,
  meeting: ClipboardList,
  scope: FileText,
};

const LABEL: Record<string, string> = {
  email: "Follow-up Email",
  meeting: "Meeting Summary",
  scope: "Project Scope",
};

function DashboardPage() {
  const fetchDocs = useServerFn(listDocuments);
  const fetchProfile = useServerFn(getProfile);
  const router = useRouter();

  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => fetchDocs(),
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-semibold mt-1">Your documents</h1>
      </div>

      {profile && !profile.is_premium && (
        <Link
          to="/paywall"
          className="block rounded-2xl p-4 text-primary-foreground"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5" />
            <div className="flex-1">
              <div className="font-medium text-sm">Unlock unlimited generations</div>
              <div className="text-xs opacity-90">Go Premium →</div>
            </div>
          </div>
        </Link>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !docs || docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <div
            className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="font-medium">No documents yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Tap the mic to capture your first one.
          </p>
          <Link to="/create">
            <Button className="h-11">Capture a doc</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => {
            const Icon = ICONS[d.template_type] ?? FileText;
            return (
              <button
                key={d.id}
                onClick={() => router.navigate({ to: "/document/$id", params: { id: d.id } })}
                className="w-full text-left rounded-2xl bg-card border border-border p-4 flex items-start gap-3 transition-all hover:border-primary/40 active:scale-[0.99]"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div
                  className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{LABEL[d.template_type] ?? d.template_type}</span>
                    <span>·</span>
                    <span>{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}