import { and, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { generateId } from "./utils";

const { comments, posts, reports, users } = schema;

export type ReportTargetType = "post" | "comment" | "user";

interface CreateReportInput {
	reporterId: string;
	targetType: ReportTargetType;
	targetId: string;
	reason: string;
	description?: string;
}

async function assertTargetExists(targetType: ReportTargetType, targetId: string) {
	switch (targetType) {
		case "post": {
			const post = await db
				.select({ id: posts.id })
				.from(posts)
				.where(eq(posts.id, targetId))
				.limit(1);
			if (post.length === 0) throw new Error("Post not found");
			return;
		}
		case "comment": {
			const comment = await db
				.select({ id: comments.id })
				.from(comments)
				.where(eq(comments.id, targetId))
				.limit(1);
			if (comment.length === 0) throw new Error("Comment not found");
			return;
		}
		case "user": {
			const user = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.id, targetId))
				.limit(1);
			if (user.length === 0) throw new Error("User not found");
			return;
		}
	}
}

export async function createReport(input: CreateReportInput) {
	if (!["post", "comment", "user"].includes(input.targetType)) {
		throw new Error("Invalid report target");
	}

	const reason = input.reason.trim();
	const description = input.description?.trim();

	if (reason.length < 3) {
		throw new Error("Report reason is required");
	}

	if (input.reporterId === input.targetId && input.targetType === "user") {
		throw new Error("You cannot report yourself");
	}

	await assertTargetExists(input.targetType, input.targetId);

	const existingPending = await db
		.select({ id: reports.id })
		.from(reports)
		.where(
			and(
				eq(reports.reporterId, input.reporterId),
				eq(reports.targetType, input.targetType),
				eq(reports.targetId, input.targetId),
				eq(reports.status, "pending"),
			),
		)
		.limit(1);

	if (existingPending[0]) {
		return { reportId: existingPending[0].id, created: false };
	}

	const reportId = generateId();

	await db.insert(reports).values({
		id: reportId,
		reporterId: input.reporterId,
		targetType: input.targetType,
		targetId: input.targetId,
		reason,
		description: description || null,
	});

	return { reportId, created: true };
}
