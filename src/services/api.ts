import type { EncodeType, HistoryItem, ApiResponse } from '@/types';

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    const data = (await res.json()) as ApiResponse<T>;
    return data;
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Request failed',
    };
  }
}

export async function encode(type: EncodeType, content: string): Promise<ApiResponse<string>> {
  return request<string>('/api/encode', {
    method: 'POST',
    body: JSON.stringify({ type, content }),
  });
}

export async function decode(type: EncodeType, content: string): Promise<ApiResponse<string>> {
  return request<string>('/api/decode', {
    method: 'POST',
    body: JSON.stringify({ type, content }),
  });
}

export async function encrypt(content: string, key: string): Promise<ApiResponse<string>> {
  return request<string>('/api/encrypt', {
    method: 'POST',
    body: JSON.stringify({ content, key }),
  });
}

export async function decrypt(content: string, key: string): Promise<ApiResponse<string>> {
  return request<string>('/api/decrypt', {
    method: 'POST',
    body: JSON.stringify({ content, key }),
  });
}

export async function getHistory(): Promise<ApiResponse<HistoryItem[]>> {
  return request<HistoryItem[]>('/api/history');
}

export async function addHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>): Promise<ApiResponse<HistoryItem>> {
  return request<HistoryItem>('/api/history', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function clearHistory(): Promise<ApiResponse<void>> {
  return request<void>('/api/history', {
    method: 'DELETE',
  });
}
