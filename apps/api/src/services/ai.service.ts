import { assertAiRateLimit } from "./ai-rate-limiter";
import { validateAiPostInput } from "./ai-validation";
import { improvePostWithGemini } from "./gemini.service";

export async function improvePost(input: { text: string; type: string; userId: string }) {
	const validated = validateAiPostInput(input);
	assertAiRateLimit(input.userId);
	const text = await improvePostWithGemini(validated);
	return { text };
}
