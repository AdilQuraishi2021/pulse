import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { broadcastLiveActivity } from "../../hooks/useLiveRefresh";
import { getSocket } from "../../lib/socket";
import { getCurrentUser } from "../../server/functions/auth";

const REFRESH_EVENTS = ["activity", "notification:new", "chat:message", "admin:analytics"] as const;

export function SocketActivityBridge() {
	const location = useLocation();

	useEffect(() => {
		if (location.pathname.startsWith("/auth/")) {
			return;
		}

		let mounted = true;
		let cleanup: (() => void) | undefined;

		const connect = async () => {
			const user = await getCurrentUser();
			if (!mounted) {
				return;
			}

			if (!user?.id) {
				return;
			}

			const socket = getSocket(user.id);
			if (!socket) {
				return;
			}

			const handleRefresh = () => {
				broadcastLiveActivity();
			};

			for (const eventName of REFRESH_EVENTS) {
				socket.on(eventName, handleRefresh);
			}

			cleanup = () => {
				for (const eventName of REFRESH_EVENTS) {
					socket.off(eventName, handleRefresh);
				}
			};
		};

		void connect();

		return () => {
			mounted = false;
			cleanup?.();
		};
	}, [location.pathname]);

	return null;
}
