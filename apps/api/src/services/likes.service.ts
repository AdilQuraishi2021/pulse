import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { emitAdminAnalytics, emitLikeEvent } from "../realtime/socket";
import { createNotification } from "./notifications.service";
import { generateId } from "./utils";

const { likes, posts, comments } = schema;

export type ReactionType = "like" | "love" | "celebrate" | "support" | "funny";

export function toReactionType(value?: string): ReactionType {
	const normalized = value?.toLowerCase().replace("reaction_type_", "");
	if (
		normalized === "love" ||
		normalized === "celebrate" ||
		normalized === "support" ||
		normalized === "funny"
	) {
		return normalized;
	}
	return "like";
}

export async function togglePostLike(postId: string, userId: string) {
	// Verify post exists
	const post = await db
		.select()
		.from(posts)
		.where(eq(posts.id, postId))
		.then((rows) => rows[0]);

	if (!post) {
		throw new Error("Post not found");
	}

	// Check if already liked
	const existingLike = await db
		.select()
		.from(likes)
		.where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
		.then((rows) => rows[0]);

	if (existingLike) {
		// Unlike
		await db.delete(likes).where(eq(likes.id, existingLike.id));
		emitLikeEvent({ type: "like:update", postId, userId, liked: false });
		emitAdminAnalytics({ metric: "likes", action: "removed", postId, userId });
		return { liked: false };
	} else {
		// Like
		await db.insert(likes).values({
			id: generateId(),
			postId,
			userId,
			reactionType: "like",
		});

		// Create notification for post author
		await createNotification({
			userId: post.authorId,
			type: "like",
			actorId: userId,
			postId,
		});

		emitLikeEvent({ type: "like:update", postId, userId, liked: true, reactionType: "like" });
		emitAdminAnalytics({ metric: "likes", action: "created", postId, userId });

		return { liked: true };
	}
}

export async function toggleCommentLike(commentId: string, userId: string) {
	// Verify comment exists
	const comment = await db
		.select()
		.from(comments)
		.where(eq(comments.id, commentId))
		.then((rows) => rows[0]);

	if (!comment) {
		throw new Error("Comment not found");
	}

	// Check if already liked
	const existingLike = await db
		.select()
		.from(likes)
		.where(and(eq(likes.commentId, commentId), eq(likes.userId, userId)))
		.then((rows) => rows[0]);

	if (existingLike) {
		// Unlike
		await db.delete(likes).where(eq(likes.id, existingLike.id));
		emitLikeEvent({
			type: "like:update",
			commentId,
			postId: comment.postId,
			userId,
			liked: false,
		});
		emitAdminAnalytics({
			metric: "commentLikes",
			action: "removed",
			commentId,
			postId: comment.postId,
			userId,
		});
		return { liked: false };
	} else {
		// Like
		await db.insert(likes).values({
			id: generateId(),
			commentId,
			userId,
			reactionType: "like",
		});

		// Create notification for comment author
		await createNotification({
			userId: comment.authorId,
			type: "like",
			actorId: userId,
			commentId,
		});

		emitLikeEvent({
			type: "like:update",
			commentId,
			postId: comment.postId,
			userId,
			liked: true,
			reactionType: "like",
		});
		emitAdminAnalytics({
			metric: "commentLikes",
			action: "created",
			commentId,
			postId: comment.postId,
			userId,
		});

		return { liked: true };
	}
}

export async function getPostLikeStatus(postId: string, userId: string) {
	const like = await db
		.select()
		.from(likes)
		.where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
		.then((rows) => rows[0]);

	return { liked: !!like };
}

export async function getCommentLikeStatus(commentId: string, userId: string) {
	const like = await db
		.select()
		.from(likes)
		.where(and(eq(likes.commentId, commentId), eq(likes.userId, userId)))
		.then((rows) => rows[0]);

	return { liked: !!like };
}

export async function reactToPost(postId: string, userId: string, reactionType: ReactionType) {
	const post = await db
		.select()
		.from(posts)
		.where(eq(posts.id, postId))
		.then((rows) => rows[0]);

	if (!post) {
		throw new Error("Post not found");
	}

	const existingReaction = await db
		.select()
		.from(likes)
		.where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
		.then((rows) => rows[0]);

	if (existingReaction?.reactionType === reactionType) {
		await db.delete(likes).where(eq(likes.id, existingReaction.id));
		emitLikeEvent({ type: "reaction:update", postId, userId, reacted: false, reactionType });
		return { reacted: false, reactionType };
	}

	if (existingReaction) {
		await db.update(likes).set({ reactionType }).where(eq(likes.id, existingReaction.id));
	} else {
		await db.insert(likes).values({
			id: generateId(),
			postId,
			userId,
			reactionType,
		});

		await createNotification({
			userId: post.authorId,
			type: "like",
			actorId: userId,
			postId,
		});
	}

	emitLikeEvent({ type: "reaction:update", postId, userId, reacted: true, reactionType });
	emitAdminAnalytics({ metric: "reactions", action: "updated", postId, userId, reactionType });

	return { reacted: true, reactionType };
}

export async function reactToComment(
	commentId: string,
	userId: string,
	reactionType: ReactionType,
) {
	const comment = await db
		.select()
		.from(comments)
		.where(eq(comments.id, commentId))
		.then((rows) => rows[0]);

	if (!comment) {
		throw new Error("Comment not found");
	}

	const existingReaction = await db
		.select()
		.from(likes)
		.where(and(eq(likes.commentId, commentId), eq(likes.userId, userId)))
		.then((rows) => rows[0]);

	if (existingReaction?.reactionType === reactionType) {
		await db.delete(likes).where(eq(likes.id, existingReaction.id));
		emitLikeEvent({
			type: "reaction:update",
			commentId,
			postId: comment.postId,
			userId,
			reacted: false,
			reactionType,
		});
		return { reacted: false, reactionType };
	}

	if (existingReaction) {
		await db.update(likes).set({ reactionType }).where(eq(likes.id, existingReaction.id));
	} else {
		await db.insert(likes).values({
			id: generateId(),
			commentId,
			userId,
			reactionType,
		});

		await createNotification({
			userId: comment.authorId,
			type: "like",
			actorId: userId,
			commentId,
		});
	}

	emitLikeEvent({
		type: "reaction:update",
		commentId,
		postId: comment.postId,
		userId,
		reacted: true,
		reactionType,
	});
	emitAdminAnalytics({
		metric: "commentReactions",
		action: "updated",
		commentId,
		postId: comment.postId,
		userId,
		reactionType,
	});

	return { reacted: true, reactionType };
}

export async function getPostReactions(postId: string) {
	const rows = await db
		.select({
			reactionType: likes.reactionType,
			count: sql<number>`count(*)`,
		})
		.from(likes)
		.where(eq(likes.postId, postId))
		.groupBy(likes.reactionType);

	return rows.map((row) => ({
		reactionType: row.reactionType,
		count: row.count,
	}));
}
