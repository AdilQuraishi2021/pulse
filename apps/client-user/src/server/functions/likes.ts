import { createServerFn } from "@tanstack/react-start";
import { getGrpcClient, requireGrpcSessionToken } from "../../lib/grpc.server";

export type ReactionName = "like" | "love" | "celebrate" | "support" | "funny";

const reactionTypeByName: Record<ReactionName, number> = {
	like: 0,
	love: 1,
	celebrate: 2,
	support: 3,
	funny: 4,
};

const reactionNameByType: Record<number, ReactionName> = {
	0: "like",
	1: "love",
	2: "celebrate",
	3: "support",
	4: "funny",
};

export const togglePostLike = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.likes.togglePostLike({
			sessionToken,
			postId,
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to toggle like");
		}

		return { success: true, liked: response.liked };
	});

export const toggleCommentLike = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: commentId }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.likes.toggleCommentLike({
			sessionToken,
			commentId,
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to toggle like");
		}

		return { success: true, liked: response.liked };
	});

export const getPostLikeStatus = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.likes.getPostLikeStatus({
			sessionToken,
			postId,
		});

		return { liked: response.liked };
	});

export const getCommentLikeStatus = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: commentId }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.likes.getCommentLikeStatus({
			sessionToken,
			commentId,
		});

		return { liked: response.liked };
	});

export const reactToPost = createServerFn({ method: "POST" })
	.inputValidator((d: { postId: string; reaction: ReactionName }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.likes.reactToPost({
			sessionToken,
			postId: data.postId,
			reactionType: reactionTypeByName[data.reaction],
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to react");
		}

		return {
			success: true,
			reacted: response.reacted,
			reaction: reactionNameByType[response.reactionType] || "like",
		};
	});

export const getPostReactions = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const client = getGrpcClient();
		const { response } = await client.likes.getPostReactions({ postId });

		return response.counts.map((count) => ({
			reaction: reactionNameByType[count.reactionType] || "like",
			count: count.count,
		}));
	});
