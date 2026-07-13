import { beforeEach, vi } from "vitest";

// Mock the database module before any imports
vi.mock("../src/db", async () => {
	const { drizzle } = await import("drizzle-orm/libsql");
	const { createClient } = await import("@libsql/client");
	const schema = await import("@chirp/db-schema");

	// Create a unique in-memory database for each test file
	const client = createClient({
		url: ":memory:",
	});

	const db = drizzle(client, { schema });

	// Create tables
	await client.execute(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT NOT NULL UNIQUE,
			username TEXT NOT NULL UNIQUE,
			display_name TEXT NOT NULL,
			avatar_url TEXT,
			bio TEXT,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'user',
			banned_at INTEGER,
			banned_reason TEXT,
			banned_by TEXT,
			is_online INTEGER NOT NULL DEFAULT 0,
			last_seen INTEGER,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			updated_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS posts (
			id TEXT PRIMARY KEY,
			content TEXT NOT NULL,
			author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			updated_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS comments (
			id TEXT PRIMARY KEY,
			content TEXT NOT NULL,
			post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
			author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS likes (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
			comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
			reaction_type TEXT NOT NULL DEFAULT 'like',
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			UNIQUE(user_id, post_id),
			UNIQUE(user_id, comment_id)
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS friend_requests (
			id TEXT PRIMARY KEY,
			requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			status TEXT NOT NULL DEFAULT 'pending',
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
			UNIQUE(requester_id, recipient_id)
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS follows (
			id TEXT PRIMARY KEY,
			follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			UNIQUE(follower_id, following_id)
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS shares (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
			destination TEXT NOT NULL DEFAULT 'external',
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS reposts (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
			quote TEXT,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS bookmarks (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			UNIQUE(user_id, post_id)
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS notifications (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			type TEXT NOT NULL,
			actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
			comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
			read INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS reports (
			id TEXT PRIMARY KEY,
			reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			target_type TEXT NOT NULL,
			target_id TEXT NOT NULL,
			reason TEXT NOT NULL,
			description TEXT,
			status TEXT NOT NULL DEFAULT 'pending',
			reviewed_by TEXT REFERENCES users(id),
			reviewed_at INTEGER,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS audit_logs (
			id TEXT PRIMARY KEY,
			admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			action TEXT NOT NULL,
			target_type TEXT,
			target_id TEXT,
			details TEXT,
			ip_address TEXT,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS conversations (
			id TEXT PRIMARY KEY,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			updated_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS conversation_participants (
			id TEXT PRIMARY KEY,
			conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			last_read_at INTEGER,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			UNIQUE(conversation_id, user_id)
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS messages (
			id TEXT PRIMARY KEY,
			conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
			sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			read_at INTEGER,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS badges (
			id TEXT PRIMARY KEY,
			code TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			description TEXT NOT NULL,
			threshold INTEGER,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		)
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS user_badges (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
			awarded_at INTEGER NOT NULL DEFAULT (unixepoch()),
			UNIQUE(user_id, badge_id)
		)
	`);

	return { db, schema, client };
});

// Clean up database before each test
beforeEach(async (context) => {
	if (
		context.task.file.name.endsWith("ai.service.test.ts") ||
		context.task.file.name.endsWith("feed-ranking.test.ts")
	) {
		return;
	}

	const { client } = await import("../src/db");
	const testClient = client as { execute: (statement: string) => Promise<unknown> };
	// Clear all tables in reverse order of dependencies
	await testClient.execute("DELETE FROM user_badges");
	await testClient.execute("DELETE FROM badges");
	await testClient.execute("DELETE FROM messages");
	await testClient.execute("DELETE FROM conversation_participants");
	await testClient.execute("DELETE FROM conversations");
	await testClient.execute("DELETE FROM audit_logs");
	await testClient.execute("DELETE FROM reports");
	await testClient.execute("DELETE FROM notifications");
	await testClient.execute("DELETE FROM reposts");
	await testClient.execute("DELETE FROM shares");
	await testClient.execute("DELETE FROM bookmarks");
	await testClient.execute("DELETE FROM friend_requests");
	await testClient.execute("DELETE FROM follows");
	await testClient.execute("DELETE FROM likes");
	await testClient.execute("DELETE FROM comments");
	await testClient.execute("DELETE FROM posts");
	await testClient.execute("DELETE FROM users");
});
