import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const inputSchema = z.object({
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

    const { error: insertErr } = await supabaseAdmin.from("feedbacks").insert({
      exp: data.exp,
      use: data.use,
      ia: data.ia,
      conf: data.conf,
      adoption: data.adoption,
      liked: data.liked?.trim() ? data.liked.trim() : null,
      improve: data.improve?.trim() ? data.improve.trim() : null,
    });
    if (insertErr) throw new Error("Não foi possível enviar o feedback.");

    await supabaseAdmin.from("feedback_rate_limits").insert({ ip });

    return { ok: true as const };
  });
