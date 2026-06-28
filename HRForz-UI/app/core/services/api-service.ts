import httpClient from './http-client';
import { AxiosRequestConfig } from 'axios';

class ApiService {
  public async get<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
    return httpClient.get<T, T>(url, { params, headers });
  }

  public async post<T>(url: string, body: any, headers?: Record<string, string>, signal?: AbortSignal): Promise<T> {
    const config: AxiosRequestConfig = { headers };
    if (signal) config.signal = signal;
    return httpClient.post<T, T>(url, body, config);
  }

  public async put<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    const isFormData = typeof window !== 'undefined' && body instanceof FormData;
    const config: AxiosRequestConfig = { 
      headers: {
        ...headers,
        ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {})
      }
    };
    return httpClient.put<T, T>(url, body, config);
  }

  public async patch<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    return httpClient.patch<T, T>(url, body, { headers });
  }

  public async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return httpClient.delete<T, T>(url, { headers });
  }
}

export const apiService = new ApiService();
