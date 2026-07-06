import * as stylex from "@stylexjs/stylex";
import { Check, Copy, X } from "lucide-react";
import { colors, radii, semanticColors, spacing } from "../../tokens.stylex";

const styles = stylex.create({
	overlay: {
		position: "fixed",
		inset: 0,
		zIndex: 60,
		backgroundColor: "rgba(15, 23, 42, 0.35)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.lg,
	},
	dialog: {
		width: "min(100%, 36rem)",
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.xl,
		boxShadow: "0 20px 45px rgba(15, 23, 42, 0.24)",
		border: `1px solid ${semanticColors.borderSubtle}`,
		padding: spacing.lg,
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: spacing.md,
	},
	title: {
		fontSize: "1rem",
		fontWeight: 800,
		color: semanticColors.textPrimary,
	},
	closeButton: {
		border: "none",
		backgroundColor: "transparent",
		color: semanticColors.textTertiary,
		cursor: "pointer",
		padding: spacing.xs,
		borderRadius: radii.md,
		":hover": {
			backgroundColor: semanticColors.bgHover,
			color: semanticColors.textPrimary,
		},
	},
	textarea: {
		width: "100%",
		minHeight: "10rem",
		padding: spacing.md,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.surfaceInput,
		color: semanticColors.textPrimary,
		fontSize: "0.9375rem",
		lineHeight: 1.6,
		resize: "vertical",
		outline: "none",
	},
	footer: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
		marginTop: spacing.md,
		flexWrap: "wrap",
	},
	meta: {
		color: semanticColors.textTertiary,
		fontSize: "0.8125rem",
	},
	actions: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
	},
	secondaryButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.surfaceCard,
		color: semanticColors.textSecondary,
		cursor: "pointer",
		fontWeight: 600,
	},
	primaryButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		paddingBlock: spacing.sm,
		paddingInline: spacing.lg,
		borderRadius: radii.lg,
		border: "none",
		backgroundImage: `linear-gradient(135deg, ${colors.indigo500}, ${colors.blue600})`,
		color: colors.white,
		cursor: "pointer",
		fontWeight: 700,
	},
});

export function AIResultPopup({
	value,
	onChange,
	onClose,
	onCopy,
	onReplace,
}: {
	value: string;
	onChange: (value: string) => void;
	onClose: () => void;
	onCopy: () => void;
	onReplace: () => void;
}) {
	return (
		<div {...stylex.props(styles.overlay)} role="presentation">
			<div {...stylex.props(styles.dialog)} role="dialog" aria-modal="true" aria-label="AI result">
				<div {...stylex.props(styles.header)}>
					<div {...stylex.props(styles.title)}>AI suggestion</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close AI suggestion"
						{...stylex.props(styles.closeButton)}
					>
						<X size={18} />
					</button>
				</div>

				<textarea
					value={value}
					onChange={(event) => onChange(event.target.value)}
					{...stylex.props(styles.textarea)}
				/>

				<div {...stylex.props(styles.footer)}>
					<div {...stylex.props(styles.meta)}>{value.length}/280 characters</div>
					<div {...stylex.props(styles.actions)}>
						<button type="button" onClick={onCopy} {...stylex.props(styles.secondaryButton)}>
							<Copy size={16} />
							Copy
						</button>
						<button type="button" onClick={onReplace} {...stylex.props(styles.primaryButton)}>
							<Check size={16} />
							Replace
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
