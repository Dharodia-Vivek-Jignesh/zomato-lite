import { headers } from "next/headers";

// Server components cannot fetch a relative address like "/api/restaurants/1";
// they must hand fetch() a complete address. This helper builds one from the
// request that is currently being served (host + http/https), so it works in
// development on localhost and later on Vercel too.
export async function apiUrl(path: string): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0] ?? "http";
  return `${protocol}://${host}${path}`;
}