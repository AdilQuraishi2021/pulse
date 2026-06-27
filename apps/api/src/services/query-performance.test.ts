import { describe, expect, it, vi } from "vitest";
import {
	createTestComment,
	createTestFollow,
	createTestLike,
	createTestPost,
	createTestUser,
} from "../../tests/helpers";
import { client, db, schema } from "../db";
import { getBookmarkedPosts } from "./bookmarks.service";
import { getHomeFeed } from "./feed.service";
import { getUserPosts } from "./posts.service";
import { generateId } from "./utils";
import { getUser } from "./users.service";

const { bookmarks } = schema;

function countSqlQueries() {
	const executeSpy = vi.spyOn(client as { execute: (...args: unknown[]) => unknown }, "execute");

	return {
		get count() {
			return executeSpy.mock.calls.length;
		},
		restore() {
			executeSpy.mockRestore();
		},
	};
}

describe("query performance", () => {
	it("loads a 10-post home feed in constant queries", async () => {
		const viewer = await createTestUser();
		const author = await createTestUser();
		await createTestFollow(viewer.id, author.id);

		for (let index = 0; index < 10; index++) {
			const postId = await createTestPost(author.id, `Feed post ${index}`);
			await createTestLike(viewer.id, postId);
			await createTestComment(postId, viewer.id);
		}

		const queries = countSqlQueries();
		try {
			const feed = await getHomeFeed(viewer.id, { limit: 10 });

			expect(feed).toHaveLength(10);
			expect(feed[0].likeCount).toBe(1);
			expect(feed[0].commentCount).toBe(1);
			expect(feed[0].isLiked).toBe(true);
			expect(queries.count).toBe(5);
		} finally {
			queries.restore();
		}
	});

	it("loads a profile page with 10 posts in constant queries", async () => {
		const viewer = await createTestUser();
		const profileUser = await createTestUser();
		await createTestFollow(viewer.id, profileUser.id);

		for (let index = 0; index < 10; index++) {
			const postId = await createTestPost(profileUser.id, `Profile post ${index}`);
			await createTestLike(viewer.id, postId);
			await createTestComment(postId, viewer.id);
		}

		const queries = countSqlQueries();
		try {
			const profile = await getUser(profileUser.username, viewer.id);
			const posts = await getUserPosts(profileUser.username, viewer.id);

			expect(profile.followerCount).toBe(1);
			expect(profile.postCount).toBe(10);
			expect(profile.isFollowing).toBe(true);
			expect(posts).toHaveLength(10);
			expect(posts[0].likeCount).toBe(1);
			expect(posts[0].commentCount).toBe(1);
			expect(posts[0].isLiked).toBe(true);
			expect(queries.count).toBe(6);
		} finally {
			queries.restore();
		}
	});

	it("loads 10 bookmarked posts in constant queries", async () => {
		const viewer = await createTestUser();
		const author = await createTestUser();

		for (let index = 0; index < 10; index++) {
			const postId = await createTestPost(author.id, `Bookmarked post ${index}`);
			await createTestLike(viewer.id, postId);
			await createTestComment(postId, viewer.id);
			await db.insert(bookmarks).values({
				id: generateId(),
				userId: viewer.id,
				postId,
			});
		}

		const queries = countSqlQueries();
		try {
			const posts = await getBookmarkedPosts(viewer.id, viewer.id, 10);

			expect(posts).toHaveLength(10);
			expect(posts[0].likeCount).toBe(1);
			expect(posts[0].commentCount).toBe(1);
			expect(posts[0].isLiked).toBe(true);
			expect(queries.count).toBe(4);
		} finally {
			queries.restore();
		}
	});
});
