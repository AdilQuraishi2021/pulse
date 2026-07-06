import { createServerFn } from "@tanstack/react-start";
import { getGrpcClient, requireGrpcSessionToken } from "../../lib/grpc.server";

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

export const improvePostWithAi = createServerFn({ method: "POST" })
	.inputValidator((d: { text: string; type: AiPostType }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.ai.improvePost({
			sessionToken,
			text: data.text,
			type: data.type,
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to improve post");
		}

		return { text: response.text };
	});
