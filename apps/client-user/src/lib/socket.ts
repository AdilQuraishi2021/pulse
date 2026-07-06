import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketUserId: string | null = null;

function socketUrl() {
	return import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
}

export function getSocket(userId?: string | null) {
	if (typeof window === "undefined") {
		return null;
	}

	const requestedUserId = userId === undefined ? socketUserId : userId;

	if (socket && socketUserId === (requestedUserId ?? null)) {
		return socket;
	}

	if (socket) {
		socket.disconnect();
	}

	socketUserId = requestedUserId ?? null;
	socket = io(socketUrl(), {
		auth: { userId: socketUserId },
		autoConnect: true,
		reconnection: true,
		reconnectionAttempts: 10,
		reconnectionDelay: 750,
		transports: ["websocket", "polling"],
		withCredentials: true,
	});

	return socket;
}

export function disconnectSocket() {
	socket?.disconnect();
	socket = null;
	socketUserId = null;
}

export function joinPostRoom(postId: string) {
	getSocket()?.emit("post:join", { postId });
}

export function leavePostRoom(postId: string) {
	getSocket()?.emit("post:leave", { postId });
}

export function startTyping(postId: string) {
	getSocket()?.emit("typing:start", { postId });
}

export function stopTyping(postId: string) {
	getSocket()?.emit("typing:stop", { postId });
}
