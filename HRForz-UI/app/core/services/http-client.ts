/**
 * Fetch-based HTTP client (replaces Axios).
 *
 * Mirrors the previous Axios behaviour exactly so the public `apiService`
 * surface is unchanged:
 *   - baseURL from NEXT_PUBLIC_API_BASE_URL
 *   - Bearer token auto-attached from localStorage
 *   - JSON request/response by default; FormData passed through untouched
 *   - 401 → clear token + redirect to /login
 *   - errors normalised to an Error with `.status` and `.data`
 *   - resolves with the parsed response body (not the Response object)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface HttpError extends Error {
  status?: number;
  data?: unknown;
}

/** Default, user-friendly messages per status (used only when the backend
 *  response body has no `message` field of its own). */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check the submitted data.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  405: 'This action is not allowed.',
  408: 'The request timed out. Please try again.',
  409: 'This request conflicts with the current state.',
  413: 'The uploaded data is too large.',
  422: 'Some of the submitted data is invalid.',
  429: 'Too many requests. Please slow down and try again.',
  500: 'Something went wrong on the server. Please try again later.',
  502: 'The server is temporarily unavailable (bad gateway).',
  503: 'The service is currently unavailable. Please try again later.',
  504: 'The server took too long to respond (gateway timeout).',
};

function buildUrl(url: string, params?: Record<string, unknown>): string {
  const full = /^https?:\/\//.test(url) ? url : `${BASE_URL}${url}`;
  if (!params) return full;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      qs.append(key, String(value));
    }
  }
  const query = qs.toString();
  return query ? `${full}?${query}` : full;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return undefined;
    }
  }

  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function httpRequest<T>(
  method: HttpMethod,
  url: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers = {}, signal } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...headers,
  };

  // For FormData, the browser must set Content-Type (with the multipart
  // boundary). Strip any manually-provided value so it isn't broken.
  if (isFormData) {
    delete finalHeaders['Content-Type'];
    delete finalHeaders['content-type'];
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hrforz_token');
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(url, params), {
      method,
      headers: finalHeaders,
      body: body == null ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    // Network failure or aborted request
    const error: HttpError =
      err instanceof Error ? err : new Error('Network request failed');
    throw error;
  }

  const data = await parseBody(res);

  if (!res.ok) {
    const status = res.status;

    // 401 → session invalid: clear token and bounce to login.
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('hrforz_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Prefer a message from the backend body, then a per-status default,
    // then the HTTP statusText, then a generic fallback.
    const backendMessage =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : undefined;

    const message =
      backendMessage ||
      STATUS_MESSAGES[status] ||
      res.statusText ||
      'Request failed';

    const error: HttpError = new Error(message);
    error.status = status;
    error.data = data;
    throw error;
  }

  return data as T;
}
