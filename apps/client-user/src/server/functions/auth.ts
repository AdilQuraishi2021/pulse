import { createServerFn } from "@tanstack/react-start";
import { fromProtoTimestamp, getGrpcClient, getGrpcSessionToken } from "../../lib/grpc.server";
import { clearSessionData, getSessionData, setSessionData } from "../../lib/session.server";

function errorMessage(error: unknown, fallback: string) {
	if (!(error instanceof Error)) {
		return fallback;
	}

	if (isApiUnavailableError(error)) {
		return "Pulse API is not running. Start the API with `pnpm dev:api`, then try again.";
	}

	return error.message;
}

function isApiUnavailableError(error: unknown) {
	return (
		error instanceof Error &&
		(error.message.includes("ECONNREFUSED") ||
			error.message.includes("No connection established") ||
			error.message.includes("Connection dropped"))
	);
}

function isInvalidSessionError(error: unknown) {
	return (
		error instanceof Error &&
		(error.message.includes("Authentication required") ||
			error.message.includes("Invalid or expired session token") ||
			error.message.includes("Unauthorized"))
	);
}

export const registerUser = createServerFn({ method: "POST" })
	.inputValidator(
		(d: { email: string; username: string; displayName: string; password: string }) => d,
	)
	.handler(async ({ data }) => {
		try {
			const client = getGrpcClient();

			const { response } = await client.auth.register({
				email: data.email,
				username: data.username,
				displayName: data.displayName,
				password: data.password,
			});

			if (!response.success) {
				return { success: false, error: response.error || "Registration failed" };
			}

			// Store session in cookie
			await setSessionData({
				userId: response.userId,
				username: data.username,
				sessionToken: response.sessionToken,
			});

			return { success: true, userId: response.userId };
		} catch (error) {
			return { success: false, error: errorMessage(error, "Registration failed") };
		}
	});

export const loginUser = createServerFn({ method: "POST" })
	.inputValidator((d: { email: string; password: string }) => d)
	.handler(async ({ data }) => {
		try {
			const client = getGrpcClient();

			const { response } = await client.auth.login({
				email: data.email,
				password: data.password,
			});

			if (!response.success) {
				return { success: false, error: response.error || "Login failed" };
			}

			// We need to get the username for the session - validate the returned token
			const { response: validateResponse } = await client.auth.validateSession({
				sessionToken: response.sessionToken,
			});

			if (!validateResponse.valid) {
				return { success: false, error: "Failed to validate session" };
			}

			// Store session in cookie
			await setSessionData({
				userId: response.userId,
				username: validateResponse.username,
				sessionToken: response.sessionToken,
			});

			return { success: true, userId: response.userId };
		} catch (error) {
			return { success: false, error: errorMessage(error, "Login failed") };
		}
	});

export const logoutUser = createServerFn({ method: "POST" }).handler(async () => {
	try {
		const sessionToken = await getGrpcSessionToken();
		if (sessionToken) {
			const client = getGrpcClient();
			await client.auth.logout({ sessionToken });
		}
	} catch {
		// Logging out should still clear the local cookie if the API is unavailable.
	}
	await clearSessionData();
	return { success: true };
});

export const getCurrentUser = createServerFn().handler(async () => {
	const session = await getSessionData();
	if (!session) return null;

	try {
		const sessionToken = await getGrpcSessionToken();
		if (!sessionToken) {
			await clearSessionData();
			return null;
		}

		const client = getGrpcClient();
		const { response } = await client.auth.getCurrentUser({ sessionToken });

		return {
			id: response.id,
			email: response.email,
			username: response.username,
			displayName: response.displayName,
			avatarUrl: response.avatarUrl,
			bio: response.bio,
			role: response.role,
			createdAt: fromProtoTimestamp(response.createdAt),
		};
	} catch (error) {
		if (isApiUnavailableError(error)) {
			return {
				id: session.userId,
				email: "",
				username: session.username,
				displayName: session.username,
				avatarUrl: undefined,
				bio: undefined,
				role: "user",
				createdAt: new Date(),
			};
		}

		if (isInvalidSessionError(error)) {
			try {
				await clearSessionData();
			} catch {
				// Ignore cookie cleanup failures; the caller can continue unauthenticated.
			}
		}
		return null;
	}
});
