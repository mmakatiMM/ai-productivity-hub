import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM_PREFIX =
  "You are a careful, professional workplace productivity assistant. Be concise, structured, and use clear headings or bullet points when helpful. Respond in Markdown.";

async function runPrompt(system: string, user: string): Promise<string> {
  const { generateText } = await import("ai");
  const { createLovableAiGatewayProvider, DEFAULT_MODEL } = await import(
    "./ai-gateway.server"
  );
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  const { text } = await generateText({
    model: gateway(DEFAULT_MODEL),
    system: `${SYSTEM_PREFIX}\n${system}`,
    prompt: user,
  });
  return text;
}

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        recipient: z.string().optional(),
        purpose: z.string().min(1),
        tone: z.enum(["formal", "friendly", "concise", "persuasive", "apologetic"]).default("formal"),
        context: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const text = await runPrompt(
      "You write professional workplace emails. Always include a Subject line, a greeting, body, and sign-off. Keep it under 200 words unless told otherwise.",
      `Write an email.\nRecipient: ${data.recipient || "(unspecified)"}\nPurpose: ${data.purpose}\nTone: ${data.tone}\nAdditional context: ${data.context || "(none)"}`,
    );
    return { text };
  });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ notes: z.string().min(10), audience: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const text = await runPrompt(
      "You summarize meeting notes for busy professionals. Output four sections: ## TL;DR (2-3 sentences), ## Key Decisions, ## Action Items (with owners if mentioned, otherwise leave blank), ## Open Questions.",
      `Audience: ${data.audience || "team"}\n\nNotes:\n${data.notes}`,
    );
    return { text };
  });

export const planTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        goal: z.string().min(3),
        horizon: z.enum(["today", "week", "month", "quarter"]).default("week"),
        constraints: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const text = await runPrompt(
      "You break goals into prioritized, sequenced tasks. Output: ## Overview, ## Milestones, ## Task Plan (numbered, each with: priority P1/P2/P3, estimate, and dependency if any), ## Risks.",
      `Goal: ${data.goal}\nHorizon: ${data.horizon}\nConstraints: ${data.constraints || "(none)"}`,
    );
    return { text };
  });

export const researchTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        topic: z.string().min(3),
        depth: z.enum(["brief", "standard", "deep"]).default("standard"),
        angle: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const text = await runPrompt(
      "You produce structured research briefs for professionals based on your training knowledge. Be explicit about uncertainty and recommend verification for time-sensitive facts. Output: ## Summary, ## Key Concepts, ## Considerations & Tradeoffs, ## Suggested Next Steps, ## What to Verify.",
      `Topic: ${data.topic}\nDepth: ${data.depth}\nAngle/audience: ${data.angle || "(general)"}`,
    );
    return { text };
  });
