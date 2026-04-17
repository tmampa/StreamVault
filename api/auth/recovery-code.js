import { getAuthenticatedUser, rotateRecoveryCode } from '../_lib/auth.js';
import { allowMethods, sendError, sendJson, withApiHandler } from '../_lib/http.js';

export default withApiHandler(async function recoveryCodeHandler(req, res) {
  if (!allowMethods(req, res, ['POST'])) {
    return;
  }

  const authenticatedUser = await getAuthenticatedUser(req);

  if (!authenticatedUser) {
    sendError(res, 401, 'You need to sign in to rotate the recovery code.');
    return;
  }

  const recoveryCode = await rotateRecoveryCode(authenticatedUser.userId);

  sendJson(res, 200, { recoveryCode });
});