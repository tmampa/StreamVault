import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    username: text('username').notNull(),
    usernameNormalized: text('username_normalized').notNull(),
    recoveryCodeHash: text('recovery_code_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    usernameNormalizedUnique: uniqueIndex('users_username_normalized_idx').on(table.usernameNormalized),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex('sessions_token_hash_idx').on(table.tokenHash),
  }),
);

export const watchParties = pgTable(
  'watch_parties',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    partyCode: text('party_code').notNull(),
    hostUserId: uuid('host_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mediaType: text('media_type').notNull(),
    tmdbId: integer('tmdb_id').notNull(),
    seasonNumber: integer('season_number'),
    episodeNumber: integer('episode_number'),
    status: text('status').default('lobby').notNull(),
    stateVersion: integer('state_version').default(0).notNull(),
    lastPlaybackEvent: text('last_playback_event'),
    lastPlaybackSeconds: integer('last_playback_seconds').default(0).notNull(),
    lastPlaybackMeta: jsonb('last_playback_meta').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    partyCodeUnique: uniqueIndex('watch_parties_party_code_idx').on(table.partyCode),
  }),
);

export const partyMembers = pgTable(
  'party_members',
  {
    partyId: uuid('party_id')
      .notNull()
      .references(() => watchParties.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').default('guest').notNull(),
    isReady: boolean('is_ready').default(false).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({ name: 'party_members_pk', columns: [table.partyId, table.userId] }),
  }),
);

export const partyMessages = pgTable('party_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  partyId: uuid('party_id')
    .notNull()
    .references(() => watchParties.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const partyReactions = pgTable('party_reactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  partyId: uuid('party_id')
    .notNull()
    .references(() => watchParties.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  emoji: text('emoji').notNull(),
  playbackSeconds: integer('playback_seconds').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const watchlists = pgTable(
  'watchlists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    visibility: text('visibility').default('private').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerSlugUnique: uniqueIndex('watchlists_owner_slug_idx').on(table.ownerUserId, table.slug),
  }),
);

export const watchlistItems = pgTable(
  'watchlist_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    watchlistId: uuid('watchlist_id')
      .notNull()
      .references(() => watchlists.id, { onDelete: 'cascade' }),
    addedByUserId: uuid('added_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tmdbId: integer('tmdb_id').notNull(),
    mediaType: text('media_type').notNull(),
    title: text('title').notNull(),
    posterPath: text('poster_path'),
    voteAverage: integer('vote_average'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    watchlistItemUnique: uniqueIndex('watchlist_items_unique_idx').on(table.watchlistId, table.mediaType, table.tmdbId),
  }),
);

export const titleReviews = pgTable(
  'title_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mediaType: text('media_type').notNull(),
    tmdbId: integer('tmdb_id').notNull(),
    rating: integer('rating'),
    reviewText: text('review_text'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userTitleUnique: uniqueIndex('title_reviews_user_title_idx').on(table.userId, table.mediaType, table.tmdbId),
  }),
);