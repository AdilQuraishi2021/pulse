import type { IFollowsService } from "@chirp/proto";
import { validateSessionToken } from "../../middleware/auth";
import {
	getFollowerCount,
	getFollowers,
	getFollowing,
	getFollowingCount,
	getFollowStatus,
	getFriends,
	respondToFriendRequest,
	sendFriendRequest,
	toggleFollow,
} from "../../services/follows.service";

function toSocialUser(user: Awaited<ReturnType<typeof getFollowers>>[number]) {
	return {
		id: user.id,
		username: user.username,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl || undefined,
		isOnline: user.isOnline,
		lastSeen: user.lastSeen?.toISOString(),
	};
}

export const followsHandler: IFollowsService = {
	async toggleFollow(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await toggleFollow(request.username, auth.userId);

			return {
				success: true,
				following: result.following,
			};
		} catch (error) {
			return {
				success: false,
				following: false,
				error: error instanceof Error ? error.message : "Failed to toggle follow",
			};
		}
	},

	async getFollowStatus(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await getFollowStatus(request.username, auth.userId);

			return { following: result.following };
		} catch {
			return { following: false };
		}
	},

	async getFollowerCount(request) {
		try {
			const result = await getFollowerCount(request.username);
			return { count: result.count };
		} catch {
			return { count: 0 };
		}
	},

	async getFollowingCount(request) {
		try {
			const result = await getFollowingCount(request.username);
			return { count: result.count };
		} catch {
			return { count: 0 };
		}
	},

	async sendFriendRequest(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await sendFriendRequest(request.username, auth.userId);
			return { success: true, requestId: result.requestId, status: result.status };
		} catch (error) {
			return {
				success: false,
				requestId: "",
				status: "failed",
				error: error instanceof Error ? error.message : "Failed to send friend request",
			};
		}
	},

	async acceptFriendRequest(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await respondToFriendRequest(request.requestId, auth.userId, "accepted");
			return { success: true, requestId: result.requestId, status: result.status };
		} catch (error) {
			return {
				success: false,
				requestId: request.requestId,
				status: "failed",
				error: error instanceof Error ? error.message : "Failed to accept friend request",
			};
		}
	},

	async rejectFriendRequest(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await respondToFriendRequest(request.requestId, auth.userId, "rejected");
			return { success: true, requestId: result.requestId, status: result.status };
		} catch (error) {
			return {
				success: false,
				requestId: request.requestId,
				status: "failed",
				error: error instanceof Error ? error.message : "Failed to reject friend request",
			};
		}
	},

	async getFollowers(request) {
		const users = await getFollowers(request.username, request.limit || 50, request.offset || 0);
		return { users: users.map(toSocialUser) };
	},

	async getFollowing(request) {
		const users = await getFollowing(request.username, request.limit || 50, request.offset || 0);
		return { users: users.map(toSocialUser) };
	},

	async getFriends(request) {
		const users = await getFriends(request.username, request.limit || 50, request.offset || 0);
		return { users: users.map(toSocialUser) };
	},
};
