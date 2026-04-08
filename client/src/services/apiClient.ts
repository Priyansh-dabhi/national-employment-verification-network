const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

const ACCESS_TOKEN_KEY = 'nevn_token';
const ROLE_KEY = 'nevn_role';
const ACCOUNT_STATUS_KEY = 'nevn_account_status';

type UnauthorizedHandler = (() => void) | null;

interface RefreshResponse {
  token?: string;
  role?: string;
  account_status?: string;
}

interface ApiRequestOptions extends RequestInit {
  auth?: boolean;
  skipRefresh?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let unauthorizedHandler: UnauthorizedHandler = null;
let refreshPromise: Promise<string | null> | null = null;

const parseJsonSafely = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const buildUrl = (path: string) =>
  path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const notifyUnauthorized = () => {
  authStorage.clearUserSession();
  unauthorizedHandler?.();
};

const doRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<{ response: Response; data: T | null }> => {
  const { auth = true, headers, ...init } = options;
  const requestHeaders = new Headers(headers);

  if (auth) {
    const token = authStorage.getAccessToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: requestHeaders,
    credentials: 'include',
  });

  const data = await parseJsonSafely<T>(response);
  return { response, data };
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(`${AUTH_BASE_URL}/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await parseJsonSafely<RefreshResponse>(response);

    if (!response.ok || !data?.token) {
      notifyUnauthorized();
      return null;
    }

    authStorage.setUserSession({
      token: data.token,
      role: data.role,
      accountStatus: data.account_status,
    });

    return data.token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRole: () => localStorage.getItem(ROLE_KEY),
  getAccountStatus: () => localStorage.getItem(ACCOUNT_STATUS_KEY),
  setUserSession: ({
    token,
    role,
    accountStatus,
  }: {
    token: string;
    role?: string;
    accountStatus?: string;
  }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);

    if (role) {
      localStorage.setItem(ROLE_KEY, role);
    }

    if (accountStatus) {
      localStorage.setItem(ACCOUNT_STATUS_KEY, accountStatus);
    }
  },
  clearUserSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(ACCOUNT_STATUS_KEY);
  },
};

export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

export const apiClient = {
  request: async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
    const { auth = true, skipRefresh = false } = options;

    let { response, data } = await doRequest<T>(path, options);

    if (auth && response.status === 401 && !skipRefresh) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        const retryResult = await doRequest<T>(path, { ...options, skipRefresh: true });
        response = retryResult.response;
        data = retryResult.data;
      }
    }

    if (!response.ok) {
      if (auth && response.status === 401) {
        notifyUnauthorized();
      }

      const message =
        typeof data === 'object' && data && 'message' in data && typeof data.message === 'string'
          ? data.message
          : `Request failed (${response.status})`;

      throw new ApiError(message, response.status, data);
    }

    return data as T;
  },
};
