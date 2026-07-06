import { assertAiRateLimit } from "./ai-rate-limiter";
import { validateAiPostInput } from "./ai-validation";
import { improvePostWithOpenAi } from "./openai.service";

export async function improvePost(input: { text: string; type: string; userId: string }) {
	const validated = validateAiPostInput(input);
	assertAiRateLimit(input.userId);
	const text = await improvePostWithOpenAi(validated);
	return { text };
}
