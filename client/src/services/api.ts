import { GenerateRequest, GenerateResponse, Template } from '../types';

const API_BASE = '/api';

export async function generateDiagram(request: GenerateRequest): Promise<GenerateResponse> {
  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      return { success: false, error: err.error || `HTTP ${response.status}` };
    }

    return response.json();
  } catch (err: any) {
    return { success: false, error: err?.message || '网络请求失败，请检查连接' };
  }
}

export async function fetchTemplates(): Promise<Template[]> {
  try {
    const response = await fetch(`${API_BASE}/templates`);
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}
