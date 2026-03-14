/**
 * BFF: Return OAuth authorize URL for the given provider. Client redirects user there.
 */

import { getPathWithParams } from "~/config/apiRoutes";

export default defineEventHandler((event) => {
  const provider = getQuery(event).provider as string;
  if (!provider?.length) {
    throw createError({ statusCode: 400, statusMessage: "Missing provider" });
  }

  const path = getPathWithParams("auth", "oauth", "initiate", { provider });
  if (!path) {
    throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  }

  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const versionedPrefix = "/api/v1";
  const url = `${baseUrl}${versionedPrefix}/${path}`;

  return { url };
});
