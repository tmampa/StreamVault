import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import {
  createSession,
  matchesHashedValue,
  normalizeRecoveryCode,
  normalizeUsername,
  rotateRecoveryCode,
  serializeUser,
  validateUsername,
} from '../_lib/auth.js';
import { allowMethods, readJsonBody, sendError, sendJson, withApiHandler } from '../_lib/http.js';

export default withApiHandler(async function recoverHandler(req, res) {
  if (!allowMethods(req, res, ['POST'])) {
    return;
  }

  const { username, recoveryCode } = await readJsonBody(req);
  const trimmedUsername = typeof username === 'string' ? username.trim() : '';
  const normalizedRecoveryCode = normalizeRecoveryCode(recoveryCode);
  const validationError = validateUsername(trimmedUsername);

  if (validationError) {
    sendError(res, 400, validationError);
    return;
  }

  if (!normalizedRecoveryCode) {
    sendError(res, 400, 'Recovery code is required.');
    return;
  }

  const normalizedUsername = normalizeUsername(trimmedUsername);
  const [userRecord] = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
      recoveryCodeHash: users.recoveryCodeHash,
    })
    .from(users)
    .where(eq(users.usernameNormalized, normalizedUsername))
    .limit(1);

  if (!userRecord || !matchesHashedValue(normalizedRecoveryCode, userRecord.recoveryCodeHash)) {
    sendError(res, 401, 'Invalid username or recovery code.');
    return;
  }

  const nextRecoveryCode = await rotateRecoveryCode(userRecord.id);
  await createSession(res, userRecord.id);

  sendJson(res, 200, {
    user: serializeUser(userRecord),
    recoveryCode: nextRecoveryCode,
  });
});