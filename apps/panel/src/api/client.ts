export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function notifyUnauthorized() {
  try {
    unauthorizedHandler?.();
  } catch {
    // Keep request error propagation independent of auth UI handling.
  }
}

function extractErrorMessage(rawBody: string) {
  const plain = rawBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > 220 ? `${plain.slice(0, 220)}...` : plain;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => ({})) : null;
  const rawBody = isJson ? "" : await response.text().catch(() => "");

  if (!response.ok) {
    if (response.status === 401 && !options.skipAuthRedirect) {
      notifyUnauthorized();
    }

    const data = payload && typeof payload === "object" ? payload : null;
    const message =
      (data && "error" in data && String(data.error)) ||
      (data && "message" in data && String(data.message)) ||
      extractErrorMessage(rawBody) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return payload as T;
}

export function get<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}, options: RequestOptions = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return apiRequest<T>(query ? `${endpoint}?${query}` : endpoint, {
    ...options,
    method: "GET",
  });
}

export function post<T>(endpoint: string, data: unknown = {}) {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function postWithOptions<T>(endpoint: string, data: unknown = {}, options: RequestOptions = {}) {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function put<T>(endpoint: string, data: unknown = {}) {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function patch<T>(endpoint: string, data: unknown = {}) {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function del<T>(endpoint: string, data?: unknown) {
  return apiRequest<T>(endpoint, {
    method: "DELETE",
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}
