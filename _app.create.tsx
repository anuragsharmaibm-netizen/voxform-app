import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateDocument, TEMPLATE_OPTIONS } from "@/lib/documents.functions";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
  head: () => ({
    meta: [
      { title: "Capture · Voxform" },
      { name: "description", content: "Record your voice or paste a transcript and generate a B2B-ready document." },
    ],
  }),
});

type SpeechRec = typeof window extends { SpeechRecognition: infer T } ? T : any;

function CreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const generate = useServerFn(generateDocument);

  const [transcript, setTranscript] = useState("");
  const [template, setTemplate] = useState<"email" | "meeting" | "scope">("email");
  const [recording, setRecording] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      if (final) setTranscript((t) => (t + " " + final).trim());
      // interim ignored to keep textarea stable; could display elsewhere
    };
    rec.onerror = () => {
      setRecording(false);
      toast.error("Microphone error. Check browser permissions.");
    };
    rec.onend = () => setRecording(false);
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
    };
  }, []);

  function toggleRecord() {
    if (!recRef.current) {
      toast.error("Voice input isn't supported in this browser. Type below instead.");
      return;
    }
    if (recording) {
      recRef.current.stop();
      setRecording(false);
    } else {
      try {
        recRef.current.start();
        setRecording(true);
      } catch {
        // already started
      }
    }
  }

  async function onGenerate() {
    if (transcript.trim().length < 10) {
      toast.error("Add at least a sentence to format.");
      return;
    }
    setGenerating(true);
    try {
      const doc = await generate({ data: { transcript: transcript.trim(), template } });
      await qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document created");
      navigate({ to: "/document/$id", params: { id: doc.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">New capture</p>
        <h1 className="text-2xl font-semibold mt-1">Speak or type</h1>
      </div>

      <div className="flex flex-col items-center py-4">
        <button
          type="button"
          onClick={toggleRecord}
          disabled={!supported}
          className={`relative h-32 w-32 rounded-full flex items-center justify-center text-primary-foreground transition-transform active:scale-95 ${
            recording ? "animate-pulse" : ""
          }`}
          style={{
            background: "var(--gradient-mic)",
            boxShadow: "var(--shadow-elegant)",
          }}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          {recording ? <Square className="h-10 w-10" fill="currentColor" /> : <Mic className="h-12 w-12" />}
          {recording && (
            <span className="absolute inset-0 rounded-full ring-4 ring-primary/30 animate-ping" />
          )}
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          {recording ? "Listening…" : supported ? "Tap to record" : "Voice not supported — type below"}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Transcript</label>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Speak or paste your raw notes here…"
          className="min-h-32 resize-y rounded-2xl bg-card"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Output template</label>
        <Select value={template} onValueChange={(v) => setTemplate(v as any)}>
          <SelectTrigger className="h-12 rounded-2xl bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={onGenerate}
        disabled={generating}
        className="w-full h-14 text-base font-medium rounded-2xl"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
      >
        <Sparkles className="h-5 w-5 mr-2" />
        {generating ? "Formatting with AI…" : "Generate document"}
      </Button>
    </div>
  );
}