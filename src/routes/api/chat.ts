import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

const SYSTEM = `You are an AI Workplace Productivity Assistant. You help professionals with writing, planning, summarizing, and research. Be clear, structured, and concise. Use Markdown formatting (headings, bullets, code blocks) where it improves clarity. When users ask for sensitive HR/legal/financial decisions, recommend they verify with a qualified person.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
          return new Response("Server misconfigured", { status: 500 });
        }
        const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = userData.user.id;

        const body = (await request.json()) as { messages?: UIMessage[]; threadId?: string };
        const messages = body.messages;
        const threadId = body.threadId;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Bad request", { status: 400 });
        }

        // Verify thread ownership
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);

        const result = streamText({
          model: gateway(DEFAULT_MODEL),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            try {
              const existing = messages.length;
              const newOnes = finalMessages.slice(existing - 1); // last user + new assistant
              if (newOnes.length === 0) return;
              const rows = newOnes.map((m) => ({
                thread_id: threadId,
                user_id: userId,
                message: m as unknown as Database["public"]["Tables"]["chat_messages"]["Row"]["message"],
              }));
              const { error: insErr } = await supabase.from("chat_messages").insert(rows);
              if (insErr) console.error("chat insert error", insErr);
              await supabase
                .from("chat_threads")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", threadId);

              // Auto-title from first user message if still default
              const { data: t } = await supabase
                .from("chat_threads")
                .select("title")
                .eq("id", threadId)
                .maybeSingle();
              if (t?.title === "New conversation") {
                const firstUser = finalMessages.find((m) => m.role === "user");
                const text =
                  firstUser?.parts
                    ?.map((p) => (p.type === "text" ? p.text : ""))
                    .join(" ")
                    .trim() ?? "";
                if (text) {
                  const title = text.slice(0, 60) + (text.length > 60 ? "…" : "");
                  await supabase.from("chat_threads").update({ title }).eq("id", threadId);
                }
              }
            } catch (e) {
              console.error("onFinish persistence failed", e);
            }
          },
        });
      },
    },
  },
});
