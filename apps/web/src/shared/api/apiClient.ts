type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit;
  json?: unknown;
  skipAuthRefresh?: boolean;
};

const REFRESH_PATH = '/api/v1/auth/refresh';

let pendingRefreshRequest: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: unknown,
  ) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { skipAuthRefresh = false, ...requestOptions } = options;
  let response = await sendRequest(path, requestOptions);

  if (response.status === 401 && !skipAuthRefresh) {
    const sessionRefreshed = await refreshSession();

    if (sessionRefreshed) {
      response = await sendRequest(path, requestOptions);
    }
  }

  if (!response.ok) {
    throw await createApiError(response);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

async function sendRequest(
  path: string,
  options: ApiRequestOptions,
): Promise<Response> {
  const { body, headers, json, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);

  if (body !== undefined && json !== undefined) {
    throw new Error('Use either body or json for an API request');
  }

  if (json !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  return fetch(createApiUrl(path), {
    ...requestOptions,
    body: json === undefined ? body : JSON.stringify(json),
    credentials: 'include',
    headers: requestHeaders,
  });
}

function createApiUrl(path: string): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

function refreshSession(): Promise<boolean> {
  if (!pendingRefreshRequest) {
    pendingRefreshRequest = requestSessionRefresh().finally(() => {
      pendingRefreshRequest = null;
    });
  }

  return pendingRefreshRequest;
}

async function requestSessionRefresh(): Promise<boolean> {
  const response = await fetch(createApiUrl(REFRESH_PATH), {
    credentials: 'include',
    method: 'POST',
  });

  if (response.ok) {
    return true;
  }

  if (response.status === 401) {
    return false;
  }

  throw await createApiError(response);
}

async function createApiError(response: Response): Promise<ApiError> {
  const data: unknown = await response.json().catch(() => null);

  return new ApiError(response.status, data);
}
