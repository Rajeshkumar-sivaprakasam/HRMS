import { cookies } from 'next/headers';

/**
 * Server-only data fetching helper.
 *
 * Reads the httpOnly auth cookie (set by /api/auth/session) and calls the
 * backend from the SERVER, so pages can be server-rendered with real data.
 * Must only be imported from Server Components / Route Handlers.
 *
 * Fails gracefully (returns null) so a missing backend or expired session
 * never crashes the page — the client section can still hydrate and refetch.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export async function serverGet<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<T | null> {
  // Without an absolute backend URL we can't fetch on the server.
  if (!BASE_URL) return null;

  try {
    const store = await cookies();
    const token = store.get('hrforz_token')?.value;

    const url = new URL(/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // Always fetch fresh authed data; don't cache per-user responses.
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
