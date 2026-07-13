import { and, eq, or, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { emitAdminAnalytics, emitFollowEvent } from "../realtime/socket";
import { createNotification } from "./notifications.service";
import { generateId } from "./utils";

const { follows, friendRequests, users } = schema;

export async function toggleFollow(username: string, followerId: string) {
	// Find user to follow
	const userToFollow = await db
		.select()
		.from(users)
		.where(eq(users.username, username))
		.then((rows) => rows[0]);

	if (!userToFollow) {
		throw new Error("User not found");
	}

	// Cannot follow yourself
	if (userToFollow.id === followerId) {
		throw new Error("You cannot follow yourself");
	}

	// Check if already following
	const existingFollow = await db
		.select()
		.from(follows)
		.where(and(eq(follows.followerId, followerId), eq(follows.followingId, userToFollow.id)))
		.then((rows) => rows[0]);

	if (existingFollow) {
		// Unfollow
		await db.delete(follows).where(eq(follows.id, existingFollow.id));
		emitFollowEvent({
			type: "follow:update",
			userId: userToFollow.id,
			followerId,
			following: false,
		});
		emitAdminAnalytics({
			metric: "follows",
			action: "removed",
			userId: userToFollow.id,
			followerId,
		});
		return { following: false };
	} else {
		// Follow
		await db.insert(follows).values({
			id: generateId(),
			followerId,
			followingId: userToFollow.id,
		});

		// Create notification for followed user
		await createNotification({
			userId: userToFollow.id,
			type: "follow",
			actorId: followerId,
		});

		emitFollowEvent({
			type: "follow:update",
			userId: userToFollow.id,
			followerId,
			following: true,
		});
		emitAdminAnalytics({
			metric: "follows",
			action: "created",
			userId: userToFollow.id,
			followerId,
		});

		return { following: true };
	}
}

export async function getFollowStatus(username: string, followerId: string) {
	const userToCheck = await db
		.select()
		.from(users)
		.where(eq(users.username, username))
		.then((rows) => rows[0]);

	if (!userToCheck) {
		throw new Error("User not found");
	}

	const follow = await db
		.select()
		.from(follows)
		.where(and(eq(follows.followerId, followerId), eq(follows.followingId, userToCheck.id)))
		.then((rows) => rows[0]);

	return { following: !!follow };
}

export async function getFollowerCount(username: string) {
	const user = await db
		.select()
		.from(users)
		.where(eq(users.username, username))
		.then((rows) => rows[0]);

	if (!user) {
		throw new Error("User not found");
	}

	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(follows)
		.where(eq(follows.followingId, user.id))
		.then((rows) => rows[0]);

	return { count: result?.count || 0 };
}

export async function getFollowingCount(username: string) {
	const user = await db
		.select()
		.from(users)
		.where(eq(users.username, username))
		.then((rows) => rows[0]);

	if (!user) {
		throw new Error("User not found");
	}

	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(follows)
		.where(eq(follows.followerId, user.id))
		.then((rows) => rows[0]);

	return { count: result?.count || 0 };
}

async function findUserByUsername(username: string) {
	const user = await db
		.select()
		.from(users)
		.where(eq(users.username, username))
		.then((rows) => rows[0]);

	if (!user) {
		throw new Error("User not found");
	}

	return user;
}

export async function sendFriendRequest(username: string, requesterId: string) {
	const recipient = await findUserByUsername(username);

	if (recipient.id === requesterId) {
		throw new Error("You cannot send a friend request to yourself");
	}

	const existingRequest = await db
		.select()
		.from(friendRequests)
		.where(
			or(
				and(
					eq(friendRequests.requesterId, requesterId),
					eq(friendRequests.recipientId, recipient.id),
				),
				and(
					eq(friendRequests.requesterId, recipient.id),
					eq(friendRequests.recipientId, requesterId),
				),
			),
		)
		.then((rows) => rows[0]);

	if (existingRequest) {
		return { requestId: existingRequest.id, status: existingRequest.status };
	}

	const requestId = generateId();
	await db.insert(friendRequests).values({
		id: requestId,
		requesterId,
		recipientId: recipient.id,
		status: "pending",
	});

	await createNotification({
		userId: recipient.id,
		type: "friend_request",
		actorId: requesterId,
	});

	emitFollowEvent({
		type: "friend_request:created",
		requestId,
		userId: recipient.id,
		requesterId,
	});

	return { requestId, status: "pending" };
}

async function ensureFollow(followerId: string, followingId: string) {
	const existingFollow = await db
		.select()
		.from(follows)
		.where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
		.then((rows) => rows[0]);

	if (!existingFollow) {
		await db.insert(follows).values({
			id: generateId(),
			followerId,
			followingId,
		});
	}
}

export async function respondToFriendRequest(
	requestId: string,
	recipientId: string,
	status: "accepted" | "rejected",
) {
	const request = await db
		.select()
		.from(friendRequests)
		.where(eq(friendRequests.id, requestId))
		.then((rows) => rows[0]);

	if (!request) {
		throw new Error("Friend request not found");
	}

	if (request.recipientId !== recipientId) {
		throw new Error("Unauthorized");
	}

	await db.update(friendRequests).set({ status }).where(eq(friendRequests.id, requestId));

	if (status === "accepted") {
		await ensureFollow(request.requesterId, request.recipientId);
		await ensureFollow(request.recipientId, request.requesterId);
		await createNotification({
			userId: request.requesterId,
			type: "friend_request",
			actorId: recipientId,
		});
	}

	emitFollowEvent({
		type: `friend_request:${status}`,
		requestId,
		userId: recipientId,
		requesterId: request.requesterId,
	});

	return { requestId, status };
}

function mapSocialUser(user: typeof users.$inferSelect) {
	return {
		id: user.id,
		username: user.username,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl,
		isOnline: user.isOnline,
		lastSeen: user.lastSeen,
	};
}

export async function getFollowers(username: string, limit = 50, offset = 0) {
	const user = await findUserByUsername(username);
	const rows = await db
		.select({
			id: users.id,
			email: users.email,
			username: users.username,
			displayName: users.displayName,
			avatarUrl: users.avatarUrl,
			bio: users.bio,
			passwordHash: users.passwordHash,
			role: users.role,
			bannedAt: users.bannedAt,
			bannedReason: users.bannedReason,
			bannedBy: users.bannedBy,
			isOnline: users.isOnline,
			lastSeen: users.lastSeen,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(follows)
		.innerJoin(users, eq(follows.followerId, users.id))
		.where(eq(follows.followingId, user.id))
		.limit(limit)
		.offset(offset);

	return rows.map(mapSocialUser);
}

export async function getFollowing(username: string, limit = 50, offset = 0) {
	const user = await findUserByUsername(username);
	const rows = await db
		.select({
			id: users.id,
			email: users.email,
			username: users.username,
			displayName: users.displayName,
			avatarUrl: users.avatarUrl,
			bio: users.bio,
			passwordHash: users.passwordHash,
			role: users.role,
			bannedAt: users.bannedAt,
			bannedReason: users.bannedReason,
			bannedBy: users.bannedBy,
			isOnline: users.isOnline,
			lastSeen: users.lastSeen,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(follows)
		.innerJoin(users, eq(follows.followingId, users.id))
		.where(eq(follows.followerId, user.id))
		.limit(limit)
		.offset(offset);

	return rows.map(mapSocialUser);
}

export async function getFriends(username: string, limit = 50, offset = 0) {
	const user = await findUserByUsername(username);
	const rows = await db
		.select({
			id: users.id,
			email: users.email,
			username: users.username,
			displayName: users.displayName,
			avatarUrl: users.avatarUrl,
			bio: users.bio,
			passwordHash: users.passwordHash,
			role: users.role,
			bannedAt: users.bannedAt,
			bannedReason: users.bannedReason,
			bannedBy: users.bannedBy,
			isOnline: users.isOnline,
			lastSeen: users.lastSeen,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(friendRequests)
		.innerJoin(
			users,
			or(
				and(eq(friendRequests.requesterId, user.id), eq(users.id, friendRequests.recipientId)),
				and(eq(friendRequests.recipientId, user.id), eq(users.id, friendRequests.requesterId)),
			),
		)
		.where(eq(friendRequests.status, "accepted"))
		.limit(limit)
		.offset(offset);

	return rows.map(mapSocialUser);
}
