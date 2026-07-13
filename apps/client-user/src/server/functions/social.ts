import { createServerFn } from "@tanstack/react-start";
import {
	fromProtoTimestamp,
	getGrpcClient,
	getGrpcSessionToken,
	requireGrpcSessionToken,
} from "../../lib/grpc.server";

function toAuthor(author: {
	id: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
}) {
	return {
		id: author.id,
		username: author.username,
		displayName: author.displayName,
		avatarUrl: author.avatarUrl,
	};
}

function isApiUnavailableError(error: unknown) {
	return (
		error instanceof Error &&
		(error.message.includes("ECONNREFUSED") ||
			error.message.includes("No connection established") ||
			error.message.includes("Connection dropped"))
	);
}

export const getUserBadges = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: userId }) => {
		const client = getGrpcClient();
		const { response } = await client.social.getUserBadges({ userId });

		return response.badges.map((badge) => ({
			id: badge.id,
			code: badge.code,
			name: badge.name,
			description: badge.description,
			awardedAt: fromProtoTimestamp(badge.awardedAt),
		}));
	});

export const recalculateMyBadges = createServerFn({ method: "POST" }).handler(async () => {
	const sessionToken = await requireGrpcSessionToken();
	const client = getGrpcClient();
	const { response } = await client.social.recalculateBadges({ sessionToken });

	return response.badges.map((badge) => ({
		id: badge.id,
		code: badge.code,
		name: badge.name,
		description: badge.description,
		awardedAt: fromProtoTimestamp(badge.awardedAt),
	}));
});

export const sharePost = createServerFn({ method: "POST" })
	.inputValidator((d: { postId: string; destination?: string }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.social.sharePost({
			sessionToken,
			postId: data.postId,
			destination: data.destination || "external",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to share post");
		}

		return { shareId: response.shareId, shareCount: response.shareCount };
	});

export const repost = createServerFn({ method: "POST" })
	.inputValidator((d: { postId: string; quote?: string }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.social.repost({
			sessionToken,
			postId: data.postId,
			quote: data.quote,
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to repost");
		}

		return { repostId: response.repostId, shareCount: response.shareCount };
	});

export const getShareCount = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const client = getGrpcClient();
		const { response } = await client.social.getShareCount({ postId });
		return response.count;
	});

export const getOrCreateConversation = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: recipientId }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.social.getOrCreateConversation({
			sessionToken,
			recipientId,
		});

		if (!response.success || !response.conversation) {
			throw new Error(response.error || "Failed to open conversation");
		}

		return {
			id: response.conversation.id,
			participants: response.conversation.participants.map(toAuthor),
			unreadCount: response.conversation.unreadCount,
			lastMessage: response.conversation.lastMessage,
			updatedAt: fromProtoTimestamp(response.conversation.updatedAt),
		};
	});

export const getConversations = createServerFn()
	.inputValidator((d: { limit?: number; offset?: number } | undefined) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.social.getConversations({
			sessionToken,
			limit: data?.limit || 20,
			offset: data?.offset || 0,
		});

		return response.conversations.map((conversation) => ({
			id: conversation.id,
			participants: conversation.participants.map(toAuthor),
			unreadCount: conversation.unreadCount,
			lastMessage: conversation.lastMessage,
			updatedAt: fromProtoTimestamp(conversation.updatedAt),
		}));
	});

export const getUnreadMessageCount = createServerFn().handler(async () => {
	const sessionToken = await getGrpcSessionToken();
	if (!sessionToken) {
		return 0;
	}

	try {
		const client = getGrpcClient();
		const { response } = await client.social.getConversations({
			sessionToken,
			limit: 100,
			offset: 0,
		});

		return response.conversations.reduce(
			(total, conversation) => total + conversation.unreadCount,
			0,
		);
	} catch (error) {
		if (isApiUnavailableError(error)) {
			return 0;
		}

		throw error;
	}
});

export const getMessages = createServerFn()
	.inputValidator((d: { conversationId: string; limit?: number; offset?: number }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.social.getMessages({
			sessionToken,
			conversationId: data.conversationId,
			limit: data.limit || 50,
			offset: data.offset || 0,
		});

		return response.messages
			.map((message) => ({
				id: message.id,
				conversationId: message.conversationId,
				sender: message.sender ? toAuthor(message.sender) : null,
				content: message.content,
				read: message.read,
				createdAt: fromProtoTimestamp(message.createdAt),
			}))
			.reverse();
	});

export const sendMessage = createServerFn({ method: "POST" })
	.inputValidator((d: { conversationId: string; content: string }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.social.sendMessage({
			sessionToken,
			conversationId: data.conversationId,
			content: data.content,
		});

		if (!response.success || !response.message) {
			throw new Error(response.error || "Failed to send message");
		}

		return {
			id: response.message.id,
			conversationId: response.message.conversationId,
			sender: response.message.sender ? toAuthor(response.message.sender) : null,
			content: response.message.content,
			read: response.message.read,
			createdAt: fromProtoTimestamp(response.message.createdAt),
		};
	});

export const markConversationRead = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: conversationId }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.social.markConversationRead({
			sessionToken,
			conversationId,
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to mark conversation read");
		}

		return { success: true };
	});
