import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import {
  createSession,
  generateRecoveryCode,
  hashValue,
  normalizeRecoveryCode,
  normalizeUsername,
  serializeUser,
  validateUsername,
} from '../_lib/auth.js';
import { allowMethods, readJsonBody, sendError, sendJson, withApiHandler } from '../_lib/http.js';

export default withApiHandler(async function registerHandler(req, res) {
  if (!allowMethods(req, res, ['POST'])) {
    return;
  }

  const { username } = await readJsonBody(req);
  const trimmedUsername = typeof username === 'string' ? username.trim() : '';
  const validationError = validateUsername(trimmedUsername);

  if (validationError) {
    sendError(res, 400, validationError);
    return;
  }

  const normalizedUsername = normalizeUsername(trimmedUsername);
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.usernameNormalized, normalizedUsername))
    .limit(1);

  if (existingUser) {
    sendError(res, 409, 'That username is already taken.');
    return;
  }

  const recoveryCode = generateRecoveryCode();
  const now = new Date();

  const [nextUser] = await db
    .insert(users)
    .values({
      username: trimmedUsername,
      usernameNormalized: normalizedUsername,
      recoveryCodeHash: hashValue(normalizeRecoveryCode(recoveryCode)),
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    })
    .returning({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
    });

  await createSession(res, nextUser.id);

  sendJson(res, 201, {
    user: serializeUser(nextUser),
    recoveryCode,
  });
});