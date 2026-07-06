import type { IAiService } from "@chirp/proto";
import { validateSessionToken } from "../../middleware/auth";
import { improvePost } from "../../services/ai.service";

export const aiHandler: IAiService = {
	async improvePost(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await improvePost({
				text: request.text,
				type: request.type,
				userId: auth.userId,
			});

			return {
				success: true,
				text: result.text,
			};
		} catch (error) {
			return {
				success: false,
				text: "",
				error: error instanceof Error ? error.message : "Failed to improve post",
			};
		}
	},
};
