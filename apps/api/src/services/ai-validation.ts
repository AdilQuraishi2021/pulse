export const AI_POST_TYPES = [
	"grammar",
	"rewrite",
	"summarize",
	"professional",
	"friendly",
	"expand",
	"shorten",
	"hashtags",
	"caption",
	"engagement",
] as const;

export type AiPostType = (typeof AI_POST_TYPES)[number];

const TYPE_LABELS: Record<AiPostType, string> = {
	grammar: "Grammar",
	rewrite: "Rewrite",
	summarize: "Summarize",
	professional: "Professional",
	friendly: "Friendly",
	expand: "Expand",
	shorten: "Shorten",
	hashtags: "Generate Hashtags",
	caption: "Generate Caption",
	engagement: "Improve Engagement",
};

export function isAiPostType(type: string): type is AiPostType {
	return AI_POST_TYPES.includes(type as AiPostType);
}

export function getAiPostTypeLabel(type: AiPostType): string {
	return TYPE_LABELS[type];
}

export function validateAiPostInput(input: { text: string; type: string }) {
	const text = input.text.trim();
	if (!text) {
		throw new Error("Text is required");
	}

	if (text.length > 2000) {
		throw new Error("Text must be 2,000 characters or less");
	}

	if (!isAiPostType(input.type)) {
		throw new Error("Unsupported AI action");
	}

	return { text, type: input.type };
}
