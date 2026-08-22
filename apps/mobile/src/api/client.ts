import { API_URL } from '@/config/api';

export type FieldErrors = Record<string, string[] | undefined>;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export class NetworkError extends Error {
  constructor() {
    super('não deu para falar com o servidor');
    this.name = 'NetworkError';
  }
}

export class SyncingError extends Error {
  constructor() {
    super('ainda sincronizando os dados — espera terminar pra editar');
    this.name = 'SyncingError';
  }
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

export type TokenRefresher = () => Promise<string | null>;

const PATHS_WITHOUT_RETRY = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let tokenRefresher: TokenRefresher | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function setTokenRefresher(refresher: TokenRefresher | null): void {
  tokenRefresher = refresher;
}

function refreshAuthToken(): Promise<string | null> {
  refreshInFlight ??= (tokenRefresher?.() ?? Promise.resolve(null))
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, String(value));
  }

  const suffix = search.toString();
  return `${API_URL}${path}${suffix ? `?${suffix}` : ''}`;
}

async function parseError(response: Response): Promise<ApiError> {
  let message = 'algo deu errado por aqui';
  let fieldErrors: FieldErrors = {};

  try {
    const payload = (await response.json()) as { message?: string; errors?: FieldErrors };
    if (payload.message) message = payload.message;
    if (payload.errors) fieldErrors = payload.errors;
  } catch {
    message = response.status >= 500 ? 'o servidor tropeçou' : message;
  }

  return new ApiError(response.status, message, fieldErrors);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options;
  const url = buildUrl(path, query);

  async function send(token: string | null): Promise<Response> {
    try {
      return await fetch(url, {
        method,
        signal,
        headers: {
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new NetworkError();
    }
  }

  const sentWith = authToken;
  let response = await send(sentWith);

  if (response.status === 401 && !PATHS_WITHOUT_RETRY.includes(path)) {
    const token = authToken === sentWith ? await refreshAuthToken() : authToken;
    if (token) response = await send(token);
  }

  if (response.status === 401) {
    unauthorizedHandler?.();
    throw await parseError(response);
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
