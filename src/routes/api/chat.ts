import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Você é o Tutor IA da Acrópole Platform — um assistente acadêmico erudito, claro e socrático.
Sua missão é ajudar estudantes universitários e pesquisadores a entender conteúdo, estruturar argumentos e refinar a escrita.
Responda em português culto, com profundidade e elegância, mas sem rebuscamento desnecessário.
Use markdown para estruturar respostas longas (títulos, listas, citações). Quando útil, traga referências bibliográficas reais.
Se a pergunta for ambígua, faça uma contra-pergunta socrática antes de responder.`;

type ChatBody = { messages?: unknown; threadId?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, threadId } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const uiMessages = messages as UIMessage[];

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(uiMessages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ messages: finalMessages }) => {
            try {
              if (typeof threadId !== "string") return;
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              // Get thread to find user_id
              const { data: thread } = await supabaseAdmin
                .from("tutor_threads")
                .select("user_id, title")
                .eq("id", threadId)
                .maybeSingle();
              if (!thread) return;

              // Persist only the last user message and final assistant message (avoid dupes)
              const lastUser = [...uiMessages].reverse().find((m) => m.role === "user");
              const lastAssistant = [...finalMessages]
                .reverse()
                .find((m) => m.role === "assistant");

              const rows: Array<{
                thread_id: string;
                user_id: string;
                role: string;
                parts: unknown;
              }> = [];
              if (lastUser)
                rows.push({
                  thread_id: threadId,
                  user_id: thread.user_id,
                  role: "user",
                  parts: lastUser.parts ?? [],
                });
              if (lastAssistant)
                rows.push({
                  thread_id: threadId,
                  user_id: thread.user_id,
                  role: "assistant",
                  parts: lastAssistant.parts ?? [],
                });
              if (rows.length) await supabaseAdmin.from("tutor_messages").insert(rows as never);

              // Auto-title from first user message
              if (thread.title === "Nova conversa" && lastUser) {
                const text = (lastUser.parts ?? [])
                  .map((p) => (p as { type: string; text?: string }).text ?? "")
                  .join(" ")
                  .slice(0, 80);
                if (text) {
                  await supabaseAdmin
                    .from("tutor_threads")
                    .update({ title: text })
                    .eq("id", threadId);
                }
              } else {
                await supabaseAdmin
                  .from("tutor_threads")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", threadId);
              }
            } catch (e) {
              console.error("Persist error", e);
            }
          },
        });
      },
    },
  },
});
