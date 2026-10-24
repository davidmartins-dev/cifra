/**
 * Retorna a URL interna do backend NestJS.
 * Usado exclusivamente pelo servidor Next.js (BFF, Middleware e SSR).
 */
export function getInternalApiUrl(): string {
  const url =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000/api/v1";
  return url.replace(/\/$/, "");
}
