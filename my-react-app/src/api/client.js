const DEFAULT_API_BASE_URL =
  'https://assetshareapi-a8c6f5abbfg9ftbw.northeurope-01.azurewebsites.net/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const AUTH_TOKEN_STORAGE_KEY = 'assetshare_auth_token';
const AUTH_USER_ID_STORAGE_KEY = 'assetshare_user_id';

export function getStoredToken() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getStoredUserId() {
  if (typeof localStorage === 'undefined') return null;
  const value = localStorage.getItem(AUTH_USER_ID_STORAGE_KEY);
  return value ? Number(value) : null;
}

function setStoredToken(token) {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

function setStoredUserId(userId) {
  if (typeof localStorage === 'undefined') return;
  if (userId === null || userId === undefined || Number.isNaN(Number(userId))) {
    localStorage.removeItem(AUTH_USER_ID_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_USER_ID_STORAGE_KEY, String(userId));
}

export function clearStoredToken() {
  setStoredToken(null);
  setStoredUserId(null);
}

function getAuthHeaders() {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function decodeJwtPayload(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    return JSON.parse(atob(`${base64}${padding}`));
  } catch {
    return null;
  }
}

function isTokenExpired(token, skewSeconds = 30) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= payload.exp - skewSeconds;
}

export function isStoredTokenExpired() {
  const token = getStoredToken();
  if (!token) return true;
  return isTokenExpired(token);
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...getAuthHeaders(),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  let payload;

  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    const text = await response.text();
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const error = new Error(
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? payload.message
        : 'Request failed'
    );
    error.status = response.status;
    error.body = payload;
    throw error;
  }

  return payload;
}

function toApiError(error) {
  if (error.name === 'AbortError') {
    return { message: 'Anmodning blev afbrudt.', aborted: true };
  }

  return {
    message: error.message || 'Anmodning fejlede.',
    status: error.status || null,
    details: error.body || null,
  };
}

export async function listAssets(signal) {
  try {
    const data = await request('/assets', { signal });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function getAsset(id, signal) {
  try {
    const data = await request(`/assets/${id}`, { signal });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function createAsset(payload) {
  try {
    const data = await request('/assets', { method: 'POST', body: payload });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

// Generic helpers for CRUD resources (Booking, Listing, Machine, User)
export async function listResource(resource, signal) {
  try {
    const data = await request(`/${resource}`, { signal });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function getResource(resource, id, signal) {
  try {
    const data = await request(`/${resource}/${id}`, { signal });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function createResource(resource, payload) {
  try {
    const data = await request(`/${resource}`, { method: 'POST', body: payload });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function updateResource(resource, id, payload) {
  try {
    const data = await request(`/${resource}/${id}`, { method: 'PUT', body: payload });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function deleteResource(resource, id) {
  try {
    const data = await request(`/${resource}/${id}`, { method: 'DELETE' });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

// Review functions
export async function getReviewsByListing(listingId, signal) {
  try {
    const data = await request(`/Review/Listing/${listingId}`, { signal });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function getAverageRating(listingId, signal) {
  try {
    const data = await request(`/Review/Rating/${listingId}`, { signal });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function registerUser(payload) {
  try {
    const data = await request('/Auth/register', { method: 'POST', body: payload });
    if (data && typeof data === 'object' && 'token' in data) {
      setStoredToken(data.token);
    }
    if (data && typeof data === 'object' && 'userId' in data) {
      setStoredUserId(data.userId);
    }
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function loginUser(payload) {
  try {
    const data = await request('/Auth/login', { method: 'POST', body: payload });
    if (data && typeof data === 'object' && 'token' in data) {
      setStoredToken(data.token);
    }
    if (data && typeof data === 'object' && 'userId' in data) {
      setStoredUserId(data.userId);
    }
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function getCurrentUser(signal) {
  try {
    const data = await request('/Auth/me', { signal });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}

export async function validateSession(signal) {
  const token = getStoredToken();
  if (!token) return { ok: false, reason: 'missing' };

  if (isTokenExpired(token)) {
    clearStoredToken();
    return { ok: false, reason: 'expired' };
  }

  try {
    await request('/Auth/me', { signal });
    return { ok: true };
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.status === 401) {
      clearStoredToken();
    }
    return { ok: false, reason: 'invalid', error: apiError };
  }
}

export async function logoutUser() {
  try {
    const data = await request('/Auth/logout', { method: 'POST' });
    clearStoredToken();
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
}
