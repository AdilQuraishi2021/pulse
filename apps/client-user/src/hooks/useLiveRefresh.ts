import { useEffect, useRef } from "react";

export const LIVE_ACTIVITY_EVENT = "pulse:activity";

export function broadcastLiveActivity() {
	window.dispatchEvent(new Event(LIVE_ACTIVITY_EVENT));
}

export function useLiveRefresh(
	refresh: () => void | Promise<void>,
	{
		intervalMs = 5000,
		enabled = true,
	}: {
		intervalMs?: number;
		enabled?: boolean;
	} = {},
) {
	const refreshRef = useRef(refresh);
	const runningRef = useRef(false);

	useEffect(() => {
		refreshRef.current = refresh;
	}, [refresh]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const runRefresh = async () => {
			if (runningRef.current || document.visibilityState === "hidden") {
				return;
			}

			runningRef.current = true;
			try {
				await refreshRef.current();
			} finally {
				runningRef.current = false;
			}
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void runRefresh();
			}
		};

		const interval = window.setInterval(runRefresh, intervalMs);
		window.addEventListener("focus", runRefresh);
		window.addEventListener(LIVE_ACTIVITY_EVENT, runRefresh);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.clearInterval(interval);
			window.removeEventListener("focus", runRefresh);
			window.removeEventListener(LIVE_ACTIVITY_EVENT, runRefresh);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [enabled, intervalMs]);
}
