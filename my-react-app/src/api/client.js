const DEFAULT_API_BASE_URL =
  'https://assetshareapi-a8c6f5abbfg9ftbw.northeurope-01.azurewebsites.net/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
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
