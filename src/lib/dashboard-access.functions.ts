import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns whether the currently signed-in user's email is on the
 * dashboard allowlist. Runs with the user's RLS context (the
 * allowlist policy only exposes the caller's own row).
 */
export const checkDashboardAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims?.email as string | undefined)?.toLowerCase();
    if (!email) return { allowed: false, email: null };

    const { data, error } = await context.supabase
      .from("dashboard_allowed_emails")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[checkDashboardAccess]", error);
      return { allowed: false, email };
    }
    return { allowed: !!data, email };
  });
