import { desc, eq, inArray, like, or } from "drizzle-orm";
import { db, schema } from "../db";
import { getRecommendationScore, getTrendingScore, tokenizeFeedText } from "./feed-ranking";
import { getPostMetrics, metricsForPost, type PostMetrics } from "./post-metrics";

const { posts, users, follows, likes } = schema;

export type FeedType =
	| "latest"
	| "trending"
	| "friends"
	| "recommended"
	| "industry"
	| "topic"
	| "community"
	| "nearby";

interface FeedOptions {
	limit?: number;
	offset?: number;
	userId?: string;
	type?: FeedType;
	filter?: string;
}

export type FeedPost = {
	id: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	author: {
		id: string | null;
		username: string | null;
		displayName: string | null;
		avatarUrl: string | null;
	} | null;
} & PostMetrics;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const CANDIDATE_LIMIT = 200;

function clampLimit(limit?: number) {
	if (!limit || limit < 1) {
		return DEFAULT_LIMIT;
	}
	return Math.min(limit, MAX_LIMIT);
}

function normalizeFilter(filter?: string) {
	const trimmed = filter?.trim();
	return trimmed ? trimmed.slice(0, 80) : undefined;
}

async function getFollowingIds(userId: string) {
	const following = await db
		.select({ followingId: follows.followingId })
		.from(follows)
		.where(eq(follows.followerId, userId));

	return following.map((follow) => follow.followingId);
}

async function getInterestTerms(userId?: string) {
	if (!userId) {
		return new Set<string>();
	}

	const likedPosts = await db
		.select({ content: posts.content })
		.from(likes)
		.innerJoin(posts, eq(likes.postId, posts.id))
		.where(eq(likes.userId, userId))
		.orderBy(desc(likes.createdAt))
		.limit(20);

	return new Set(likedPosts.flatMap((post) => tokenizeFeedText(post.content)).slice(0, 40));
}

async function withMetrics(result: Omit<FeedPost, keyof PostMetrics>[], userId?: string) {
	const metricsByPostId = await getPostMetrics(
		result.map((post) => post.id),
		userId,
	);

	return result.map((post) => ({
		...post,
		...metricsForPost(metricsByPostId, post.id),
	}));
}

async function selectCandidatePosts(options: FeedOptions) {
	const type = options.type || "latest";
	const filter = normalizeFilter(options.filter);
	const candidateLimit = Math.max(
		(options.limit || DEFAULT_LIMIT) + (options.offset || 0),
		CANDIDATE_LIMIT,
	);

	const baseQuery = db
		.select({
			id: posts.id,
			content: posts.content,
			createdAt: posts.createdAt,
			updatedAt: posts.updatedAt,
			author: {
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				avatarUrl: users.avatarUrl,
			},
		})
		.from(posts)
		.leftJoin(users, eq(posts.authorId, users.id));

	if (type === "friends" && options.userId) {
		const followingIds = await getFollowingIds(options.userId);
		const authorIds = [...followingIds, options.userId];

		return baseQuery
			.where(inArray(posts.authorId, authorIds))
			.orderBy(desc(posts.createdAt))
			.limit(candidateLimit);
	}

	if ((type === "topic" || type === "community") && filter) {
		const pattern = `%${filter}%`;
		return baseQuery
			.where(like(posts.content, pattern))
			.orderBy(desc(posts.createdAt))
			.limit(candidateLimit);
	}

	if (type === "industry" && filter) {
		const pattern = `%${filter}%`;
		return baseQuery
			.where(
				or(
					like(posts.content, pattern),
					like(users.bio, pattern),
					like(users.displayName, pattern),
				),
			)
			.orderBy(desc(posts.createdAt))
			.limit(candidateLimit);
	}

	return baseQuery.orderBy(desc(posts.createdAt)).limit(candidateLimit);
}

export async function getRankedFeed(options: FeedOptions = {}) {
	const limit = clampLimit(options.limit);
	const offset = options.offset || 0;
	const type = options.type || "latest";

	const result = await selectCandidatePosts({ ...options, limit });
	const postsWithCounts = await withMetrics(result, options.userId);

	const rankedPosts = [...postsWithCounts];
	if (type === "trending") {
		rankedPosts.sort((a, b) => getTrendingScore(b) - getTrendingScore(a));
	}

	if (type === "recommended") {
		const interestTerms = await getInterestTerms(options.userId);
		rankedPosts.sort(
			(a, b) => getRecommendationScore(b, interestTerms) - getRecommendationScore(a, interestTerms),
		);
	}

	if (type === "nearby") {
		rankedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}

	return rankedPosts.slice(offset, offset + limit);
}

export async function getHomeFeed(userId: string, options: FeedOptions = {}) {
	return getRankedFeed({
		...options,
		type: options.type || "friends",
		userId,
	});
}

export async function getExploreFeed(options: FeedOptions = {}) {
	return getRankedFeed({
		...options,
		type: options.type || "latest",
	});
}
