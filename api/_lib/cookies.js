function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (Number.isFinite(options.maxAge)) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  if (options.expires instanceof Date) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  parts.push(`Path=${options.path || '/'}`);
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);

  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }

  if (options.secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function appendSetCookie(res, cookieValue) {
  const existingValue = res.getHeader('Set-Cookie');
  const nextCookies = existingValue
    ? Array.isArray(existingValue)
      ? [...existingValue, cookieValue]
      : [existingValue, cookieValue]
    : [cookieValue];

  res.setHeader('Set-Cookie', nextCookies);
}

export function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf('=');

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = entry.slice(0, separatorIndex);
      const value = entry.slice(separatorIndex + 1);
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

export function getCookie(req, name) {
  const cookies = parseCookies(req.headers?.cookie || '');
  return cookies[name] || null;
}

export function createAuthCookie(name, value, options = {}) {
  return serializeCookie(name, value, options);
}

export function createExpiredCookie(name) {
  return serializeCookie(name, '', {
    maxAge: 0,
    expires: new Date(0),
    path: '/',
    sameSite: 'Lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
}