/**
 * Config API – returns all application config for client consumption.
 * BFF reads from local JSON files; can be extended to fetch from auth-core/tenant service.
 */
import authJson from "~/config/auth.json";
import brandJson from "~/config/brand.json";
import tenantJson from "~/config/tenant.json";
import apiRoutesJson from "~/config/apiRoutes.json";

export default defineEventHandler(() => {
  return {
    auth: authJson,
    brand: brandJson,
    tenant: tenantJson,
    apiRoutes: apiRoutesJson,
  };
});
