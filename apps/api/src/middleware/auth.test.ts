import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { createSessionToken, validateSessionToken } from "./auth";

describe("auth middleware", () => {
	it("accepts API-issued session tokens", () => {
		const token = createSessionToken({
			userId: "user-123",
			username: "alice",
			role: "user",
		});

		expect(validateSessionToken(token)).toEqual({
			userId: "user-123",
			username: "alice",
			role: "user",
		});
	});

	it("rejects tokens forged with the old published default secret", () => {
		const forgedToken = jwt.sign(
			{
				userId: "attacker",
				username: "attacker",
				role: "admin",
			},
			"chirp-grpc-jwt-secret-key-at-least-32-chars",
			{ expiresIn: 300 },
		);

		expect(() => validateSessionToken(forgedToken)).toThrow("Invalid or expired session token");
	});
});
