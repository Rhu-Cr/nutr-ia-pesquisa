
REVOKE EXECUTE ON FUNCTION public.is_dashboard_allowed(text) FROM PUBLIC, anon, authenticated;
-- Only service_role may call this helper directly.
GRANT EXECUTE ON FUNCTION public.is_dashboard_allowed(text) TO service_role;
