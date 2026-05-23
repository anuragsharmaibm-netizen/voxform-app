import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteDocument, getDocument } from "@/lib/documents.functions";

export const Route = createFileRoute("/_app/document/$id")({
  component: DocumentPage,
});

function DocumentPage() {
  const { id } = useParams({ from: "/_app/document/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchDoc = useServerFn(getDocument);
  const del = useServerFn(deleteDocument);

  const { data, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: () => fetchDoc({ data: { id } }),
  });

  async function onDelete() {
    if (!confirm("Delete this document?")) return;
    try {
      await del({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Deleted");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  async function onCopy() {
    if (!data) return;
    await navigator.clipboard.writeText(data.formatted_output);
    toast.success("Copied to clipboard");
  }

  if (isLoading || !data) {
    return <div className="h-40 rounded-2xl bg-muted animate-pulse mt-4" />;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate({ to: "/dashboard" })}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground -ml-1"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-xl font-semibold leading-tight">{data.title}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(data.created_at).toLocaleString()}
        </p>
      </div>

      <div
        className="rounded-2xl bg-card border border-border p-5 text-sm whitespace-pre-wrap font-[ui-monospace,monospace] leading-relaxed"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        {data.formatted_output}
      </div>

      <details className="rounded-2xl bg-muted/50 border border-border p-4 text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground">
          Original transcript
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{data.raw_transcript}</p>
      </details>

      <div className="flex gap-2 pt-2">
        <Button onClick={onCopy} variant="outline" className="flex-1 h-12 rounded-2xl">
          <Copy className="h-4 w-4 mr-2" /> Copy
        </Button>
        <Button onClick={onDelete} variant="outline" className="h-12 rounded-2xl text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}