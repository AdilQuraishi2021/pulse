import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { emitNotification } from "../realtime/socket";
import { getFirebaseMessaging } from "./firebase-admin";
import { generateId } from "./utils";

const { notifications, notificationPushTokens, users, posts, comments } = schema;

export type NotificationType =
	| "like"
	| "comment"
	| "follow"
	| "friend_request"
	| "mention"
	| "post_shared"
	| "community_invite"
	| "admin_warning";

export interface CreateNotificationInput {
	userId: string; // recipient
	type: NotificationType;
	actorId: string; // who triggered the notification
	postId?: string;
	commentId?: string;
}

const notificationCopy: Record<NotificationType, string> = {
	like: "liked your post",
	comment: "commented on your post",
	follow: "started following you",
	friend_request: "sent you a friend request",
	mention: "mentioned you",
	post_shared: "shared your post",
	community_invite: "invited you to a community",
	admin_warning: "sent you an account warning",
};

/**
 * Create a notification (internal helper, used by other services)
 * Returns null if user is notifying themselves (no self-notifications)
 */
export async function createNotification(input: CreateNotificationInput) {
	// Don't notify users about their own actions
	if (input.userId === input.actorId) {
		return null;
	}

	const notificationId = generateId();
	await db.insert(notifications).values({
		id: notificationId,
		userId: input.userId,
		type: input.type,
		actorId: input.actorId,
		postId: input.postId || null,
		commentId: input.commentId || null,
	});

	emitNotification(input.userId, {
		notificationId,
		notificationType: input.type,
		actorId: input.actorId,
		postId: input.postId,
		commentId: input.commentId,
	});

	void sendPushNotification({
		...input,
		notificationId,
	}).catch((error) => {
		console.error("Failed to send push notification:", error);
	});

	return { notificationId };
}

export async function registerPushToken(userId: string, pushToken: string) {
	const token = pushToken.trim();
	if (!token) {
		throw new Error("Push token is required");
	}

	await db
		.insert(notificationPushTokens)
		.values({
			id: generateId(),
			userId,
			token,
			platform: "web",
		})
		.onDuplicateKeyUpdate({
			set: {
				updatedAt: new Date(),
			},
		});

	return { success: true };
}

export async function unregisterPushToken(userId: string, pushToken: string) {
	const token = pushToken.trim();
	if (!token) {
		return { success: true };
	}

	await db
		.delete(notificationPushTokens)
		.where(and(eq(notificationPushTokens.userId, userId), eq(notificationPushTokens.token, token)));

	return { success: true };
}

async function sendPushNotification(input: CreateNotificationInput & { notificationId: string }) {
	const messaging = getFirebaseMessaging();
	if (!messaging) {
		return;
	}

	const actor = await db
		.select({ displayName: users.displayName, username: users.username })
		.from(users)
		.where(eq(users.id, input.actorId))
		.then((rows) => rows[0]);
	const tokens = await db
		.select({ token: notificationPushTokens.token })
		.from(notificationPushTokens)
		.where(eq(notificationPushTokens.userId, input.userId));

	if (tokens.length === 0) {
		return;
	}

	const title = actor?.displayName || actor?.username || "Pulse";
	const body = notificationCopy[input.type] || "sent you a notification";
	const response = await messaging.sendEachForMulticast({
		tokens: tokens.map((row) => row.token),
		notification: {
			title,
			body,
		},
		webpush: {
			fcmOptions: {
				link: "/notifications",
			},
		},
		data: {
			notificationId: input.notificationId,
			type: input.type,
			postId: input.postId || "",
			commentId: input.commentId || "",
		},
	});

	const invalidTokens = response.responses
		.map((result, index) => ({ result, token: tokens[index]?.token }))
		.filter(({ result, token }) => {
			const code = result.error?.code;
			return (
				token &&
				(code === "messaging/registration-token-not-registered" ||
					code === "messaging/invalid-registration-token")
			);
		})
		.map(({ token }) => token as string);

	await Promise.all(
		invalidTokens.map((token) =>
			db.delete(notificationPushTokens).where(eq(notificationPushTokens.token, token)),
		),
	);
}

/**
 * Get notifications for a user with pagination
 */
export async function getUserNotifications(userId: string, limit = 20, offset = 0) {
	const results = await db
		.select({
			id: notifications.id,
			type: notifications.type,
			read: notifications.read,
			createdAt: notifications.createdAt,
			postId: notifications.postId,
			commentId: notifications.commentId,
			actor: {
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				avatarUrl: users.avatarUrl,
			},
		})
		.from(notifications)
		.leftJoin(users, eq(notifications.actorId, users.id))
		.where(eq(notifications.userId, userId))
		.orderBy(desc(notifications.createdAt))
		.limit(limit)
		.offset(offset);

	// Enrich with post/comment content preview if applicable
	const enrichedResults = await Promise.all(
		results.map(async (notification) => {
			let postContent: string | null = null;
			let commentContent: string | null = null;

			if (notification.postId) {
				const post = await db
					.select({ content: posts.content })
					.from(posts)
					.where(eq(posts.id, notification.postId))
					.then((rows) => rows[0]);
				postContent = post?.content?.substring(0, 100) || null;
			}

			if (notification.commentId) {
				const comment = await db
					.select({ content: comments.content })
					.from(comments)
					.where(eq(comments.id, notification.commentId))
					.then((rows) => rows[0]);
				commentContent = comment?.content?.substring(0, 100) || null;
			}

			return {
				...notification,
				postContent,
				commentContent,
			};
		}),
	);

	return enrichedResults;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string) {
	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(notifications)
		.where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
		.then((rows) => rows[0]);

	return { count: result?.count || 0 };
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
	const notification = await db
		.select()
		.from(notifications)
		.where(eq(notifications.id, notificationId))
		.then((rows) => rows[0]);

	if (!notification) {
		throw new Error("Notification not found");
	}

	if (notification.userId !== userId) {
		throw new Error("Unauthorized");
	}

	await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));

	return { success: true };
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
	await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));

	return { success: true };
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
	const notification = await db
		.select()
		.from(notifications)
		.where(eq(notifications.id, notificationId))
		.then((rows) => rows[0]);

	if (!notification) {
		throw new Error("Notification not found");
	}

	if (notification.userId !== userId) {
		throw new Error("Unauthorized");
	}

	await db.delete(notifications).where(eq(notifications.id, notificationId));

	return { success: true };
}
