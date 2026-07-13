import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { emitMessageEvent, emitShareEvent } from "../realtime/socket";
import { createNotification } from "./notifications.service";
import { generateId } from "./utils";

const {
	badges,
	comments,
	conversationParticipants,
	conversations,
	likes,
	messages,
	posts,
	reposts,
	shares,
	userBadges,
	users,
} = schema;

const DEFAULT_BADGES = [
	["first_post", "First Post", "Published the first post on Pulse", 1],
	["100_posts", "100 Posts", "Published 100 posts", 100],
	["1000_likes", "1000 Likes", "Received 1000 likes or reactions", 1000],
	["top_contributor", "Top Contributor", "Consistently creates high-engagement posts", null],
	["helpful_user", "Helpful User", "Contributes helpful comments to the community", 50],
	["rising_creator", "Rising Creator", "Growing an active audience", 10],
	["verified_developer", "Verified Developer", "Recognized as a developer in the community", null],
	["community_leader", "Community Leader", "Built a large follower network", 100],
] as const;

async function getPostOrThrow(postId: string) {
	const post = await db
		.select()
		.from(posts)
		.where(eq(posts.id, postId))
		.then((rows) => rows[0]);

	if (!post) {
		throw new Error("Post not found");
	}

	return post;
}

async function getShareCount(postId: string) {
	const shareResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(shares)
		.where(eq(shares.postId, postId))
		.then((rows) => rows[0]);
	const repostResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(reposts)
		.where(eq(reposts.postId, postId))
		.then((rows) => rows[0]);

	return (shareResult?.count || 0) + (repostResult?.count || 0);
}

export async function sharePost(postId: string, userId: string, destination = "external") {
	const post = await getPostOrThrow(postId);
	const shareId = generateId();

	await db.insert(shares).values({
		id: shareId,
		postId,
		userId,
		destination: destination === "pulse" ? "pulse" : "external",
	});

	await createNotification({
		userId: post.authorId,
		type: "post_shared",
		actorId: userId,
		postId,
	});

	const shareCount = await getShareCount(postId);
	emitShareEvent({ type: "share:update", postId, userId, shareId, shareCount, destination });

	return { shareId, shareCount };
}

export async function createRepost(postId: string, userId: string, quote?: string) {
	const post = await getPostOrThrow(postId);
	const repostId = generateId();

	await db.insert(reposts).values({
		id: repostId,
		postId,
		userId,
		quote: quote || null,
	});

	await createNotification({
		userId: post.authorId,
		type: "post_shared",
		actorId: userId,
		postId,
	});

	const shareCount = await getShareCount(postId);
	emitShareEvent({
		type: "share:update",
		postId,
		userId,
		repostId,
		shareCount,
		quote: quote || null,
	});

	return { repostId, shareCount };
}

export async function getPostShareCount(postId: string) {
	return { count: await getShareCount(postId) };
}

export async function getOrCreateConversation(userId: string, recipientId: string) {
	if (userId === recipientId) {
		throw new Error("Cannot create a conversation with yourself");
	}

	const ownedConversations = await db
		.select({ conversationId: conversationParticipants.conversationId })
		.from(conversationParticipants)
		.where(eq(conversationParticipants.userId, userId));

	const conversationIds = ownedConversations.map((row) => row.conversationId);
	if (conversationIds.length > 0) {
		const existing = await db
			.select({ conversationId: conversationParticipants.conversationId })
			.from(conversationParticipants)
			.where(
				and(
					inArray(conversationParticipants.conversationId, conversationIds),
					eq(conversationParticipants.userId, recipientId),
				),
			)
			.then((rows) => rows[0]);

		if (existing) {
			return getConversation(existing.conversationId, userId);
		}
	}

	const conversationId = generateId();
	await db.insert(conversations).values({ id: conversationId });
	await db.insert(conversationParticipants).values([
		{ id: generateId(), conversationId, userId },
		{ id: generateId(), conversationId, userId: recipientId },
	]);

	return getConversation(conversationId, userId);
}

async function assertParticipant(conversationId: string, userId: string) {
	const participant = await db
		.select()
		.from(conversationParticipants)
		.where(
			and(
				eq(conversationParticipants.conversationId, conversationId),
				eq(conversationParticipants.userId, userId),
			),
		)
		.then((rows) => rows[0]);

	if (!participant) {
		throw new Error("Conversation not found");
	}
}

async function getConversation(conversationId: string, viewerId: string) {
	await assertParticipant(conversationId, viewerId);

	const participantRows = await db
		.select({
			id: users.id,
			username: users.username,
			displayName: users.displayName,
			avatarUrl: users.avatarUrl,
		})
		.from(conversationParticipants)
		.innerJoin(users, eq(conversationParticipants.userId, users.id))
		.where(eq(conversationParticipants.conversationId, conversationId));

	const lastMessage = await db
		.select({ content: messages.content, createdAt: messages.createdAt })
		.from(messages)
		.where(eq(messages.conversationId, conversationId))
		.orderBy(desc(messages.createdAt))
		.limit(1)
		.then((rows) => rows[0]);

	const unread = await db
		.select({ count: sql<number>`count(*)` })
		.from(messages)
		.where(
			and(
				eq(messages.conversationId, conversationId),
				ne(messages.senderId, viewerId),
				sql`${messages.readAt} is null`,
			),
		)
		.then((rows) => rows[0]);

	return {
		id: conversationId,
		participants: participantRows,
		unreadCount: unread?.count || 0,
		lastMessage: lastMessage?.content || null,
		updatedAt: lastMessage?.createdAt || new Date(),
	};
}

export async function getConversations(userId: string, limit = 20, offset = 0) {
	const rows = await db
		.select({ conversationId: conversationParticipants.conversationId })
		.from(conversationParticipants)
		.where(eq(conversationParticipants.userId, userId))
		.limit(limit)
		.offset(offset);

	return Promise.all(rows.map((row) => getConversation(row.conversationId, userId)));
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
	if (!content.trim()) {
		throw new Error("Message content is required");
	}

	await assertParticipant(conversationId, senderId);

	const messageId = generateId();
	await db.insert(messages).values({
		id: messageId,
		conversationId,
		senderId,
		content,
	});

	const message = await getMessage(messageId);
	const participantRows = await db
		.select({ userId: conversationParticipants.userId })
		.from(conversationParticipants)
		.where(eq(conversationParticipants.conversationId, conversationId));

	emitMessageEvent(
		participantRows.map((row) => row.userId),
		message,
	);

	return message;
}

async function getMessage(messageId: string) {
	const message = await db
		.select({
			id: messages.id,
			conversationId: messages.conversationId,
			content: messages.content,
			readAt: messages.readAt,
			createdAt: messages.createdAt,
			sender: {
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				avatarUrl: users.avatarUrl,
			},
		})
		.from(messages)
		.innerJoin(users, eq(messages.senderId, users.id))
		.where(eq(messages.id, messageId))
		.then((rows) => rows[0]);

	if (!message) {
		throw new Error("Message not found");
	}

	return message;
}

export async function getMessages(conversationId: string, userId: string, limit = 50, offset = 0) {
	await assertParticipant(conversationId, userId);

	return db
		.select({
			id: messages.id,
			conversationId: messages.conversationId,
			content: messages.content,
			readAt: messages.readAt,
			createdAt: messages.createdAt,
			sender: {
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				avatarUrl: users.avatarUrl,
			},
		})
		.from(messages)
		.innerJoin(users, eq(messages.senderId, users.id))
		.where(eq(messages.conversationId, conversationId))
		.orderBy(desc(messages.createdAt))
		.limit(limit)
		.offset(offset);
}

export async function markConversationRead(conversationId: string, userId: string) {
	await assertParticipant(conversationId, userId);
	const now = new Date();

	await db
		.update(messages)
		.set({ readAt: now })
		.where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, userId)));
	await db
		.update(conversationParticipants)
		.set({ lastReadAt: now })
		.where(
			and(
				eq(conversationParticipants.conversationId, conversationId),
				eq(conversationParticipants.userId, userId),
			),
		);

	return { success: true };
}

async function ensureDefaultBadges() {
	for (const [code, name, description, threshold] of DEFAULT_BADGES) {
		const existing = await db
			.select()
			.from(badges)
			.where(eq(badges.code, code))
			.then((rows) => rows[0]);

		if (!existing) {
			await db.insert(badges).values({
				id: generateId(),
				code,
				name,
				description,
				threshold,
			});
		}
	}
}

async function awardBadge(userId: string, code: string) {
	const badge = await db
		.select()
		.from(badges)
		.where(eq(badges.code, code))
		.then((rows) => rows[0]);

	if (!badge) {
		return;
	}

	const existing = await db
		.select()
		.from(userBadges)
		.where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id)))
		.then((rows) => rows[0]);

	if (!existing) {
		await db.insert(userBadges).values({ id: generateId(), userId, badgeId: badge.id });
	}
}

export async function recalculateBadges(userId: string) {
	await ensureDefaultBadges();

	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.then((rows) => rows[0]);

	if (!user) {
		throw new Error("User not found");
	}

	const postCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(posts)
		.where(eq(posts.authorId, userId))
		.then((rows) => rows[0]);
	const receivedLikes = await db
		.select({ count: sql<number>`count(*)` })
		.from(likes)
		.innerJoin(posts, eq(likes.postId, posts.id))
		.where(eq(posts.authorId, userId))
		.then((rows) => rows[0]);
	const commentCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(comments)
		.where(eq(comments.authorId, userId))
		.then((rows) => rows[0]);
	const followerCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.follows)
		.where(eq(schema.follows.followingId, userId))
		.then((rows) => rows[0]);

	const postsTotal = postCount?.count || 0;
	const likesTotal = receivedLikes?.count || 0;
	const commentsTotal = commentCount?.count || 0;
	const followersTotal = followerCount?.count || 0;

	if (postsTotal >= 1) await awardBadge(userId, "first_post");
	if (postsTotal >= 100) await awardBadge(userId, "100_posts");
	if (likesTotal >= 1000) await awardBadge(userId, "1000_likes");
	if (postsTotal >= 100 && likesTotal >= 1000) await awardBadge(userId, "top_contributor");
	if (commentsTotal >= 50) await awardBadge(userId, "helpful_user");
	if (followersTotal >= 10) await awardBadge(userId, "rising_creator");
	if (user.bio?.toLowerCase().includes("developer")) await awardBadge(userId, "verified_developer");
	if (followersTotal >= 100) await awardBadge(userId, "community_leader");

	return getUserBadges(userId);
}

export async function getUserBadges(userId: string) {
	return db
		.select({
			id: badges.id,
			code: badges.code,
			name: badges.name,
			description: badges.description,
			awardedAt: userBadges.awardedAt,
		})
		.from(userBadges)
		.innerJoin(badges, eq(userBadges.badgeId, badges.id))
		.where(eq(userBadges.userId, userId))
		.orderBy(desc(userBadges.awardedAt));
}
