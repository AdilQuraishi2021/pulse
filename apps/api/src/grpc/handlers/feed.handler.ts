import { type IFeedService, type PostResponse, FeedType as ProtoFeedType } from "@chirp/proto";
import { validateSessionToken } from "../../middleware/auth";
import {
	type FeedPost,
	type FeedType,
	getExploreFeed,
	getHomeFeed,
	getRankedFeed,
} from "../../services/feed.service";
import { toProtoTimestamp } from "../../services/utils";

function toPostResponse(post: FeedPost): PostResponse {
	return {
		id: post.id,
		content: post.content,
		createdAt: toProtoTimestamp(post.createdAt),
		updatedAt: toProtoTimestamp(post.updatedAt),
		author: post.author
			? {
					id: post.author.id || "",
					username: post.author.username || "",
					displayName: post.author.displayName || "",
					avatarUrl: post.author.avatarUrl || undefined,
				}
			: { id: "", username: "", displayName: "" },
		likeCount: post.likeCount || 0,
		commentCount: post.commentCount || 0,
		isLiked: post.isLiked || false,
	};
}

function mapFeedType(type: ProtoFeedType): FeedType {
	switch (type) {
		case ProtoFeedType.TRENDING:
			return "trending";
		case ProtoFeedType.FRIENDS:
			return "friends";
		case ProtoFeedType.RECOMMENDED:
			return "recommended";
		case ProtoFeedType.INDUSTRY:
			return "industry";
		case ProtoFeedType.TOPIC:
			return "topic";
		case ProtoFeedType.COMMUNITY:
			return "community";
		case ProtoFeedType.NEARBY:
			return "nearby";
		default:
			return "latest";
	}
}

export const feedHandler: IFeedService = {
	async getHomeFeed(request) {
		const auth = validateSessionToken(request.sessionToken);
		const posts = await getHomeFeed(auth.userId, {
			limit: request.pagination?.limit || 20,
			offset: request.pagination?.offset || 0,
		});

		return {
			posts: posts.map(toPostResponse),
		};
	},

	async getExploreFeed(request) {
		let userId: string | undefined;
		if (request.sessionToken) {
			try {
				const auth = validateSessionToken(request.sessionToken);
				userId = auth.userId;
			} catch {
				// Ignore invalid token for public access
			}
		}

		const posts = await getExploreFeed({
			limit: request.pagination?.limit || 20,
			offset: request.pagination?.offset || 0,
			userId,
		});

		return {
			posts: posts.map(toPostResponse),
		};
	},

	async getRankedFeed(request) {
		let userId: string | undefined;
		if (request.sessionToken) {
			try {
				const auth = validateSessionToken(request.sessionToken);
				userId = auth.userId;
			} catch {
				// Ranked public feeds can still be viewed without a valid session.
			}
		}

		const posts = await getRankedFeed({
			limit: request.pagination?.limit || 20,
			offset: request.pagination?.offset || 0,
			userId,
			type: mapFeedType(request.type),
			filter: request.filter,
		});

		return {
			posts: posts.map(toPostResponse),
		};
	},
};
