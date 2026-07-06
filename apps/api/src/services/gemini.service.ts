import "./../env";
import type { AiPostType } from "./ai-validation";

interface GeminiInteractionResult {
	output_text?: string;
	steps?: Array<{
		content?: Array<{
			type?: string;
			text?: string;
		}>;
	}>;
	error?: {
		message?: string;
	};
}

const DEFAULT_MODEL = "gemini-3.5-flash";
const GEMINI_TIMEOUT_MS = 20_000;

const SYSTEM_PROMPT =
	"You are Pulse's writing assistant. Return only the improved social media post text. Do not wrap the answer in quotes or add commentary.";

const PROMPTS: Record<AiPostType, string> = {
	grammar: "Correct grammar and spelling without changing the meaning.",
	rewrite: "Rewrite this social media post to be clearer and more engaging. Maximum 120 words.",
	summarize: "Summarize this post into a concise social media post. Keep the core message.",
	professional: "Rewrite this post in a professional tone while keeping it natural.",
	friendly: "Rewrite this post in a warm, friendly tone while keeping the meaning.",
	expand: "Expand this into a richer social media post with helpful detail. Maximum 180 words.",
	shorten: "Shorten this into a crisp social media post without losing the main idea.",
	hashtags: "Generate 5 to 8 relevant hashtags for this post. Return only hashtags.",
	caption: "Generate a polished social media caption based on this text. Maximum 80 words.",
	engagement:
		"Improve this post to encourage engagement while staying authentic. Maximum 120 words.",
};

function extractText(data: GeminiInteractionResult) {
	if (data.output_text) {
		return data.output_text.trim();
	}

	const text = data.steps
		?.flatMap((step) => step.content ?? [])
		.map((content) => content.text)
		.filter(Boolean)
		.join("\n")
		.trim();

	return text || "";
}

export async function improvePostWithGemini(input: { text: string; type: AiPostType }) {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error("GEMINI_API_KEY is required to use AI writing tools");
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

	try {
		const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
			method: "POST",
			headers: {
				"x-goog-api-key": apiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
				system_instruction: SYSTEM_PROMPT,
				input: `${PROMPTS[input.type]}\n\nText:\n${input.text}`,
				generation_config: {
					temperature: 0.7,
				},
			}),
			signal: controller.signal,
		});

		const data = (await response.json()) as GeminiInteractionResult;
		if (!response.ok) {
			throw new Error(data.error?.message || "Gemini request failed");
		}

		const text = extractText(data);
		if (!text) {
			throw new Error("Gemini returned an empty response");
		}

		return text;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error("AI request timed out. Please try again.");
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}
