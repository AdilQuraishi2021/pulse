import { eq, sql } from "drizzle-orm";
import { db, schema } from "../db";

const { users } = schema;

export interface UpdateProfileInput {
	userId: string;
	displayName?: string;
	bio?: string;
	avatarUrl?: string;
}

export async function getUser(username: string, requesterId?: string) {
	const user = await db
		.select({
			id: users.id,
			email: users.email,
			username: users.username,
			displayName: users.displayName,
			avatarUrl: users.avatarUrl,
			bio: users.bio,
			role: users.role,
			createdAt: users.createdAt,
			followerCount: sql<number>`(
				select count(*) from follows
				where follows.following_id = users.id
			)`,
			followingCount: sql<number>`(
				select count(*) from follows
				where follows.follower_id = users.id
			)`,
			postCount: sql<number>`(
				select count(*) from posts
				where posts.author_id = users.id
			)`,
			isFollowing: requesterId
				? sql<number>`(
						select exists(
							select 1 from follows
							where follows.follower_id = ${requesterId}
								and follows.following_id = users.id
						)
					)`
				: sql<number>`0`,
		})
		.from(users)
		.where(eq(users.username, username))
		.then((rows) => rows[0]);

	if (!user) {
		throw new Error("User not found");
	}

	return {
		...user,
		isFollowing: requesterId !== user.id && Boolean(user.isFollowing),
	};
}

export async function updateProfile(input: UpdateProfileInput) {
	const updateData: Record<string, string> = {};

	if (input.displayName !== undefined) {
		updateData.displayName = input.displayName;
	}

	if (input.bio !== undefined) {
		updateData.bio = input.bio;
	}

	if (input.avatarUrl !== undefined) {
		updateData.avatarUrl = input.avatarUrl;
	}

	if (Object.keys(updateData).length === 0) {
		return { success: true };
	}

	await db
		.update(users)
		.set({
			...updateData,
			updatedAt: new Date(),
		})
		.where(eq(users.id, input.userId));

	return { success: true };
}
