import {
	boolean,
	mysqlEnum,
	mysqlTable,
	text,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/mysql-core";

const id = (name: string) => varchar(name, { length: 191 });

// Users table with role-based admin support
export const users = mysqlTable("users", {
	id: id("id").primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	username: varchar("username", { length: 64 }).notNull().unique(),
	displayName: varchar("display_name", { length: 255 }).notNull(),
	avatarUrl: text("avatar_url"),
	bio: text("bio"),
	passwordHash: text("password_hash").notNull(),
	// Role-based access control
	role: mysqlEnum("role", ["user", "admin", "moderator"]).notNull().default("user"),
	// Ban status
	bannedAt: timestamp("banned_at"),
	bannedReason: text("banned_reason"),
	bannedBy: id("banned_by"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// Posts table
export const posts = mysqlTable("posts", {
	id: id("id").primaryKey(),
	content: text("content").notNull(),
	authorId: id("author_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// Comments table
export const comments = mysqlTable("comments", {
	id: id("id").primaryKey(),
	content: text("content").notNull(),
	postId: id("post_id")
		.notNull()
		.references(() => posts.id, { onDelete: "cascade" }),
	authorId: id("author_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	// biome-ignore lint/suspicious/noExplicitAny: self-reference requires any
	parentId: id("parent_id").references((): any => comments.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Likes table
export const likes = mysqlTable(
	"likes",
	{
		id: id("id").primaryKey(),
		userId: id("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		postId: id("post_id").references(() => posts.id, { onDelete: "cascade" }),
		commentId: id("comment_id").references(() => comments.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		uniquePostLike: unique().on(table.userId, table.postId),
		uniqueCommentLike: unique().on(table.userId, table.commentId),
	}),
);

// Follows table
export const follows = mysqlTable(
	"follows",
	{
		id: id("id").primaryKey(),
		followerId: id("follower_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		followingId: id("following_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		uniqueFollow: unique().on(table.followerId, table.followingId),
	}),
);

// Bookmarks table
export const bookmarks = mysqlTable(
	"bookmarks",
	{
		id: id("id").primaryKey(),
		userId: id("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		postId: id("post_id")
			.notNull()
			.references(() => posts.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		uniqueBookmark: unique().on(table.userId, table.postId),
	}),
);

// Notifications table
export const notifications = mysqlTable("notifications", {
	id: id("id").primaryKey(),
	userId: id("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	type: varchar("type", { length: 64 }).notNull(),
	actorId: id("actor_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	postId: id("post_id").references(() => posts.id, { onDelete: "cascade" }),
	commentId: id("comment_id").references(() => comments.id, { onDelete: "cascade" }),
	read: boolean("read").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reports table for content moderation
export const reports = mysqlTable("reports", {
	id: id("id").primaryKey(),
	reporterId: id("reporter_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	targetType: mysqlEnum("target_type", ["post", "comment", "user"]).notNull(),
	targetId: id("target_id").notNull(),
	reason: varchar("reason", { length: 255 }).notNull(),
	description: text("description"),
	status: mysqlEnum("status", ["pending", "reviewed", "actioned", "dismissed"])
		.notNull()
		.default("pending"),
	reviewedBy: id("reviewed_by").references(() => users.id),
	reviewedAt: timestamp("reviewed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audit logs table for admin actions
export const auditLogs = mysqlTable("audit_logs", {
	id: id("id").primaryKey(),
	adminId: id("admin_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	action: varchar("action", { length: 255 }).notNull(),
	targetType: mysqlEnum("target_type", ["user", "post", "comment", "report"]),
	targetId: id("target_id"),
	details: text("details"), // JSON string for additional details
	ipAddress: varchar("ip_address", { length: 45 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Role type
export type UserRole = "user" | "admin" | "moderator";
