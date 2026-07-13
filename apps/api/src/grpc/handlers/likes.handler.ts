import type { ILikesService } from "@chirp/proto";
import { validateSessionToken } from "../../middleware/auth";
import {
	getCommentLikeStatus,
	getPostLikeStatus,
	getPostReactions,
	reactToComment,
	reactToPost,
	toggleCommentLike,
	togglePostLike,
	toReactionType,
} from "../../services/likes.service";

const protoReactionTypeByName = {
	like: 0,
	love: 1,
	celebrate: 2,
	support: 3,
	funny: 4,
} as const;

function reactionNameFromProto(value: unknown) {
	const names = ["like", "love", "celebrate", "support", "funny"] as const;
	return names[Number(value)] ?? "like";
}

export const likesHandler: ILikesService = {
	async togglePostLike(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await togglePostLike(request.postId, auth.userId);

			return {
				success: true,
				liked: result.liked,
			};
		} catch (error) {
			return {
				success: false,
				liked: false,
				error: error instanceof Error ? error.message : "Failed to toggle like",
			};
		}
	},

	async toggleCommentLike(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await toggleCommentLike(request.commentId, auth.userId);

			return {
				success: true,
				liked: result.liked,
			};
		} catch (error) {
			return {
				success: false,
				liked: false,
				error: error instanceof Error ? error.message : "Failed to toggle like",
			};
		}
	},

	async getPostLikeStatus(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await getPostLikeStatus(request.postId, auth.userId);

			return { liked: result.liked };
		} catch {
			return { liked: false };
		}
	},

	async getCommentLikeStatus(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await getCommentLikeStatus(request.commentId, auth.userId);

			return { liked: result.liked };
		} catch {
			return { liked: false };
		}
	},

	async reactToPost(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await reactToPost(
				request.postId,
				auth.userId,
				toReactionType(reactionNameFromProto(request.reactionType)),
			);

			return {
				success: true,
				reacted: result.reacted,
				reactionType: protoReactionTypeByName[result.reactionType],
			};
		} catch (error) {
			return {
				success: false,
				reacted: false,
				reactionType: 0,
				error: error instanceof Error ? error.message : "Failed to react",
			};
		}
	},

	async reactToComment(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await reactToComment(
				request.commentId,
				auth.userId,
				toReactionType(reactionNameFromProto(request.reactionType)),
			);

			return {
				success: true,
				reacted: result.reacted,
				reactionType: protoReactionTypeByName[result.reactionType],
			};
		} catch (error) {
			return {
				success: false,
				reacted: false,
				reactionType: 0,
				error: error instanceof Error ? error.message : "Failed to react",
			};
		}
	},

	async getPostReactions(request) {
		const counts = await getPostReactions(request.postId);

		return {
			counts: counts.map((count) => ({
				reactionType: protoReactionTypeByName[count.reactionType],
				count: count.count,
			})),
		};
	},
};
