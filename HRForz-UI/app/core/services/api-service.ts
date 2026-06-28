import { httpRequest } from './http-client';

/**
 * Thin, typed wrapper over the fetch-based httpRequest.
 * Public method signatures are intentionally unchanged from the previous
 * Axios implementation so every existing caller keeps working.
 */
class ApiService {
  public get<T>(url: string, params?: Record<string, unknown>, headers?: Record<string, string>): Promise<T> {
    return httpRequest<T>('GET', url, undefined, { params, headers });
  }

  public post<T>(url: string, body: unknown, headers?: Record<string, string>, signal?: AbortSignal): Promise<T> {
    return httpRequest<T>('POST', url, body, { headers, signal });
  }

  public put<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T> {
    return httpRequest<T>('PUT', url, body, { headers });
  }

  public patch<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T> {
    return httpRequest<T>('PATCH', url, body, { headers });
  }

  public delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return httpRequest<T>('DELETE', url, undefined, { headers });
  }
}

export const apiService = new ApiService();
