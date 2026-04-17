import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { sessions, users } from '../../db/schema.js';
import { appendSetCookie, createAuthCookie, createExpiredCookie, getCookie } from './cookies.js';

const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const DEFAULT_AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'tm_session';

function getSessionTtlDays() {
  const parsedValue = Number.parseInt(process.env.AUTH_SESSION_TTL_DAYS || '30', 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 30;
}

function getSessionTtlMilliseconds() {
  return getSessionTtlDays() * 24 * 60 * 60 * 1000;
}

function toIsoString(value) {
  return value instanceof Date ? value.toISOString() : value;
}

export function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return 'Username is required.';
  }

  const trimmedUsername = username.trim();

  if (!USERNAME_PATTERN.test(trimmedUsername)) {
    return 'Usernames must be 3-20 characters and use only letters, numbers, or underscores.';
  }

  return null;
}

export function normalizeRecoveryCode(recoveryCode) {
  return String(recoveryCode || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function hashValue(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function matchesHashedValue(rawValue, hashedValue) {
  const candidateHash = hashValue(rawValue);
  const candidateBuffer = Buffer.from(candidateHash, 'hex');
  const expectedBuffer = Buffer.from(String(hashedValue || ''), 'hex');

  if (candidateBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

export function generateRecoveryCode() {
  const bytes = randomBytes(16);
  const code = Array.from(bytes, (byte) => RECOVERY_CODE_ALPHABET[byte % RECOVERY_CODE_ALPHABET.length])
    .slice(0, 16)
    .join('');

  return code.match(/.{1,4}/g).join('-');
}

export function generateSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    createdAt: toIsoString(user.createdAt),
  };
}

export async function createSession(res, userId) {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + getSessionTtlMilliseconds());

  await db.insert(sessions).values({
    userId,
    tokenHash: hashValue(sessionToken),
    expiresAt,
  });

  appendSetCookie(
    res,
    createAuthCookie(DEFAULT_AUTH_COOKIE_NAME, sessionToken, {
      maxAge: getSessionTtlDays() * 24 * 60 * 60,
      expires: expiresAt,
      path: '/',
      sameSite: 'Lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    }),
  );

  return expiresAt;
}

export async function revokeSession(req, res) {
  const sessionToken = getCookie(req, DEFAULT_AUTH_COOKIE_NAME);

  if (sessionToken) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.tokenHash, hashValue(sessionToken)), isNull(sessions.revokedAt)));
  }

  appendSetCookie(res, createExpiredCookie(DEFAULT_AUTH_COOKIE_NAME));
}

export async function getAuthenticatedUser(req) {
  const sessionToken = getCookie(req, DEFAULT_AUTH_COOKIE_NAME);

  if (!sessionToken) {
    return null;
  }

  const now = new Date();
  const [sessionRecord] = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      username: users.username,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashValue(sessionToken)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!sessionRecord) {
    return null;
  }

  await Promise.all([
    db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, sessionRecord.sessionId)),
    db.update(users).set({ lastSeenAt: now }).where(eq(users.id, sessionRecord.userId)),
  ]);

  return {
    sessionId: sessionRecord.sessionId,
    userId: sessionRecord.userId,
    user: serializeUser({
      id: sessionRecord.userId,
      username: sessionRecord.username,
      createdAt: sessionRecord.createdAt,
    }),
  };
}

export async function rotateRecoveryCode(userId) {
  const nextRecoveryCode = generateRecoveryCode();
  const now = new Date();

  await db
    .update(users)
    .set({
      recoveryCodeHash: hashValue(normalizeRecoveryCode(nextRecoveryCode)),
      updatedAt: now,
      lastSeenAt: now,
    })
    .where(eq(users.id, userId));

  return nextRecoveryCode;
}