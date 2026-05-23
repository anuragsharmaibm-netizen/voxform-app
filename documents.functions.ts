import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TEMPLATES: Record<string, { label: string; system: string }> = {
  email: {
    label: "Client Follow-up Email",
    system:
      "You are a professional B2B writing assistant. Convert the user's raw voice transcript into a polished client follow-up email. Use a clear subject line, warm but professional tone, concise paragraphs, a recap of agreed points, explicit next steps with owners, and a sign-off. Return ONLY markdown.",
  },
  meeting: {
    label: "Meeting Summary",
    system:
      "You are a professional meeting analyst. Convert the raw transcript into a structured meeting summary with: # Title, ## Attendees (infer), ## Key Decisions, ## Discussion Highlights, ## Action Items (table with Owner | Task | Due). Return ONLY markdown.",
  },
  scope: {
    label: "Project Scope Draft",
    system:
      "You are a senior project manager. Convert the raw transcript into a clean project scope draft with: # Project Title, ## Objective, ## Deliverables, ## Out of Scope, ## Milestones, ## Assumptions, ## Risks. Return ONLY markdown.",
  },
};

export const TEMPLATE_OPTIONS = Object.entries(TEMPLATES).map(([k, v]) => ({
  value: k,
  label: v.label,
}));

export const generateDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        transcript: z.string().trim().min(10).max(20000),
        template: z.enum(["email", "meeting", "scope"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const tpl = TEMPLATES[data.template];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: tpl.system },
          { role: "user", content: data.transcript },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up to continue.");
    if (!res.ok) throw new Error(`AI error (${res.status})`);

    const json = await res.json();
    const formatted: string = json.choices?.[0]?.message?.content ?? "";
    if (!formatted.trim()) throw new Error("AI returned empty output");

    // Title = first non-empty line, stripped of markdown
    const title =
      formatted
        .split("\n")
        .map((l) => l.replace(/^#+\s*/, "").trim())
        .find((l) => l.length > 0)
        ?.slice(0, 120) ?? `${tpl.label} — ${new Date().toLocaleDateString()}`;

    const { data: row, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        title,
        raw_transcript: data.transcript,
        formatted_output: formatted,
        template_type: data.template,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("documents")
      .select("id,title,template_type,created_at,formatted_output")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const getDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("documents")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const setPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ premium: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ is_premium: data.premium })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });