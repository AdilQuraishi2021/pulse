import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { improvePost } from "./ai.service";
import { resetAiRateLimits } from "./ai-rate-limiter";
import { validateAiPostInput } from "./ai-validation";

const originalGeminiKey = process.env.GEMINI_API_KEY;

describe("AiService", () => {
	beforeEach(() => {
		resetAiRateLimits();
		process.env.GEMINI_API_KEY = "test-key";
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({
				ok: true,
				json: async () => ({
					steps: [
						{
							content: [{ type: "text", text: "Improved post" }],
							type: "model_output",
						},
					],
				}),
			})),
		);
	});

	afterEach(() => {
		resetAiRateLimits();
		vi.unstubAllGlobals();
		if (originalGeminiKey) {
			process.env.GEMINI_API_KEY = originalGeminiKey;
		} else {
			delete process.env.GEMINI_API_KEY;
		}
	});

	it("validates supported AI post types", () => {
		expect(validateAiPostInput({ text: "Hello", type: "grammar" })).toEqual({
			text: "Hello",
			type: "grammar",
		});
	});

	it("rejects unsupported AI post types", () => {
		expect(() => validateAiPostInput({ text: "Hello", type: "poem" })).toThrow(
			"Unsupported AI action",
		);
	});

	it("rejects empty text", () => {
		expect(() => validateAiPostInput({ text: "   ", type: "grammar" })).toThrow("Text is required");
	});

	it("returns improved text from Gemini", async () => {
		const result = await improvePost({
			text: "Today i go office and working.",
			type: "grammar",
			userId: "user-1",
		});

		expect(result.text).toBe("Improved post");
		expect(fetch).toHaveBeenCalledWith(
			"https://generativelanguage.googleapis.com/v1beta/interactions",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					"x-goog-api-key": "test-key",
				}),
			}),
		);
	});

	it("limits users to 10 AI requests per minute", async () => {
		for (let index = 0; index < 10; index++) {
			await improvePost({
				text: `Post ${index}`,
				type: "rewrite",
				userId: "limited-user",
			});
		}

		await expect(
			improvePost({
				text: "One more",
				type: "rewrite",
				userId: "limited-user",
			}),
		).rejects.toThrow("AI request limit reached");
	});

	it("requires a Gemini API key", async () => {
		delete process.env.GEMINI_API_KEY;

		await expect(
			improvePost({
				text: "Hello",
				type: "friendly",
				userId: "user-1",
			}),
		).rejects.toThrow("GEMINI_API_KEY is required");
	});
});
