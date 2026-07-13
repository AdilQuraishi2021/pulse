import { createServerFn } from "@tanstack/react-start";
import { fromProtoTimestamp, getAdminGrpcSessionToken, getGrpcClient } from "../../lib/grpc.server";
import {
	clearAdminSessionData,
	getAdminSessionData,
	setAdminSessionData,
} from "../../lib/session.server";

function errorMessage(error: unknown, fallback: string) {
	if (!(error instanceof Error)) {
		return fallback;
	}

	if (
		error.message.includes("ECONNREFUSED") ||
		error.message.includes("No connection established")
	) {
		return "Pulse API is not running. Start the API with `pnpm dev:api`, then try again.";
	}

	return error.message;
}

export const loginAdmin = createServerFn({ method: "POST" })
	.inputValidator((d: { email: string; password: string }) => d)
	.handler(async ({ data }) => {
		try {
			const client = getGrpcClient();

			// First, attempt to login
			const { response: loginResponse } = await client.auth.login({
				email: data.email,
				password: data.password,
			});

			if (!loginResponse.success) {
				throw new Error(loginResponse.error || "Login failed");
			}

			// Validate the session to get user details including role
			const { response: validateResponse } = await client.auth.validateSession({
				sessionToken: loginResponse.sessionToken,
			});

			if (!validateResponse.valid) {
				throw new Error("Failed to validate session");
			}

			// Check if user has admin or moderator role
			const role = validateResponse.role;
			if (role !== "admin" && role !== "moderator") {
				// Logout the session since they don't have admin access
				await client.auth.logout({ sessionToken: loginResponse.sessionToken });
				throw new Error("Access denied. Admin or moderator role required.");
			}

			// Store admin session in cookie
			await setAdminSessionData({
				userId: loginResponse.userId,
				username: validateResponse.username,
				role: role as "admin" | "moderator",
				sessionToken: loginResponse.sessionToken,
			});

			return { success: true, userId: loginResponse.userId, role };
		} catch (error) {
			throw new Error(errorMessage(error, "Login failed"));
		}
	});

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
	const sessionToken = await getAdminGrpcSessionToken();
	if (sessionToken) {
		const client = getGrpcClient();
		await client.auth.logout({ sessionToken });
	}
	await clearAdminSessionData();
	return { success: true };
});

export const getCurrentAdmin = createServerFn().handler(async () => {
	const session = await getAdminSessionData();
	if (!session) return null;

	const sessionToken = await getAdminGrpcSessionToken();
	if (!sessionToken) {
		await clearAdminSessionData();
		return null;
	}

	try {
		const client = getGrpcClient();
		const { response } = await client.auth.getCurrentUser({ sessionToken });

		// Double-check role from the server
		if (response.role !== "admin" && response.role !== "moderator") {
			await clearAdminSessionData();
			return null;
		}

		return {
			id: response.id,
			email: response.email,
			username: response.username,
			displayName: response.displayName,
			avatarUrl: response.avatarUrl,
			role: response.role as "admin" | "moderator",
			createdAt: fromProtoTimestamp(response.createdAt),
		};
	} catch {
		await clearAdminSessionData();
		return null;
	}
});

/**
 * Server function to check if user is authenticated as admin
 * Used by route guards
 */
export const checkAdminAuth = createServerFn().handler(async () => {
	const session = await getAdminSessionData();
	return {
		isAuthenticated: !!session,
		role: session?.role ?? null,
	};
});
