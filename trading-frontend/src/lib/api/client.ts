function normalizeApiBaseUrl(raw: string | undefined) {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return "http://localhost:4000";
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");

  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  if (/^\/\//.test(withoutTrailingSlash)) {
    return `https:${withoutTrailingSlash}`;
  }

  // Allow entering just a host (e.g. trading-backend.onrender.com).
  // Use http for local hosts, https for everything else.
  const isLocalHost =
    /^localhost(?::\d+)?$/i.test(withoutTrailingSlash) ||
    /^127\.0\.0\.1(?::\d+)?$/.test(withoutTrailingSlash) ||
    /^0\.0\.0\.0(?::\d+)?$/.test(withoutTrailingSlash) ||
    /^\d{1,3}(\.\d{1,3}){3}(?::\d+)?$/.test(withoutTrailingSlash);

  return `${isLocalHost ? "http" : "https"}://${withoutTrailingSlash}`;
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

export const AUTH_TOKEN_KEY = 'tradeboard_access_token';
export const AUTH_UNAUTHORIZED_EVENT = 'tradeboard:unauthorized';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const resolvedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(resolvedPath, API_BASE_URL);

  const response = await fetch(url.toString(), {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) {
        message = data.message.join(', ');
      } else if (data.message) {
        message = data.message;
      }
    } catch {
      // ignore json parse failure
    }
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function buildApiUrl(path: string) {
  const resolvedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(resolvedPath, API_BASE_URL).toString();
}
