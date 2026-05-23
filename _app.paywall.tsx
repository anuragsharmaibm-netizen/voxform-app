import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Sparkles, Zap, Layers, Infinity as InfinityIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getProfile, setPremium } from "@/lib/documents.functions";

export const Route = createFileRoute("/_app/paywall")({
  component: PaywallPage,
  head: () => ({
    meta: [
      { title: "Voxform Premium" },
      { name: "description", content: "Unlock unlimited smart generations and custom templates." },
    ],
  }),
});

const FEATURES = [
  { icon: InfinityIcon, title: "Unlimited Smart Generations", desc: "No monthly cap on AI-formatted docs." },
  { icon: Layers, title: "Custom Templates", desc: "Build your own output formats for any workflow." },
  { icon: Zap, title: "Priority AI Speed", desc: "Faster responses on the newest models." },
  { icon: Sparkles, title: "Advanced Voice Polishing", desc: "Cleaner transcripts, better tone matching." },
];

function PaywallPage() {
  const fetchProfile = useServerFn(getProfile);
  const setPrem = useServerFn(setPremium);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  async function purchase() {
    setBusy(true);
    try {
      // Simulated RevenueCat purchase flow — flip premium flag.
      await new Promise((r) => setTimeout(r, 700));
      await setPrem({ data: { premium: true } });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Welcome to Premium 🎉");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setBusy(false);
    }
  }

  async function downgrade() {
    setBusy(true);
    try {
      await setPrem({ data: { premium: false } });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast("Reverted to Free");
    } finally {
      setBusy(false);
    }
  }

  const isPremium = !!profile?.is_premium;

  return (
    <div className="space-y-6">
      <div
        className="rounded-3xl p-6 text-primary-foreground relative overflow-hidden"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <Sparkles className="h-7 w-7 mb-3" />
        <h1 className="text-2xl font-semibold leading-tight">Voxform Premium</h1>
        <p className="text-sm opacity-90 mt-1">Built for teams that ship words for a living.</p>
        <div className="mt-5 flex items-baseline gap-1">
          <span className="text-4xl font-bold">$12</span>
          <span className="text-sm opacity-80">/ month</span>
        </div>
      </div>

      <ul className="space-y-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <li
              key={f.title}
              className="flex gap-3 rounded-2xl bg-card border border-border p-4"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div
                className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm flex items-center gap-2">
                  {f.title}
                  {isPremium && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
              </div>
            </li>
          );
        })}
      </ul>

      {isPremium ? (
        <div className="space-y-2">
          <div className="text-center text-sm text-primary font-medium">
            You're on Premium ✨
          </div>
          <Button
            onClick={downgrade}
            disabled={busy}
            variant="outline"
            className="w-full h-12 rounded-2xl"
          >
            Downgrade to Free
          </Button>
        </div>
      ) : (
        <Button
          onClick={purchase}
          disabled={busy}
          className="w-full h-14 text-base font-medium rounded-2xl"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
        >
          {busy ? "Processing…" : "Start Premium"}
        </Button>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Simulated payment via RevenueCat. No card charged.
      </p>
    </div>
  );
}