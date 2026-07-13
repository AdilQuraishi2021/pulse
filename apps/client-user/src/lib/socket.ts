import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketUserId: string | null = null;
let availabilityCheck: Promise<boolean> | null = null;
let nextAvailabilityCheckAt = 0;

const AVAILABILITY_RETRY_MS = 5_000;

function socketUrl() {
	return import.meta.env.VITE_SOCKET_URL || "http://localhost:3003";
}

function socketHealthUrl() {
	return `${socketUrl().replace(/\/$/, "")}/health`;
}

async function isSocketServerAvailable() {
	const now = Date.now();

	if (availabilityCheck) {
		return availabilityCheck;
	}

	if (now < nextAvailabilityCheckAt) {
		return false;
	}

	availabilityCheck = fetch(socketHealthUrl(), {
		method: "GET",
		cache: "no-store",
	})
		.then((response) => response.ok)
		.catch(() => false)
		.finally(() => {
			availabilityCheck = null;
			nextAvailabilityCheckAt = Date.now() + AVAILABILITY_RETRY_MS;
		});

	return availabilityCheck;
}

function connectWhenAvailable(currentSocket: Socket) {
	void isSocketServerAvailable().then((available) => {
		if (available && socket === currentSocket && !currentSocket.connected) {
			currentSocket.connect();
		}
	});
}

export function getSocket(userId?: string | null) {
	if (typeof window === "undefined") {
		return null;
	}

	const requestedUserId = userId === undefined ? socketUserId : userId;

	if (socket && socketUserId === (requestedUserId ?? null)) {
		connectWhenAvailable(socket);
		return socket;
	}

	if (socket) {
		socket.disconnect();
	}

	socketUserId = requestedUserId ?? null;
	socket = io(socketUrl(), {
		auth: { userId: socketUserId },
		autoConnect: false,
		reconnection: true,
		reconnectionAttempts: 10,
		reconnectionDelay: 750,
		transports: ["websocket"],
		withCredentials: true,
	});
	connectWhenAvailable(socket);

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
