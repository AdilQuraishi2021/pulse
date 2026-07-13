import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Eye, FileText, MessageSquare, User, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { requireAdminAccess } from "../../lib/auth-guard";
import { listAdminReports, reviewAdminReport } from "../../server/functions/admin";
import { colors, radii, semanticColors, spacing } from "../../tokens.stylex";

const styles = stylex.create({
	container: {
		maxWidth: "1400px",
		marginInline: "auto",
		paddingInline: spacing.lg,
		paddingBlock: spacing.xl,
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: spacing.xl,
	},
	title: {
		fontSize: "1.875rem",
		fontWeight: 700,
		color: semanticColors.textPrimary,
	},
	tabs: {
		display: "flex",
		gap: spacing.sm,
	},
	tab: {
		paddingInline: spacing.md,
		paddingBlock: spacing.sm,
		borderRadius: radii.md,
		border: "none",
		backgroundColor: "transparent",
		color: semanticColors.textTertiary,
		fontSize: "0.875rem",
		fontWeight: 500,
		cursor: "pointer",
		":hover": {
			backgroundColor: semanticColors.bgSecondary,
			color: semanticColors.textPrimary,
		},
	},
	tabActive: {
		backgroundColor: semanticColors.bgSecondary,
		color: semanticColors.textPrimary,
	},
	reportsList: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.md,
	},
	reportCard: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
		overflow: "hidden",
	},
	reportHeader: {
		padding: spacing.md,
		backgroundColor: semanticColors.bgSecondary,
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	},
	reportInfo: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
	},
	reportBadge: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		paddingInline: spacing.sm,
		paddingBlock: "4px",
		borderRadius: radii.full,
		fontSize: "0.75rem",
		fontWeight: 500,
	},
	badgePost: {
		backgroundColor: colors.blue900,
		color: colors.blue400,
	},
	badgeComment: {
		backgroundColor: "#581c87",
		color: "#c084fc",
	},
	badgeUser: {
		backgroundColor: colors.green900,
		color: colors.green400,
	},
	reportId: {
		color: semanticColors.textTertiary,
		fontSize: "0.75rem",
	},
	reportStatus: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		fontSize: "0.75rem",
	},
	statusPending: {
		color: colors.yellow500,
	},
	statusResolved: {
		color: colors.green400,
	},
	statusDismissed: {
		color: semanticColors.textTertiary,
	},
	reportContent: {
		padding: spacing.lg,
	},
	reportReason: {
		marginBottom: spacing.md,
	},
	reasonLabel: {
		color: semanticColors.textTertiary,
		fontSize: "0.75rem",
		marginBottom: spacing.xs,
	},
	reasonText: {
		color: semanticColors.textPrimary,
		fontWeight: 500,
	},
	targetSection: {
		backgroundColor: semanticColors.bgSecondary,
		borderRadius: radii.md,
		padding: spacing.md,
		marginBottom: spacing.md,
	},
	targetHeader: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		marginBottom: spacing.sm,
	},
	targetLabel: {
		color: semanticColors.textTertiary,
		fontSize: "0.75rem",
	},
	targetContent: {
		color: semanticColors.textSecondary,
		fontSize: "0.875rem",
	},
	reportMeta: {
		display: "flex",
		alignItems: "center",
		gap: spacing.lg,
		color: semanticColors.textTertiary,
		fontSize: "0.75rem",
	},
	metaItem: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
	},
	reportFooter: {
		padding: spacing.md,
		borderTop: `1px solid ${semanticColors.borderSubtle}`,
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	},
	viewLink: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		color: colors.blue400,
		textDecoration: "none",
		fontSize: "0.875rem",
		":hover": {
			textDecoration: "underline",
		},
	},
	actions: {
		display: "flex",
		gap: spacing.sm,
	},
	actionButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		paddingInline: spacing.md,
		paddingBlock: spacing.sm,
		borderRadius: radii.md,
		border: "none",
		fontSize: "0.875rem",
		fontWeight: 500,
		cursor: "pointer",
	},
	resolveButton: {
		backgroundColor: colors.green600,
		color: colors.white,
		":hover": {
			backgroundColor: colors.green700,
		},
	},
	dismissButton: {
		backgroundColor: colors.slate700,
		color: colors.white,
		":hover": {
			backgroundColor: colors.slate600,
		},
	},
	emptyState: {
		textAlign: "center",
		color: semanticColors.textTertiary,
		paddingBlock: spacing.xl,
	},
});

export const Route = createFileRoute("/reports/")({
	beforeLoad: requireAdminAccess,
	component: ReportsPage,
});

interface AdminReport {
	id: string;
	targetType: "post" | "comment" | "user";
	targetId: string;
	reason: string;
	description: string | null;
	reporterUsername: string;
	status: "pending" | "reviewed" | "actioned" | "dismissed";
	createdAt: string;
}

function ReportsPage() {
	const [reports, setReports] = useState<AdminReport[]>([]);
	const [statusFilter, setStatusFilter] = useState("pending");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadReports = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await listAdminReports({ data: { statusFilter } });
			setReports(response.reports);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load reports");
		} finally {
			setIsLoading(false);
		}
	}, [statusFilter]);

	useEffect(() => {
		loadReports();
	}, [loadReports]);

	const counts = useMemo(
		() => ({
			pending: reports.filter((report) => report.status === "pending").length,
		}),
		[reports],
	);

	const handleReview = async (
		reportId: string,
		action: "dismiss" | "warn" | "remove_content" | "ban_user",
	) => {
		const notes =
			action === "dismiss"
				? "Dismissed from admin dashboard"
				: window.prompt("Moderation notes", "Reviewed from admin dashboard");
		if (!notes) return;
		try {
			await reviewAdminReport({ data: { reportId, action, notes } });
			await loadReports();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to review report");
		}
	};

	const getTargetIcon = (type: string) => {
		switch (type) {
			case "post":
				return FileText;
			case "comment":
				return MessageSquare;
			default:
				return User;
		}
	};

	const getTargetBadgeStyle = (type: string) => {
		switch (type) {
			case "post":
				return styles.badgePost;
			case "comment":
				return styles.badgeComment;
			default:
				return styles.badgeUser;
		}
	};

	const getStatusStyle = (status: string) => {
		switch (status) {
			case "resolved":
			case "actioned":
			case "reviewed":
				return styles.statusResolved;
			case "dismissed":
				return styles.statusDismissed;
			default:
				return styles.statusPending;
		}
	};

	const getTargetLink = (type: string, id: string) => {
		switch (type) {
			case "post":
				return { to: "/posts/$postId" as const, params: { postId: id } };
			case "user":
				return { to: "/users/$userId" as const, params: { userId: id } };
			default:
				return { to: "/posts/$postId" as const, params: { postId: id } };
		}
	};

	return (
		<main {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.header)}>
				<h1 {...stylex.props(styles.title)}>Reports</h1>
				<div {...stylex.props(styles.tabs)}>
					<button
						type="button"
						onClick={() => setStatusFilter("pending")}
						{...stylex.props(styles.tab, statusFilter === "pending" && styles.tabActive)}
					>
						Pending ({counts.pending})
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("actioned")}
						{...stylex.props(styles.tab, statusFilter === "actioned" && styles.tabActive)}
					>
						Actioned
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("dismissed")}
						{...stylex.props(styles.tab, statusFilter === "dismissed" && styles.tabActive)}
					>
						Dismissed
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("all")}
						{...stylex.props(styles.tab, statusFilter === "all" && styles.tabActive)}
					>
						All
					</button>
				</div>
			</header>

			<div {...stylex.props(styles.reportsList)}>
				{error && <p {...stylex.props(styles.emptyState)}>{error}</p>}
				{isLoading ? (
					<p {...stylex.props(styles.emptyState)}>Loading reports...</p>
				) : reports.length === 0 ? (
					<p {...stylex.props(styles.emptyState)}>No reports found.</p>
				) : (
					reports.map((report) => {
						const TargetIcon = getTargetIcon(report.targetType);
						const targetLink = getTargetLink(report.targetType, report.targetId);

						return (
							<article key={report.id} {...stylex.props(styles.reportCard)}>
								<div {...stylex.props(styles.reportHeader)}>
									<div {...stylex.props(styles.reportInfo)}>
										<span
											{...stylex.props(styles.reportBadge, getTargetBadgeStyle(report.targetType))}
										>
											<TargetIcon size={12} />
											{report.targetType}
										</span>
										<span {...stylex.props(styles.reportId)}>Report #{report.id}</span>
									</div>
									<div {...stylex.props(styles.reportStatus, getStatusStyle(report.status))}>
										<Clock size={12} />
										{report.status}
									</div>
								</div>

								<div {...stylex.props(styles.reportContent)}>
									<div {...stylex.props(styles.reportReason)}>
										<div {...stylex.props(styles.reasonLabel)}>Reason</div>
										<div {...stylex.props(styles.reasonText)}>{report.reason}</div>
									</div>

									<div {...stylex.props(styles.targetSection)}>
										<div {...stylex.props(styles.targetHeader)}>
											<TargetIcon size={14} />
											<span {...stylex.props(styles.targetLabel)}>
												Reported {report.targetType}
											</span>
										</div>
										<p {...stylex.props(styles.targetContent)}>
											{report.description || `Target ID: ${report.targetId}`}
										</p>
									</div>

									<div {...stylex.props(styles.reportMeta)}>
										<span {...stylex.props(styles.metaItem)}>
											<User size={12} />
											Reported by @{report.reporterUsername}
										</span>
										<span {...stylex.props(styles.metaItem)}>
											<Clock size={12} />
											{new Date(report.createdAt).toLocaleString()}
										</span>
									</div>
								</div>

								<div {...stylex.props(styles.reportFooter)}>
									<Link {...targetLink} {...stylex.props(styles.viewLink)}>
										<Eye size={14} />
										View {report.targetType}
									</Link>

									{report.status === "pending" && (
										<div {...stylex.props(styles.actions)}>
											<button
												type="button"
												onClick={() => handleReview(report.id, "dismiss")}
												{...stylex.props(styles.actionButton, styles.dismissButton)}
											>
												<X size={14} />
												Dismiss
											</button>
											<button
												type="button"
												onClick={() =>
													handleReview(
														report.id,
														report.targetType === "user" ? "ban_user" : "remove_content",
													)
												}
												{...stylex.props(styles.actionButton, styles.resolveButton)}
											>
												<Check size={14} />
												Take Action
											</button>
										</div>
									)}
								</div>
							</article>
						);
					})
				)}
			</div>
		</main>
	);
}
