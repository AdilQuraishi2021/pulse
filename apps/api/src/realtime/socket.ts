import { createServer } from "node:http";
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

const DEFAULT_CLIENT_ORIGINS = [
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	"http://localhost:3002",
	"http://127.0.0.1:3002",
];

function allowedClientOrigins() {
	const configuredOrigins = process.env.CLIENT_ORIGIN?.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);

	return configuredOrigins?.length ? configuredOrigins : DEFAULT_CLIENT_ORIGINS;
}

function setRealtimeCorsHeaders(
	requestOrigin: string | undefined,
	headers: Record<string, string>,
) {
	const origins = allowedClientOrigins();
	const allowedOrigin =
		process.env.NODE_ENV === "production"
			? origins.find((origin) => origin === requestOrigin)
			: requestOrigin || origins[0];

	if (allowedOrigin) {
		headers["Access-Control-Allow-Origin"] = allowedOrigin;
	}
	headers["Access-Control-Allow-Credentials"] = "true";
	headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS";
	headers["Access-Control-Allow-Headers"] = "Content-Type";
}

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
		io.emit(isOnline ? "user:online" : "user:offline", {
			userId,
			isOnline,
			lastSeen: isOnline ? undefined : new Date().toISOString(),
		});
	}
}

export function initializeSocketServer(port: number) {
	const origins = allowedClientOrigins();
	const httpServer = createServer((req, res) => {
		const headers: Record<string, string> = {};
		setRealtimeCorsHeaders(req.headers.origin, headers);

		if (req.method === "OPTIONS") {
			res.writeHead(204, headers);
			res.end();
			return;
		}

		if (req.url === "/health") {
			res.writeHead(200, {
				...headers,
				"Content-Type": "application/json",
			});
			res.end(JSON.stringify({ status: "ok", socket: true }));
			return;
		}

		res.writeHead(404, headers);
		res.end();
	});

	io = new Server(httpServer, {
		cors: {
			origin: process.env.NODE_ENV === "production" ? origins : true,
			methods: ["GET", "POST"],
			allowedHeaders: ["Content-Type"],
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
				socket.to(postRoom(postId)).emit("typing:start", { userId, postId });
			}
		});

		socket.on("typing:stop", ({ postId }: { postId?: string }) => {
			if (userId && postId) {
				socket.to(postRoom(postId)).emit("typing:update", { userId, postId, typing: false });
				socket.to(postRoom(postId)).emit("typing:stop", { userId, postId });
			}
		});

		socket.on(
			"chat:message",
			({ recipientId, message }: { recipientId?: string; message?: string }) => {
				if (userId && recipientId && message) {
					const payload = {
						senderId: userId,
						recipientId,
						message,
						createdAt: new Date().toISOString(),
					};
					io?.to(userRoom(recipientId)).emit("chat:message", payload);
					io?.to(userRoom(recipientId)).emit("message:new", payload);
				}
			},
		);

		socket.on("disconnect", () => {
			if (userId) {
				setUserPresence(userId, false);
			}
		});
	});

	httpServer.listen(port);
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
		io?.to(postRoom(payload.postId)).emit(
			type === "created" ? "comment:new" : "comment:delete",
			payload,
		);
	}
	emitActivity({ ...payload, type: `comment:${type}` });
}

export function emitLikeEvent(payload: ActivityPayload) {
	io?.emit("like:update", payload);
	io?.emit("reaction:update", payload);
	emitActivity({ ...payload, type: "like:update" });
}

export function emitFollowEvent(payload: ActivityPayload) {
	io?.emit("follow:update", payload);
	emitActivity({ ...payload, type: "follow:update" });
}

export function emitShareEvent(payload: ActivityPayload) {
	io?.emit("share:update", payload);
	emitActivity({ ...payload, type: "share:update" });
}

export function emitMessageEvent(userIds: string[], payload: Record<string, unknown>) {
	for (const userId of userIds) {
		io?.to(userRoom(userId)).emit("message:new", payload);
		io?.to(userRoom(userId)).emit("chat:message", payload);
	}
	emitActivity({ ...payload, type: "message:new" });
}

export function emitAdminAnalytics(payload: Record<string, unknown>) {
	io?.emit("admin:analytics", payload);
}
