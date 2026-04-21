import { apiPath } from '@/lib/api-path';

export type DbWhereClause = {
  field: string;
  op: '=' | '!=' | '<' | '<=' | '>' | '>=' | 'IN' | 'NOT IN';
  value: unknown;
};

export type DbOrderBy = {
  field: string;
  direction?: 'ASC' | 'DESC';
};

export type DbQueryOptions = {
  where?: DbWhereClause[];
  orderBy?: DbOrderBy;
  limit?: number;
  offset?: number;
};

const BASE_URL = apiPath('/api/db');

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    let error: any = body;
    try {
      error = JSON.parse(body);
    } catch {
      error = body;
    }
    throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
  }

  return response.json();
}

function buildQueryParams(options?: DbQueryOptions) {
  const params = new URLSearchParams();
  if (!options) return params;

  if (options.where?.length) {
    params.set('where', JSON.stringify(options.where));
  }
  if (options.orderBy) {
    params.set('orderBy', JSON.stringify(options.orderBy));
  }
  if (typeof options.limit === 'number') {
    params.set('limit', String(options.limit));
  }
  if (typeof options.offset === 'number') {
    params.set('offset', String(options.offset));
  }
  return params;
}

export async function listDocuments<T = any>(collection: string, options?: DbQueryOptions): Promise<T[]> {
  const params = buildQueryParams(options);
  const url = `${BASE_URL}/${encodeURIComponent(collection)}${params.toString() ? `?${params.toString()}` : ''}`;
  return fetchJson<T[]>(url, { method: 'GET' });
}

export async function getDocument<T = any>(collection: string, id: string): Promise<T | null> {
  const url = `${BASE_URL}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
  return fetchJson<T>(url, { method: 'GET' });
}

export async function createDocument<T = any>(collection: string, data: Record<string, unknown>): Promise<T> {
  const url = `${BASE_URL}/${encodeURIComponent(collection)}`;
  return fetchJson<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDocument<T = any>(collection: string, id: string, data: Record<string, unknown>): Promise<T> {
  const url = `${BASE_URL}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
  return fetchJson<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function bulkUpdateDocuments<T = any>(collection: string, items: Array<Record<string, unknown>>, chunkSize = 200): Promise<T[]> {
  const result: T[] = [];
  const chunks = chunkArray(items, chunkSize);
  for (const chunk of chunks) {
    const url = `${BASE_URL}/bulk/${encodeURIComponent(collection)}`;
    const chunkResult = await fetchJson<T[]>(url, {
      method: 'POST',
      body: JSON.stringify(chunk),
    });
    result.push(...chunkResult);
  }
  return result;
}

export async function deleteDocument(collection: string, id: string): Promise<void> {
  const url = `${BASE_URL}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
  await fetchJson<void>(url, { method: 'DELETE' });
}
