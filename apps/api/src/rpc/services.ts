import { adminHandler } from "../grpc/handlers/admin.handler";
import { aiHandler } from "../grpc/handlers/ai.handler";
import { authHandler } from "../grpc/handlers/auth.handler";
import { bookmarksHandler } from "../grpc/handlers/bookmarks.handler";
import { commentsHandler } from "../grpc/handlers/comments.handler";
import { feedHandler } from "../grpc/handlers/feed.handler";
import { followsHandler } from "../grpc/handlers/follows.handler";
import { likesHandler } from "../grpc/handlers/likes.handler";
import { notificationsHandler } from "../grpc/handlers/notifications.handler";
import { postsHandler } from "../grpc/handlers/posts.handler";
import { reportsHandler } from "../grpc/handlers/reports.handler";
import { searchHandler } from "../grpc/handlers/search.handler";
import { socialHandler } from "../grpc/handlers/social.handler";
import { usersHandler } from "../grpc/handlers/users.handler";

export const rpcServices = {
	admin: adminHandler,
	ai: aiHandler,
	auth: authHandler,
	bookmarks: bookmarksHandler,
	comments: commentsHandler,
	feed: feedHandler,
	follows: followsHandler,
	likes: likesHandler,
	notifications: notificationsHandler,
	posts: postsHandler,
	reports: reportsHandler,
	search: searchHandler,
	social: socialHandler,
	users: usersHandler,
} as const;

export type RpcServiceName = keyof typeof rpcServices;
