import type { IReportsService } from "@chirp/proto";
import { validateSessionToken } from "../../middleware/auth";
import { createReport, type ReportTargetType } from "../../services/reports.service";

export const reportsHandler: IReportsService = {
	async createReport(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await createReport({
				reporterId: auth.userId,
				targetType: request.targetType as ReportTargetType,
				targetId: request.targetId,
				reason: request.reason,
				description: request.description || undefined,
			});

			return {
				success: true,
				reportId: result.reportId,
			};
		} catch (error) {
			return {
				success: false,
				reportId: "",
				error: error instanceof Error ? error.message : "Failed to create report",
			};
		}
	},
};
