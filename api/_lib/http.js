const DEFAULT_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

export function sendJson(res, statusCode, payload, headers = {}) {
  const mergedHeaders = { ...DEFAULT_HEADERS, ...headers };

  Object.entries(mergedHeaders).forEach(([headerName, headerValue]) => {
    res.setHeader(headerName, headerValue);
  });

  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

export function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

export function allowMethods(req, res, allowedMethods) {
  if (allowedMethods.includes(req.method)) {
    return true;
  }

  res.setHeader('Allow', allowedMethods.join(', '));
  sendError(res, 405, `Method ${req.method} is not allowed.`);
  return false;
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return req.body ? JSON.parse(req.body) : {};
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

export function withApiHandler(handler) {
  return async function apiHandler(req, res) {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API request failed:', error);
      sendError(res, 500, error instanceof Error ? error.message : 'Unexpected server error.');
    }
  };
}