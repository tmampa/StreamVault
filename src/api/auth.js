class AuthApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new AuthApiError(payload?.error || `Request failed with status ${response.status}.`, response.status);
  }

  return payload;
}

export async function getCurrentUser() {
  const payload = await requestJson('/api/auth/me');
  return payload?.user || null;
}

export async function registerUsername(username) {
  return requestJson('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function recoverUsername(username, recoveryCode) {
  return requestJson('/api/auth/recover', {
    method: 'POST',
    body: JSON.stringify({ username, recoveryCode }),
  });
}

export async function rotateRecoveryCode() {
  return requestJson('/api/auth/recovery-code', {
    method: 'POST',
  });
}

export async function logoutUser() {
  return requestJson('/api/auth/logout', {
    method: 'POST',
  });
}

export { AuthApiError };