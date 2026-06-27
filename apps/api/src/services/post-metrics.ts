import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "../db";

const { comments, likes } = schema;

export interface PostMetrics {
	likeCount: number;
	commentCount: number;
	isLiked: boolean;
}

const emptyMetrics = (): PostMetrics => ({
	likeCount: 0,
	commentCount: 0,
	isLiked: false,
});

export async function getPostMetrics(
	postIds: string[],
	userId?: string,
): Promise<Map<string, PostMetrics>> {
	const uniquePostIds = [...new Set(postIds)];
	const metricsByPostId = new Map(uniquePostIds.map((postId) => [postId, emptyMetrics()]));

	if (uniquePostIds.length === 0) {
		return metricsByPostId;
	}

	const likeCounts = await db
		.select({
			postId: likes.postId,
			count: sql<number>`count(*)`,
		})
		.from(likes)
		.where(inArray(likes.postId, uniquePostIds))
		.groupBy(likes.postId);

	for (const row of likeCounts) {
		if (row.postId) {
			metricsByPostId.get(row.postId)!.likeCount = row.count;
		}
	}

	const commentCounts = await db
		.select({
			postId: comments.postId,
			count: sql<number>`count(*)`,
		})
		.from(comments)
		.where(inArray(comments.postId, uniquePostIds))
		.groupBy(comments.postId);

	for (const row of commentCounts) {
		metricsByPostId.get(row.postId)!.commentCount = row.count;
	}

	if (userId) {
		const likedPosts = await db
			.select({ postId: likes.postId })
			.from(likes)
			.where(and(inArray(likes.postId, uniquePostIds), eq(likes.userId, userId)));

		for (const row of likedPosts) {
			if (row.postId) {
				metricsByPostId.get(row.postId)!.isLiked = true;
			}
		}
	}

	return metricsByPostId;
}

export function metricsForPost(metricsByPostId: Map<string, PostMetrics>, postId: string): PostMetrics {
	return metricsByPostId.get(postId) ?? emptyMetrics();
}
