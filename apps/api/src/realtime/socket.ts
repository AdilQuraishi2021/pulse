import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

type ActivityScope = {
	userId?: string;
	postId?: string;
};

type ActivityPayload = ActivityScope & {
	type: string;
	[key: string]: unknown;
};

let io: Server | null = null;
const onlineUsers = new Map<string, number>();

function userRoom(userId: string) {
	return `user:${userId}`;
}

function postRoom(postId: string) {
	return `post:${postId}`;
}

function emitActivity(payload: ActivityPayload) {
	if (!io) {
		return;
	}

	io.emit("activity", payload);
}

function setUserPresence(userId: string, isOnline: boolean) {
	if (!io) {
		return;
	}

	const currentConnections = onlineUsers.get(userId) ?? 0;
	const nextConnections = isOnline ? currentConnections + 1 : Math.max(currentConnections - 1, 0);

	if (nextConnections === 0) {
		onlineUsers.delete(userId);
	} else {
		onlineUsers.set(userId, nextConnections);
	}

	const statusChanged =
		(isOnline && currentConnections === 0) || (!isOnline && nextConnections === 0);

	if (statusChanged) {
		io.emit("presence:update", { userId, online: isOnline });
	}
}

export function initializeSocketServer(httpServer: HttpServer) {
	io = new Server(httpServer, {
		cors: {
			origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		const userId =
			typeof socket.handshake.auth.userId === "string" ? socket.handshake.auth.userId : null;

		if (userId) {
			socket.join(userRoom(userId));
			setUserPresence(userId, true);
		}

		socket.on("post:join", ({ postId }: { postId?: string }) => {
			if (postId) {
				socket.join(postRoom(postId));
			}
		});

		socket.on("post:leave", ({ postId }: { postId?: string }) => {
			if (postId) {
				socket.leave(postRoom(postId));
			}
		});

		socket.on("typing:start", ({ postId }: { postId?: string }) => {
			if (userId && postId) {
				socket.to(postRoom(postId)).emit("typing:update", { userId, postId, typing: true });
			}
		});

		socket.on("typing:stop", ({ postId }: { postId?: string }) => {
			if (userId && postId) {
				socket.to(postRoom(postId)).emit("typing:update", { userId, postId, typing: false });
			}
		});

		socket.on(
			"chat:message",
			({ recipientId, message }: { recipientId?: string; message?: string }) => {
				if (userId && recipientId && message) {
					io?.to(userRoom(recipientId)).emit("chat:message", {
						senderId: userId,
						recipientId,
						message,
						createdAt: new Date().toISOString(),
					});
				}
			},
		);

		socket.on("disconnect", () => {
			if (userId) {
				setUserPresence(userId, false);
			}
		});
	});

	return io;
}

export function emitNotification(userId: string, payload: Record<string, unknown>) {
	io?.to(userRoom(userId)).emit("notification:new", payload);
	io?.to(userRoom(userId)).emit("activity", { userId, ...payload, type: "notification" });
}

export function emitPostEvent(type: "created" | "updated" | "deleted", payload: ActivityPayload) {
	io?.emit(`post:${type}`, payload);
	emitActivity({ ...payload, type: `post:${type}` });
}

export function emitCommentEvent(type: "created" | "deleted", payload: ActivityPayload) {
	if (payload.postId) {
		io?.to(postRoom(payload.postId)).emit(`comment:${type}`, payload);
	}
	emitActivity({ ...payload, type: `comment:${type}` });
}

export function emitLikeEvent(payload: ActivityPayload) {
	io?.emit("like:update", payload);
	emitActivity({ ...payload, type: "like:update" });
}

export function emitFollowEvent(payload: ActivityPayload) {
	io?.emit("follow:update", payload);
	emitActivity({ ...payload, type: "follow:update" });
}

export function emitAdminAnalytics(payload: Record<string, unknown>) {
	io?.emit("admin:analytics", payload);
}
