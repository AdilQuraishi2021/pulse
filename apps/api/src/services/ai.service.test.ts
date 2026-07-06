import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { improvePost } from "./ai.service";
import { resetAiRateLimits } from "./ai-rate-limiter";
import { validateAiPostInput } from "./ai-validation";

const originalOpenAiKey = process.env.OPENAI_API_KEY;

describe("AiService", () => {
	beforeEach(() => {
		resetAiRateLimits();
		process.env.OPENAI_API_KEY = "test-key";
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({
				ok: true,
				json: async () => ({ output_text: "Improved post" }),
			})),
		);
	});

	afterEach(() => {
		resetAiRateLimits();
		vi.unstubAllGlobals();
		if (originalOpenAiKey) {
			process.env.OPENAI_API_KEY = originalOpenAiKey;
		} else {
			delete process.env.OPENAI_API_KEY;
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

	it("returns improved text from OpenAI", async () => {
		const result = await improvePost({
			text: "Today i go office and working.",
			type: "grammar",
			userId: "user-1",
		});

		expect(result.text).toBe("Improved post");
		expect(fetch).toHaveBeenCalledWith(
			"https://api.openai.com/v1/responses",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer test-key",
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

	it("requires an OpenAI API key", async () => {
		delete process.env.OPENAI_API_KEY;

		await expect(
			improvePost({
				text: "Hello",
				type: "friendly",
				userId: "user-1",
			}),
		).rejects.toThrow("OPENAI_API_KEY is required");
	});
});
