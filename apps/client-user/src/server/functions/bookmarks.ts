import { createServerFn } from "@tanstack/react-start";
import {
	fromProtoTimestamp,
	getGrpcClient,
	getGrpcSessionToken,
	requireGrpcSessionToken,
} from "../../lib/grpc.server";

export const toggleBookmark = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.bookmarks.toggleBookmark({
			sessionToken,
			postId,
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to toggle bookmark");
		}

		return { success: true, bookmarked: response.bookmarked };
	});

export const getBookmarkStatus = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const sessionToken = await getGrpcSessionToken();
		if (!sessionToken) {
			return { bookmarked: false };
		}

		try {
			const client = getGrpcClient();

			const { response } = await client.bookmarks.getBookmarkStatus({
				sessionToken,
				postId,
			});

			return { bookmarked: response.bookmarked };
		} catch (error) {
			if (
				error instanceof Error &&
				(error.message.includes("ECONNREFUSED") ||
					error.message.includes("No connection established") ||
					error.message.includes("Connection dropped"))
			) {
				return { bookmarked: false };
			}

			throw error;
		}
	});

export const getBookmarkedPosts = createServerFn()
	.inputValidator((d: { limit?: number; offset?: number }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.bookmarks.getBookmarkedPosts({
			sessionToken,
			limit: data.limit || 20,
			offset: data.offset || 0,
		});

		return response.posts.map((post) => ({
			id: post.id,
			content: post.content,
			createdAt: fromProtoTimestamp(post.createdAt),
			updatedAt: fromProtoTimestamp(post.updatedAt),
			author: post.author
				? {
						id: post.author.id,
						username: post.author.username,
						displayName: post.author.displayName,
						avatarUrl: post.author.avatarUrl,
					}
				: null,
			likeCount: post.likeCount,
			commentCount: post.commentCount,
			isLiked: post.isLiked,
		}));
	});
