import { createServerFn } from "@tanstack/react-start";
import { getGrpcClient, requireGrpcSessionToken } from "../../lib/grpc.server";

export type ReportTargetType = "post" | "comment" | "user";

export const createReport = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			targetType: ReportTargetType;
			targetId: string;
			reason: string;
			description?: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.reports.createReport({
			sessionToken,
			targetType: data.targetType,
			targetId: data.targetId,
			reason: data.reason,
			description: data.description || undefined,
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to create report");
		}

		return { success: true, reportId: response.reportId };
	});
