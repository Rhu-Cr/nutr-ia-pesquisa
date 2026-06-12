import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  exp: z.number().int().min(1).max(5),
  use: z.number().int().min(1).max(5),
  ia: z.number().int().min(1).max(5),
  conf: z.number().int().min(1).max(5),
  adoption: z.enum(["sim", "talvez", "nao"]),
  liked: z.string().trim().max(2000).nullable().optional(),
  improve: z.string().trim().max(2000).nullable().optional(),
});


const MAX_PER_HOUR = 10;

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const ip =
      getRequestIP({ xForwardedFor: true }) ??
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-real-ip") ??
      "unknown";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await supabaseAdmin
      .from("feedback_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", oneHourAgo);

    if (countErr) throw new Error("Não foi possível validar o envio. Tente novamente.");
    if ((count ?? 0) >= MAX_PER_HOUR) {
      throw new Error(
        "Muitos envios deste IP na última hora. Aguarde alguns minutos e tente novamente.",
      );
    }

    // Enforce one response per email (case-insensitive via unique index on lower(email))
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("feedbacks")
      .select("id")
      .eq("email", data.email)
      .limit(1)
      .maybeSingle();
    if (existingErr) throw new Error("Não foi possível validar o e-mail. Tente novamente.");
    if (existing) {
      throw new Error("Este e-mail já enviou uma resposta. Apenas um envio por e-mail é permitido.");
    }

    const { error: insertErr } = await supabaseAdmin.from("feedbacks").insert({
      name: data.name,
      email: data.email,
      exp: data.exp,
      use: data.use,
      ia: data.ia,
      conf: data.conf,
      adoption: data.adoption,
      liked: data.liked?.trim() ? data.liked.trim() : null,
      improve: data.improve?.trim() ? data.improve.trim() : null,
    });
    if (insertErr) {
      if ((insertErr as { code?: string }).code === "23505") {
        throw new Error("Este e-mail já enviou uma resposta.");
      }
      throw new Error("Não foi possível enviar o feedback.");
    }


    await supabaseAdmin.from("feedback_rate_limits").insert({ ip });

    return { ok: true as const };
  });
