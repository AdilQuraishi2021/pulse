import { type PostResponse, FeedType as ProtoFeedType } from "@chirp/proto";
import { createServerFn } from "@tanstack/react-start";
import {
	fromProtoTimestamp,
	getGrpcClient,
	getGrpcSessionToken,
	requireGrpcSessionToken,
} from "../../lib/grpc.server";

function mapPostResponse(post: PostResponse) {
	return {
		id: post.id,
		content: post.content,
		createdAt: fromProtoTimestamp(post.createdAt),
		updatedAt: fromProtoTimestamp(post.updatedAt),
		author: {
			id: post.author?.id || "",
			username: post.author?.username || "",
			displayName: post.author?.displayName || "",
			avatarUrl: post.author?.avatarUrl,
		},
		likeCount: post.likeCount,
		commentCount: post.commentCount,
		isLiked: post.isLiked,
	};
}

export type FeedMode =
	| "latest"
	| "trending"
	| "friends"
	| "recommended"
	| "industry"
	| "topic"
	| "community"
	| "nearby";

const protoFeedTypes: Record<FeedMode, ProtoFeedType> = {
	latest: ProtoFeedType.LATEST,
	trending: ProtoFeedType.TRENDING,
	friends: ProtoFeedType.FRIENDS,
	recommended: ProtoFeedType.RECOMMENDED,
	industry: ProtoFeedType.INDUSTRY,
	topic: ProtoFeedType.TOPIC,
	community: ProtoFeedType.COMMUNITY,
	nearby: ProtoFeedType.NEARBY,
};

function isApiUnavailableError(error: unknown) {
	return (
		error instanceof Error &&
		(error.message.includes("ECONNREFUSED") ||
			error.message.includes("No connection established") ||
			error.message.includes("Connection dropped"))
	);
}

export const getHomeFeed = createServerFn()
	.inputValidator((d?: { limit?: number; offset?: number }) => d)
	.handler(async ({ data: options }) => {
		const sessionToken = await requireGrpcSessionToken();
		try {
			const client = getGrpcClient();

			const { response } = await client.feed.getHomeFeed({
				sessionToken,
				pagination: {
					limit: options?.limit || 20,
					offset: options?.offset || 0,
				},
			});

			return response.posts.map(mapPostResponse);
		} catch (error) {
			if (isApiUnavailableError(error)) {
				return [];
			}

			throw error;
		}
	});

export const getRankedFeed = createServerFn()
	.inputValidator((d?: { limit?: number; offset?: number; type?: FeedMode; filter?: string }) => d)
	.handler(async ({ data: options }) => {
		const sessionToken = await getGrpcSessionToken();
		try {
			const client = getGrpcClient();

			const { response } = await client.feed.getRankedFeed({
				sessionToken: sessionToken || "",
				pagination: {
					limit: options?.limit || 20,
					offset: options?.offset || 0,
				},
				type: protoFeedTypes[options?.type || "latest"],
				filter: options?.filter?.trim() || undefined,
			});

			return response.posts.map(mapPostResponse);
		} catch (error) {
			if (isApiUnavailableError(error)) {
				return [];
			}

			throw error;
		}
	});

export const getExploreFeed = createServerFn()
	.inputValidator((d?: { limit?: number; offset?: number }) => d)
	.handler(async ({ data: options }) => {
		const sessionToken = await getGrpcSessionToken();
		try {
			const client = getGrpcClient();

			const { response } = await client.feed.getExploreFeed({
				sessionToken: sessionToken || "",
				pagination: {
					limit: options?.limit || 20,
					offset: options?.offset || 0,
				},
			});

			return response.posts.map(mapPostResponse);
		} catch (error) {
			if (isApiUnavailableError(error)) {
				return [];
			}

			throw error;
		}
	});
