import { and, eq } from "drizzle-orm";
import { hashPassword } from "../services/utils";
import { client, db, schema } from "./index";

const { users, posts, comments, likes, follows } = schema;

interface SeedUser {
	email: string;
	username: string;
	displayName: string;
	password: string;
	role: "user" | "admin" | "moderator";
	bio: string;
}

async function getUserId(username: string) {
	const user = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.username, username))
		.then((rows) => rows[0]);
	if (!user) {
		throw new Error(`Seed user not found: ${username}`);
	}
	return user.id;
}

async function getOrCreatePost(seedId: string, content: string, authorId: string) {
	const existingPost = await db
		.select({ id: posts.id })
		.from(posts)
		.where(and(eq(posts.content, content), eq(posts.authorId, authorId)))
		.then((rows) => rows[0]);

	if (existingPost) {
		return existingPost.id;
	}

	await db.insert(posts).ignore().values({ id: seedId, content, authorId });

	const post = await db
		.select({ id: posts.id })
		.from(posts)
		.where(eq(posts.id, seedId))
		.then((rows) => rows[0]);
	if (!post) {
		throw new Error(`Seed post not found after insert: ${seedId}`);
	}
	return post.id;
}

async function getOrCreateComment(
	seedId: string,
	content: string,
	postId: string,
	authorId: string,
) {
	const existingComment = await db
		.select({ id: comments.id })
		.from(comments)
		.where(
			and(
				eq(comments.content, content),
				eq(comments.postId, postId),
				eq(comments.authorId, authorId),
			),
		)
		.then((rows) => rows[0]);

	if (existingComment) {
		return existingComment.id;
	}

	await db.insert(comments).ignore().values({ id: seedId, content, postId, authorId });

	const comment = await db
		.select({ id: comments.id })
		.from(comments)
		.where(eq(comments.id, seedId))
		.then((rows) => rows[0]);
	if (!comment) {
		throw new Error(`Seed comment not found after insert: ${seedId}`);
	}
	return comment.id;
}

async function seed() {
	console.log("Seeding database...");

	const testUsers: SeedUser[] = [
		{
			email: "alice@test.com",
			username: "alice",
			displayName: "Alice Johnson",
			password: "password123",
			role: "user",
			bio: "Coffee enthusiast | Developer | Love to share thoughts",
		},
		{
			email: "bob@test.com",
			username: "bob",
			displayName: "Bob Smith",
			password: "password123",
			role: "user",
			bio: "Just a guy who loves coding",
		},
		{
			email: "charlie@test.com",
			username: "charlie",
			displayName: "Charlie Brown",
			password: "password123",
			role: "user",
			bio: "Living life one day at a time",
		},
		{
			email: "diana@test.com",
			username: "diana",
			displayName: "Diana Ross",
			password: "password123",
			role: "user",
			bio: "Music is my soul",
		},
		{
			email: "admin@test.com",
			username: "admin_old",
			displayName: "Admin User Old",
			password: "admin123",
			role: "admin",
			bio: "System administrator",
		},
		{
			email: "admin@chirp.test",
			username: "admin",
			displayName: "Admin User",
			password: "admin123",
			role: "admin",
			bio: "Platform administrator",
		},
		{
			email: "moderator@chirp.test",
			username: "moderator",
			displayName: "Moderator User",
			password: "mod123",
			role: "moderator",
			bio: "Content moderator",
		},
	];

	for (const user of testUsers) {
		const passwordHash = await hashPassword(user.password);
		await db
			.insert(users)
			.ignore()
			.values({
				id: `seed-user-${user.username}`,
				email: user.email,
				username: user.username,
				displayName: user.displayName,
				passwordHash,
				role: user.role,
				bio: user.bio,
			});
		console.log(`Created user: ${user.username}`);
	}

	const aliceId = await getUserId("alice");
	const bobId = await getUserId("bob");
	const charlieId = await getUserId("charlie");
	const dianaId = await getUserId("diana");

	const post1Id = await getOrCreatePost(
		"seed-post-1",
		"Just deployed my first full-stack app with gRPC and TypeScript. The type safety across the entire stack is incredible!",
		aliceId,
	);
	const post2Id = await getOrCreatePost(
		"seed-post-2",
		"Morning coffee and code reviews. There is something peaceful about reading clean, well-structured code early in the day.",
		bobId,
	);
	const post3Id = await getOrCreatePost(
		"seed-post-3",
		"Hot take: monorepos are the way to go for any team project. Shared packages, consistent tooling, and atomic changes across services.",
		aliceId,
	);
	const post4Id = await getOrCreatePost(
		"seed-post-4",
		"Finally wrapped my head around Protocol Buffers. The schema-first approach to API design changes everything.",
		charlieId,
	);
	const post5Id = await getOrCreatePost(
		"seed-post-5",
		"Spent the weekend learning StyleX. CSS-in-JS with zero runtime cost? Sign me up.",
		dianaId,
	);
	const post6Id = await getOrCreatePost(
		"seed-post-6",
		"Pair programming tip: the navigator should think about the big picture while the driver focuses on implementation details. Works every time.",
		bobId,
	);
	const post7Id = await getOrCreatePost(
		"seed-post-7",
		"TIL that TanStack Router has file-based routing with full type safety. No more guessing route params!",
		charlieId,
	);
	const post8Id = await getOrCreatePost(
		"seed-post-8",
		"Music recommendation for coding: lo-fi beats are great, but have you tried ambient soundscapes? Total game changer for deep focus.",
		dianaId,
	);
	console.log("Created sample posts");

	await getOrCreateComment(
		"seed-comment-1",
		"Congrats on the deployment! What was the trickiest part of the gRPC setup?",
		post1Id,
		bobId,
	);
	await getOrCreateComment(
		"seed-comment-2",
		"The type safety with Protobuf + TypeScript is next level. Welcome to the club!",
		post1Id,
		charlieId,
	);
	await getOrCreateComment(
		"seed-comment-3",
		"Could not agree more. A good codebase is a joy to read.",
		post2Id,
		aliceId,
	);
	await getOrCreateComment(
		"seed-comment-4",
		"Totally agree! We switched to a monorepo last year and never looked back.",
		post3Id,
		dianaId,
	);
	await getOrCreateComment(
		"seed-comment-5",
		"Check out Buf for linting and managing your proto files. It is a huge time saver.",
		post4Id,
		aliceId,
	);
	await getOrCreateComment(
		"seed-comment-6",
		"StyleX is amazing! The compile-time optimization makes such a difference in bundle size.",
		post5Id,
		bobId,
	);
	await getOrCreateComment(
		"seed-comment-7",
		"Great tip! I always struggle with knowing when to step back as the driver.",
		post6Id,
		charlieId,
	);
	await getOrCreateComment(
		"seed-comment-8",
		'I love ambient soundscapes for coding! Check out the "A Soft Murmur" website.',
		post8Id,
		aliceId,
	);
	console.log("Created sample comments");

	await db
		.insert(likes)
		.ignore()
		.values([
			{ id: "seed-like-1", userId: bobId, postId: post1Id },
			{ id: "seed-like-2", userId: charlieId, postId: post1Id },
			{ id: "seed-like-3", userId: dianaId, postId: post1Id },
			{ id: "seed-like-4", userId: aliceId, postId: post2Id },
			{ id: "seed-like-5", userId: charlieId, postId: post2Id },
			{ id: "seed-like-6", userId: bobId, postId: post3Id },
			{ id: "seed-like-7", userId: dianaId, postId: post3Id },
			{ id: "seed-like-8", userId: aliceId, postId: post4Id },
			{ id: "seed-like-9", userId: bobId, postId: post4Id },
			{ id: "seed-like-10", userId: aliceId, postId: post5Id },
			{ id: "seed-like-11", userId: charlieId, postId: post5Id },
			{ id: "seed-like-12", userId: aliceId, postId: post6Id },
			{ id: "seed-like-13", userId: dianaId, postId: post6Id },
			{ id: "seed-like-14", userId: bobId, postId: post7Id },
			{ id: "seed-like-15", userId: dianaId, postId: post7Id },
			{ id: "seed-like-16", userId: bobId, postId: post8Id },
			{ id: "seed-like-17", userId: charlieId, postId: post8Id },
		]);
	console.log("Created sample likes");

	await db
		.insert(follows)
		.ignore()
		.values([
			{ id: "seed-follow-1", followerId: bobId, followingId: aliceId },
			{ id: "seed-follow-2", followerId: charlieId, followingId: aliceId },
			{ id: "seed-follow-3", followerId: dianaId, followingId: aliceId },
			{ id: "seed-follow-4", followerId: aliceId, followingId: bobId },
			{ id: "seed-follow-5", followerId: charlieId, followingId: bobId },
			{ id: "seed-follow-6", followerId: aliceId, followingId: charlieId },
			{ id: "seed-follow-7", followerId: bobId, followingId: charlieId },
			{ id: "seed-follow-8", followerId: aliceId, followingId: dianaId },
			{ id: "seed-follow-9", followerId: bobId, followingId: dianaId },
		]);
	console.log("Created sample follows");

	console.log("Database seeded successfully!");
}

seed()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await client.end();
	});
