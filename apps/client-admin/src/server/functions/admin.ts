import { createServerFn } from "@tanstack/react-start";
import {
	fromProtoTimestamp,
	getGrpcClient,
	requireAdminGrpcSessionToken,
} from "../../lib/grpc.server";

const PAGE_LIMIT = 50;

interface ProtoTimestampLike {
	seconds: bigint;
	nanos: number;
}

interface ProtoAuthorLike {
	id?: string;
	username?: string;
	displayName?: string;
	avatarUrl?: string;
}

interface ProtoAdminUserLike {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
	bio?: string;
	role: string;
	createdAt?: ProtoTimestampLike;
	updatedAt?: ProtoTimestampLike;
	bannedAt?: ProtoTimestampLike;
	bannedReason?: string;
	postCount?: number;
	commentCount?: number;
}

interface ProtoPostLike {
	id: string;
	content: string;
	createdAt?: ProtoTimestampLike;
	updatedAt?: ProtoTimestampLike;
	author?: ProtoAuthorLike;
	likeCount?: number;
	commentCount?: number;
	isLiked?: boolean;
}

interface ProtoCommentLike {
	id: string;
	content: string;
	createdAt?: ProtoTimestampLike;
	parentId?: string;
	author?: ProtoAuthorLike;
	likeCount?: number;
	replies?: ProtoCommentLike[];
}

interface ProtoReportLike {
	id: string;
	reporterId: string;
	reporterUsername: string;
	targetType: string;
	targetId: string;
	reason: string;
	description?: string;
	status: string;
	reviewedBy?: string;
	reviewedAt?: ProtoTimestampLike;
	createdAt?: ProtoTimestampLike;
}

interface ProtoAuditLogLike {
	id: string;
	adminId: string;
	adminUsername: string;
	action: string;
	targetType?: string;
	targetId?: string;
	details?: string;
	ipAddress?: string;
	createdAt?: ProtoTimestampLike;
}

function toAdminUser(user: ProtoAdminUserLike) {
	return {
		id: user.id,
		email: user.email,
		username: user.username,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl || null,
		bio: user.bio || null,
		role: user.role as "user" | "admin" | "moderator",
		createdAt: fromProtoTimestamp(user.createdAt).toISOString(),
		updatedAt: fromProtoTimestamp(user.updatedAt).toISOString(),
		bannedAt: user.bannedAt ? fromProtoTimestamp(user.bannedAt).toISOString() : null,
		bannedReason: user.bannedReason || null,
		postCount: user.postCount || 0,
		commentCount: user.commentCount || 0,
	};
}

function toAuthor(author: ProtoAuthorLike | undefined) {
	return {
		id: author?.id || "",
		username: author?.username || "",
		displayName: author?.displayName || "",
		avatarUrl: author?.avatarUrl || null,
	};
}

function toPost(post: ProtoPostLike) {
	return {
		id: post.id,
		content: post.content,
		createdAt: fromProtoTimestamp(post.createdAt).toISOString(),
		updatedAt: fromProtoTimestamp(post.updatedAt).toISOString(),
		author: toAuthor(post.author),
		likeCount: post.likeCount || 0,
		commentCount: post.commentCount || 0,
		isLiked: Boolean(post.isLiked),
	};
}

function toComment(comment: ProtoCommentLike, postId: string): AdminComment {
	return {
		id: comment.id,
		postId,
		content: comment.content,
		createdAt: fromProtoTimestamp(comment.createdAt).toISOString(),
		parentId: comment.parentId || null,
		author: toAuthor(comment.author),
		likeCount: comment.likeCount || 0,
		replies: (comment.replies || []).map((reply) => toComment(reply, postId)),
	};
}

function toReport(report: ProtoReportLike) {
	return {
		id: report.id,
		reporterId: report.reporterId,
		reporterUsername: report.reporterUsername,
		targetType: report.targetType as "user" | "post" | "comment",
		targetId: report.targetId,
		reason: report.reason,
		description: report.description || null,
		status: report.status as "pending" | "reviewed" | "actioned" | "dismissed",
		reviewedBy: report.reviewedBy || null,
		reviewedAt: report.reviewedAt ? fromProtoTimestamp(report.reviewedAt).toISOString() : null,
		createdAt: fromProtoTimestamp(report.createdAt).toISOString(),
	};
}

function toAuditLog(log: ProtoAuditLogLike) {
	return {
		id: log.id,
		adminId: log.adminId,
		adminUsername: log.adminUsername,
		action: log.action,
		targetType: log.targetType || null,
		targetId: log.targetId || null,
		details: log.details || null,
		ipAddress: log.ipAddress || null,
		createdAt: fromProtoTimestamp(log.createdAt).toISOString(),
	};
}

export interface AdminComment {
	id: string;
	postId: string;
	content: string;
	createdAt: string;
	parentId: string | null;
	author: {
		id: string;
		username: string;
		displayName: string;
		avatarUrl: string | null;
	};
	likeCount: number;
	replies: AdminComment[];
}

export const getDashboardStats = createServerFn().handler(async () => {
	const sessionToken = await requireAdminGrpcSessionToken();
	const client = getGrpcClient();
	const { response } = await client.admin.getDashboardStats({ sessionToken });

	return {
		totalUsers: response.totalUsers,
		totalPosts: response.totalPosts,
		totalComments: response.totalComments,
		pendingReports: response.pendingReports,
		newUsersToday: response.newUsersToday,
		newPostsToday: response.newPostsToday,
		bannedUsers: response.bannedUsers,
	};
});

export const listAdminUsers = createServerFn()
	.inputValidator((data: { searchQuery?: string; roleFilter?: string } | undefined) => data || {})
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.listUsers({
			sessionToken,
			pagination: { limit: PAGE_LIMIT, offset: 0 },
			searchQuery: data.searchQuery || undefined,
			roleFilter: data.roleFilter && data.roleFilter !== "all" ? data.roleFilter : undefined,
		});

		return {
			users: response.users.map(toAdminUser),
			total: response.total,
		};
	});

export const getAdminUserDetails = createServerFn()
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.getUserDetails({
			sessionToken,
			userId: data.userId,
		});
		if (!response.user) {
			throw new Error("User not found");
		}
		return toAdminUser(response.user);
	});

export const banAdminUser = createServerFn({ method: "POST" })
	.inputValidator((data: { userId: string; reason: string }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.banUser({
			sessionToken,
			userId: data.userId,
			reason: data.reason,
		});
		if (!response.success) throw new Error(response.error || "Failed to ban user");
		return { success: true };
	});

export const unbanAdminUser = createServerFn({ method: "POST" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.unbanUser({ sessionToken, userId: data.userId });
		if (!response.success) throw new Error(response.error || "Failed to unban user");
		return { success: true };
	});

export const updateAdminUserRole = createServerFn({ method: "POST" })
	.inputValidator((data: { userId: string; role: "user" | "admin" | "moderator" }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.updateUserRole({
			sessionToken,
			userId: data.userId,
			role: data.role,
		});
		if (!response.success) throw new Error(response.error || "Failed to update role");
		return { success: true };
	});

export const deleteAdminUser = createServerFn({ method: "POST" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.deleteUser({ sessionToken, userId: data.userId });
		if (!response.success) throw new Error(response.error || "Failed to delete user");
		return { success: true };
	});

export const listAdminPosts = createServerFn().handler(async () => {
	const sessionToken = await requireAdminGrpcSessionToken();
	const client = getGrpcClient();
	const { response } = await client.posts.getPosts({
		sessionToken,
		pagination: { limit: PAGE_LIMIT, offset: 0 },
	});
	return response.posts.map(toPost);
});

export const getAdminPost = createServerFn()
	.inputValidator((data: { postId: string }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.posts.getPost({
			postId: data.postId,
			sessionToken,
		});
		return toPost(response);
	});

export const getAdminUserPosts = createServerFn()
	.inputValidator((data: { username: string }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.posts.getUserPosts({
			username: data.username,
			sessionToken,
		});
		return response.posts.map(toPost);
	});

export const deleteAdminPost = createServerFn({ method: "POST" })
	.inputValidator((data: { postId: string; reason: string }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.deletePostAdmin({
			sessionToken,
			postId: data.postId,
			reason: data.reason,
		});
		if (!response.success) throw new Error(response.error || "Failed to delete post");
		return { success: true };
	});

export const getAdminPostComments = createServerFn()
	.inputValidator((data: { postId: string }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.comments.getPostComments({
			postId: data.postId,
			sessionToken,
		});
		return response.comments.map((comment) => toComment(comment, data.postId));
	});

export const listAdminComments = createServerFn().handler(async () => {
	const sessionToken = await requireAdminGrpcSessionToken();
	const client = getGrpcClient();
	const { response } = await client.posts.getPosts({
		sessionToken,
		pagination: { limit: PAGE_LIMIT, offset: 0 },
	});

	const commentGroups = await Promise.all(
		response.posts.map(async (post) => {
			const commentsResponse = await client.comments.getPostComments({
				postId: post.id,
				sessionToken,
			});
			const flatten = (comments: AdminComment[]): AdminComment[] =>
				comments.flatMap((comment) => [comment, ...flatten(comment.replies)]);

			return flatten(
				commentsResponse.response.comments.map((comment) => toComment(comment, post.id)),
			).map((comment) => ({
				...comment,
				postTitle: post.content.slice(0, 48) || "Post",
			}));
		}),
	);

	return commentGroups.flat();
});

export const deleteAdminComment = createServerFn({ method: "POST" })
	.inputValidator((data: { commentId: string; reason: string }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.deleteCommentAdmin({
			sessionToken,
			commentId: data.commentId,
			reason: data.reason,
		});
		if (!response.success) throw new Error(response.error || "Failed to delete comment");
		return { success: true };
	});

export const listAdminReports = createServerFn()
	.inputValidator((data: { statusFilter?: string; typeFilter?: string } | undefined) => data || {})
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.listReports({
			sessionToken,
			pagination: { limit: PAGE_LIMIT, offset: 0 },
			statusFilter:
				data.statusFilter && data.statusFilter !== "all" ? data.statusFilter : undefined,
			typeFilter: data.typeFilter && data.typeFilter !== "all" ? data.typeFilter : undefined,
		});
		return {
			reports: response.reports.map(toReport),
			total: response.total,
		};
	});

export const reviewAdminReport = createServerFn({ method: "POST" })
	.inputValidator((data: { reportId: string; action: string; notes?: string }) => data)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.reviewReport({
			sessionToken,
			reportId: data.reportId,
			action: data.action,
			notes: data.notes || undefined,
		});
		if (!response.success) throw new Error(response.error || "Failed to review report");
		return { success: true };
	});

export const listAdminAuditLogs = createServerFn()
	.inputValidator((data: { actionFilter?: string } | undefined) => data || {})
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminGrpcSessionToken();
		const client = getGrpcClient();
		const { response } = await client.admin.getAuditLogs({
			sessionToken,
			pagination: { limit: PAGE_LIMIT, offset: 0 },
			actionFilter:
				data.actionFilter && data.actionFilter !== "all" ? data.actionFilter : undefined,
		});
		return {
			logs: response.logs.map(toAuditLog),
			total: response.total,
		};
	});
