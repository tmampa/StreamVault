import { revokeSession } from '../_lib/auth.js';
import { allowMethods, sendJson, withApiHandler } from '../_lib/http.js';

export default withApiHandler(async function logoutHandler(req, res) {
  if (!allowMethods(req, res, ['POST'])) {
    return;
  }

  await revokeSession(req, res);
  sendJson(res, 200, { ok: true });
});