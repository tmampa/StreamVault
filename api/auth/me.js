import { getAuthenticatedUser } from '../_lib/auth.js';
import { appendSetCookie, createExpiredCookie } from '../_lib/cookies.js';
import { allowMethods, sendJson, withApiHandler } from '../_lib/http.js';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'tm_session';

export default withApiHandler(async function meHandler(req, res) {
  if (!allowMethods(req, res, ['GET'])) {
    return;
  }

  const authenticatedUser = await getAuthenticatedUser(req);

  if (!authenticatedUser) {
    appendSetCookie(res, createExpiredCookie(AUTH_COOKIE_NAME));
    sendJson(res, 200, { user: null });
    return;
  }

  sendJson(res, 200, { user: authenticatedUser.user });
});