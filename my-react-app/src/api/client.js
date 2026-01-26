// Standard-URL til API'et, hvis ingen anden er angivet
// Bruges hvis der ikke er sat en miljøvariabel
const DEFAULT_API_BASE_URL =
  'https://assetshareapi-a8c6f5abbfg9ftbw.northeurope-01.azurewebsites.net/api';

// Finder base-URL til API'et
// Hvis der er sat en miljøvariabel (VITE_API_BASE_URL), bruges den
// Ellers bruges standarden ovenfor
// .replace(/\/$/, '') fjerner evt. skråstreg til sidst
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

// Navn på localStorage-nøgle til auth-token
const AUTH_TOKEN_STORAGE_KEY = 'assetshare_auth_token';
// Navn på localStorage-nøgle til bruger-id
const AUTH_USER_ID_STORAGE_KEY = 'assetshare_user_id';

// Henter auth-token fra localStorage
// Returnerer null hvis localStorage ikke findes (fx på serveren)
export function getStoredToken() {
  if (typeof localStorage === 'undefined') return null; // Sikrer at vi kun kører i browseren
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY); // Hent token
}

// Henter bruger-id fra localStorage
// Returnerer null hvis ikke sat eller ikke i browser
export function getStoredUserId() {
  if (typeof localStorage === 'undefined') return null; // Kun browser
  const value = localStorage.getItem(AUTH_USER_ID_STORAGE_KEY); // Hent værdi
  return value ? Number(value) : null; // Konverter til tal hvis muligt
}

// Gemmer auth-token i localStorage
// Hvis token er null, fjernes den fra localStorage
function setStoredToken(token) {
  if (typeof localStorage === 'undefined') return; // Kun browser
  if (token) {
    // Hvis vi har et token, gem det
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    // Hvis ikke, fjern det
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

// Gemmer bruger-id i localStorage
// Hvis userId er null, undefined eller NaN, fjernes det
function setStoredUserId(userId) {
  if (typeof localStorage === 'undefined') return; // Kun browser
  if (userId === null || userId === undefined || Number.isNaN(Number(userId))) {
    // Fjern hvis ugyldigt
    localStorage.removeItem(AUTH_USER_ID_STORAGE_KEY);
    return;
  }
  // Gem id som tekst
  localStorage.setItem(AUTH_USER_ID_STORAGE_KEY, String(userId));
}

// Fjerner både auth-token og bruger-id fra localStorage
// Bruges fx ved logout
export function clearStoredToken() {
  setStoredToken(null); // Fjern token
  setStoredUserId(null); // Fjern bruger-id
}

// Returnerer et objekt med Authorization-header hvis token findes
// Ellers returneres et tomt objekt
function getAuthHeaders() {
  const token = getStoredToken(); // Hent token
  if (!token) return {}; // Hvis ingen token, returner tomt objekt
  return { Authorization: `Bearer ${token}` }; // Ellers lav header
}

// Dekoder JWT-token og returnerer payload som objekt
// Hvis token er ugyldig, returneres null
function decodeJwtPayload(token) {
  if (!token) return null; // Ingen token
  const parts = token.split('.'); // Split token i dele
  if (parts.length < 2) return null; // Skal have mindst 2 dele
  // JWT payload er base64url-enkodet
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  // Tilføj padding hvis nødvendigt
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    // Dekodér og parse JSON
    return JSON.parse(atob(`${base64}${padding}`));
  } catch {
    // Hvis fejl, returner null
    return null;
  }
}

// Tjekker om et JWT-token er udløbet
// skewSeconds bruges for at tage højde for små tidsforskelle
function isTokenExpired(token, skewSeconds = 30) {
  const payload = decodeJwtPayload(token); // Dekodér token
  if (!payload || typeof payload.exp !== 'number') return false; // Hvis ingen exp, antag ikke udløbet
  const now = Math.floor(Date.now() / 1000); // Nu-tid i sekunder
  return now >= payload.exp - skewSeconds; // Sammenlign med exp
}

// Tjekker om det gemte token i localStorage er udløbet
// Returnerer true hvis der ikke er noget token
export function isStoredTokenExpired() {
  const token = getStoredToken(); // Hent token
  if (!token) return true; // Hvis ingen token, betragtes som udløbet
  return isTokenExpired(token); // Brug funktionen ovenfor
}

// Funktion der udfører et API-kald til backend
// path: stien til endpoint (fx '/User/1')
// options: metode, body, headers, signal
// Returnerer det parse-de payload fra svaret
async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  // Udfør HTTP-request med fetch
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method, // HTTP-metode (GET, POST, PUT, DELETE)
    signal, // AbortController signal (kan bruges til at afbryde request)
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}), // Tilføj content-type hvis der er body
      ...getAuthHeaders(), // Tilføj auth-header hvis token findes
      ...headers, // Evt. ekstra headers
    },
    body: body ? JSON.stringify(body) : undefined, // Konverter body til JSON hvis den findes
  });

  // Find content-type for svaret
  const contentType = response.headers.get('content-type') || '';
  let payload; // Her gemmes svaret

  // Hvis svaret er JSON, parse det
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    // Ellers prøv at parse som tekst
    const text = await response.text();
    try {
      payload = JSON.parse(text); // Prøv at parse tekst som JSON
    } catch {
      payload = text; // Hvis det fejler, brug ren tekst
    }
  }

  // Hvis statuskode ikke er OK (fx 400, 404, 500), kast fejl
  if (!response.ok) {
    // Byg fejl-objekt med besked og status
    const error = new Error(
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? payload.message
        : 'Request failed'
    );
    error.status = response.status;
    error.body = payload;
    throw error;
  }

  // Returner det parse-de payload
  return payload;
}

// Konverterer en fejl fra API-kald til et standardiseret objekt
// Hvis det er en AbortError, markeres det
function toApiError(error) {
  if (error.name === 'AbortError') {
    // Hvis request blev afbrudt
    return { message: 'Anmodning blev afbrudt.', aborted: true };
  }

  // Ellers returner fejlbesked, status og evt. detaljer
  return {
    message: error.message || 'Anmodning fejlede.',
    status: error.status || null,
    details: error.body || null,
  };
}

// Henter alle assets fra API'et
// Returnerer data eller fejl
export async function listAssets(signal) {
  try {
    const data = await request('/assets', { signal }); // Kald API
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Henter et enkelt asset ud fra id
// Returnerer data eller fejl
export async function getAsset(id, signal) {
  try {
    const data = await request(`/assets/${id}`, { signal }); // Kald API
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Opretter et nyt asset
// payload: objekt med data for asset
export async function createAsset(payload) {
  try {
    const data = await request('/assets', { method: 'POST', body: payload }); // POST-request
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Generiske CRUD-funktioner til Booking, Listing, Machine, User
// Henter alle ressourcer af en bestemt type (fx 'User', 'Listing')
// Returnerer data eller fejl
export async function listResource(resource, signal) {
  try {
    const data = await request(`/${resource}`, { signal }); // Kald API
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Henter en enkelt ressource ud fra type og id
// Returnerer data eller fejl
export async function getResource(resource, id, signal) {
  try {
    const data = await request(`/${resource}/${id}`, { signal }); // Kald API
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Opretter en ny ressource af en bestemt type
// payload: objekt med data for ressourcen
export async function createResource(resource, payload) {
  try {
    const data = await request(`/${resource}`, { method: 'POST', body: payload }); // POST-request
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Opdaterer en ressource ud fra type og id
// payload: objekt med opdaterede data
export async function updateResource(resource, id, payload) {
  try {
    const data = await request(`/${resource}/${id}`, { method: 'PUT', body: payload }); // PUT-request
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Sletter en ressource ud fra type og id
// Returnerer data eller fejl
export async function deleteResource(resource, id) {
  try {
    const data = await request(`/${resource}/${id}`, { method: 'DELETE' }); // DELETE-request
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Funktioner til anmeldelser (Review)
// Henter alle anmeldelser for en bestemt annonce (listing)
// Returnerer data eller fejl
export async function getReviewsByListing(listingId, signal) {
  try {
    const data = await request(`/Review/Listing/${listingId}`, { signal }); // Kald API
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Henter gennemsnitlig rating for en annonce (listing)
// Returnerer data eller fejl
export async function getAverageRating(listingId, signal) {
  try {
    const data = await request(`/Review/Rating/${listingId}`, { signal }); // Kald API
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Opretter en ny bruger
// payload: objekt med brugerdata
// Gemmer token og bruger-id hvis de findes i svaret
export async function registerUser(payload) {
  try {
    const data = await request('/Auth/register', { method: 'POST', body: payload }); // POST-request
    if (data && typeof data === 'object' && 'token' in data) {
      setStoredToken(data.token); // Gem token hvis det findes
    }
    if (data && typeof data === 'object' && 'userId' in data) {
      setStoredUserId(data.userId); // Gem bruger-id hvis det findes
    }
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Logger en bruger ind
// payload: objekt med login-data
// Gemmer token og bruger-id hvis de findes i svaret
export async function loginUser(payload) {
  try {
    const data = await request('/Auth/login', { method: 'POST', body: payload }); // POST-request
    if (data && typeof data === 'object' && 'token' in data) {
      setStoredToken(data.token); // Gem token hvis det findes
    }
    if (data && typeof data === 'object' && 'userId' in data) {
      setStoredUserId(data.userId); // Gem bruger-id hvis det findes
    }
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Henter nuværende bruger (hvis logget ind)
// Returnerer data eller fejl
export async function getCurrentUser(signal) {
  try {
    const data = await request('/Auth/me', { signal }); // Kald API
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}

// Tjekker om sessionen er gyldig
// Returnerer ok: true hvis alt er i orden, ellers ok: false og en grund
export async function validateSession(signal) {
  const token = getStoredToken(); // Hent token
  if (!token) return { ok: false, reason: 'missing' }; // Ingen token

  if (isTokenExpired(token)) {
    clearStoredToken(); // Fjern udløbet token
    return { ok: false, reason: 'expired' }; // Token udløbet
  }

  try {
    await request('/Auth/me', { signal }); // Tjek om token stadig virker
    return { ok: true };
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.status === 401) {
      clearStoredToken(); // Fjern ugyldigt token
    }
    return { ok: false, reason: 'invalid', error: apiError }; // Token ugyldigt
  }
}

// Logger brugeren ud
// Kalder API og fjerner token/id fra localStorage
export async function logoutUser() {
  try {
    const data = await request('/Auth/logout', { method: 'POST' }); // POST-request
    clearStoredToken(); // Fjern token og id
    return { data };
  } catch (error) {
    return { error: toApiError(error) }; // Returner fejl hvis det fejler
  }
}
