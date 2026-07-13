import type { ISocialService } from "@chirp/proto";
import { validateSessionToken } from "../../middleware/auth";
import {
	createRepost,
	getConversations,
	getMessages,
	getOrCreateConversation,
	getPostShareCount,
	getUserBadges,
	markConversationRead,
	recalculateBadges,
	sendMessage,
	sharePost,
} from "../../services/social.service";
import { toProtoTimestamp } from "../../services/utils";

function toAuthor(author: {
	id: string;
	username: string;
	displayName: string;
	avatarUrl?: string | null;
}) {
	return {
		id: author.id,
		username: author.username,
		displayName: author.displayName,
		avatarUrl: author.avatarUrl || undefined,
	};
}

function toConversationResponse(conversation: Awaited<ReturnType<typeof getOrCreateConversation>>) {
	return {
		id: conversation.id,
		participants: conversation.participants.map(toAuthor),
		unreadCount: conversation.unreadCount,
		lastMessage: conversation.lastMessage || undefined,
		updatedAt: toProtoTimestamp(conversation.updatedAt),
	};
}

function toMessageResponse(message: Awaited<ReturnType<typeof sendMessage>>) {
	return {
		id: message.id,
		conversationId: message.conversationId,
		sender: toAuthor(message.sender),
		content: message.content,
		read: Boolean(message.readAt),
		createdAt: toProtoTimestamp(message.createdAt),
	};
}

function toBadgeResponse(badge: Awaited<ReturnType<typeof getUserBadges>>[number]) {
	return {
		id: badge.id,
		code: badge.code,
		name: badge.name,
		description: badge.description,
		awardedAt: toProtoTimestamp(badge.awardedAt),
	};
}

export const socialHandler: ISocialService = {
	async sharePost(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await sharePost(request.postId, auth.userId, request.destination);
			return { success: true, shareId: result.shareId, shareCount: result.shareCount };
		} catch (error) {
			return {
				success: false,
				shareId: "",
				shareCount: 0,
				error: error instanceof Error ? error.message : "Failed to share post",
			};
		}
	},

	async repost(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await createRepost(request.postId, auth.userId, request.quote);
			return { success: true, repostId: result.repostId, shareCount: result.shareCount };
		} catch (error) {
			return {
				success: false,
				repostId: "",
				shareCount: 0,
				error: error instanceof Error ? error.message : "Failed to repost",
			};
		}
	},

	async getShareCount(request) {
		const result = await getPostShareCount(request.postId);
		return { count: result.count };
	},

	async getOrCreateConversation(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const conversation = await getOrCreateConversation(auth.userId, request.recipientId);
			return { success: true, conversation: toConversationResponse(conversation) };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to create conversation",
			};
		}
	},

	async getConversations(request) {
		const auth = validateSessionToken(request.sessionToken);
		const conversations = await getConversations(
			auth.userId,
			request.limit || 20,
			request.offset || 0,
		);
		return { conversations: conversations.map(toConversationResponse) };
	},

	async sendMessage(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const message = await sendMessage(request.conversationId, auth.userId, request.content);
			return { success: true, message: toMessageResponse(message) };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to send message",
			};
		}
	},

	async getMessages(request) {
		const auth = validateSessionToken(request.sessionToken);
		const messages = await getMessages(
			request.conversationId,
			auth.userId,
			request.limit || 50,
			request.offset || 0,
		);
		return { messages: messages.map(toMessageResponse) };
	},

	async markConversationRead(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			await markConversationRead(request.conversationId, auth.userId);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to mark conversation read",
			};
		}
	},

	async getUserBadges(request) {
		const badges = await getUserBadges(request.userId);
		return { badges: badges.map(toBadgeResponse) };
	},

	async recalculateBadges(request) {
		const auth = validateSessionToken(request.sessionToken);
		const badges = await recalculateBadges(auth.userId);
		return { badges: badges.map(toBadgeResponse) };
	},
};
