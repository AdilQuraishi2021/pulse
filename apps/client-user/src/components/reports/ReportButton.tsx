import * as stylex from "@stylexjs/stylex";
import { Flag, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { createReport, type ReportTargetType } from "../../server/functions/reports";
import {
	colors,
	fontSize,
	fontWeight,
	radii,
	semanticColors,
	shadows,
	spacing,
} from "../../tokens.stylex";

const reportReasons = [
	"Spam or misleading",
	"Harassment or bullying",
	"Hate speech",
	"Violence or threats",
	"Sexual content",
	"Impersonation",
	"Other",
];

const styles = stylex.create({
	trigger: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		minHeight: "2rem",
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		borderRadius: radii.full,
		border: "none",
		backgroundColor: "transparent",
		color: semanticColors.textTertiary,
		fontSize: fontSize.sm,
		cursor: "pointer",
		":hover": {
			color: colors.red500,
			backgroundColor: semanticColors.errorLight,
		},
		":disabled": {
			opacity: 0.55,
			cursor: "not-allowed",
		},
	},
	triggerCompact: {
		width: "2rem",
		paddingLeft: 0,
		paddingRight: 0,
	},
	backdrop: {
		position: "fixed",
		inset: 0,
		zIndex: 1000,
		backgroundColor: "rgba(15, 23, 42, 0.68)",
		backdropFilter: "blur(6px)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.lg,
		overflowY: "auto",
	},
	dialog: {
		width: "100%",
		maxWidth: "28rem",
		maxHeight: "calc(100vh - 2rem)",
		backgroundColor: semanticColors.bgPrimary,
		border: `1px solid ${semanticColors.borderSubtle}`,
		borderRadius: radii.lg,
		boxShadow: shadows["2xl"],
		overflow: "hidden",
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: spacing.lg,
		borderBottom: `1px solid ${semanticColors.borderSubtle}`,
	},
	title: {
		fontSize: fontSize.lg,
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
	},
	closeButton: {
		border: "none",
		backgroundColor: "transparent",
		color: semanticColors.textTertiary,
		cursor: "pointer",
		borderRadius: radii.full,
		padding: spacing.xs,
		":hover": {
			backgroundColor: semanticColors.bgHover,
			color: semanticColors.textPrimary,
		},
	},
	form: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.md,
		padding: spacing.lg,
		maxHeight: "calc(100vh - 7rem)",
		overflowY: "auto",
	},
	field: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.xs,
	},
	label: {
		fontSize: fontSize.sm,
		fontWeight: fontWeight.semibold,
		color: semanticColors.textPrimary,
	},
	select: {
		width: "100%",
		minHeight: "2.75rem",
		border: `1px solid ${semanticColors.borderDefault}`,
		borderRadius: radii.md,
		backgroundColor: semanticColors.surfaceInput,
		color: semanticColors.textPrimary,
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,
		fontSize: fontSize.sm,
	},
	textarea: {
		width: "100%",
		minHeight: "6rem",
		resize: "vertical",
		border: `1px solid ${semanticColors.borderDefault}`,
		borderRadius: radii.md,
		backgroundColor: semanticColors.surfaceInput,
		color: semanticColors.textPrimary,
		padding: spacing.md,
		fontSize: fontSize.sm,
		lineHeight: 1.5,
		fontFamily: "inherit",
	},
	error: {
		color: colors.red500,
		fontSize: fontSize.sm,
	},
	success: {
		color: colors.green600,
		fontSize: fontSize.sm,
	},
	footer: {
		display: "flex",
		justifyContent: "flex-end",
		gap: spacing.sm,
		paddingTop: spacing.sm,
	},
	cancelButton: {
		border: `1px solid ${semanticColors.borderDefault}`,
		borderRadius: radii.full,
		backgroundColor: semanticColors.surfaceCard,
		color: semanticColors.textSecondary,
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,
		fontSize: fontSize.sm,
		cursor: "pointer",
	},
	submitButton: {
		border: "none",
		borderRadius: radii.full,
		backgroundColor: colors.red600,
		color: colors.white,
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.semibold,
		cursor: "pointer",
		":hover": {
			backgroundColor: colors.red700,
		},
		":disabled": {
			opacity: 0.6,
			cursor: "not-allowed",
		},
	},
	helperText: {
		color: semanticColors.textTertiary,
		fontSize: fontSize.sm,
		lineHeight: 1.5,
		margin: 0,
	},
});

interface ReportButtonProps {
	targetType: ReportTargetType;
	targetId: string;
	targetLabel?: string;
	compact?: boolean;
	disabled?: boolean;
}

export function ReportButton({
	targetType,
	targetId,
	targetLabel,
	compact = false,
	disabled = false,
}: ReportButtonProps) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState(reportReasons[0]);
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const label = targetLabel || targetType;
	const modalId = `${targetType}-${targetId}`;

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setLoading(true);
		setError(null);
		setMessage(null);

		try {
			await createReport({
				data: {
					targetType,
					targetId,
					reason,
					description: description.trim() || undefined,
				},
			});
			setMessage("Report submitted. Thank you for helping keep Pulse safe.");
			setDescription("");
			window.setTimeout(() => setOpen(false), 900);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit report");
		} finally {
			setLoading(false);
		}
	};

	const modal =
		open && typeof document !== "undefined"
			? createPortal(
					<div {...stylex.props(styles.backdrop)} role="presentation">
						<div
							{...stylex.props(styles.dialog)}
							role="dialog"
							aria-modal="true"
							aria-labelledby={`report-title-${modalId}`}
						>
							<div {...stylex.props(styles.header)}>
								<h2 id={`report-title-${modalId}`} {...stylex.props(styles.title)}>
									Report {label}
								</h2>
								<button
									type="button"
									onClick={() => setOpen(false)}
									{...stylex.props(styles.closeButton)}
								>
									<X size={18} />
								</button>
							</div>

							<form {...stylex.props(styles.form)} onSubmit={handleSubmit}>
								<p {...stylex.props(styles.helperText)}>
									Choose a reason and add context. Reports are sent to the moderation team.
								</p>

								<div {...stylex.props(styles.field)}>
									<label {...stylex.props(styles.label)} htmlFor={`report-reason-${modalId}`}>
										Reason
									</label>
									<select
										id={`report-reason-${modalId}`}
										value={reason}
										onChange={(event) => setReason(event.target.value)}
										{...stylex.props(styles.select)}
									>
										{reportReasons.map((option) => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</select>
								</div>

								<div {...stylex.props(styles.field)}>
									<label {...stylex.props(styles.label)} htmlFor={`report-description-${modalId}`}>
										Details
									</label>
									<textarea
										id={`report-description-${modalId}`}
										value={description}
										onChange={(event) => setDescription(event.target.value)}
										placeholder="Add context for the moderation team"
										{...stylex.props(styles.textarea)}
									/>
								</div>

								{error && <p {...stylex.props(styles.error)}>{error}</p>}
								{message && <p {...stylex.props(styles.success)}>{message}</p>}

								<div {...stylex.props(styles.footer)}>
									<button
										type="button"
										onClick={() => setOpen(false)}
										disabled={loading}
										{...stylex.props(styles.cancelButton)}
									>
										Cancel
									</button>
									<button type="submit" disabled={loading} {...stylex.props(styles.submitButton)}>
										{loading ? "Submitting..." : "Submit report"}
									</button>
								</div>
							</form>
						</div>
					</div>,
					document.body,
				)
			: null;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				disabled={disabled}
				title={`Report ${label}`}
				{...stylex.props(styles.trigger, compact && styles.triggerCompact)}
			>
				<Flag size={16} />
				{!compact && <span>Report</span>}
			</button>
			{modal}
		</>
	);
}
