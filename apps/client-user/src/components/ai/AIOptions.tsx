import * as stylex from "@stylexjs/stylex";
import { Sparkles } from "lucide-react";
import type { AiPostType } from "../../server/functions/ai";
import { colors, radii, semanticColors, spacing } from "../../tokens.stylex";

export const AI_OPTIONS: Array<{ type: AiPostType; label: string }> = [
	{ type: "grammar", label: "Grammar" },
	{ type: "rewrite", label: "Rewrite" },
	{ type: "professional", label: "Professional" },
	{ type: "friendly", label: "Friendly" },
	{ type: "summarize", label: "Summarize" },
	{ type: "expand", label: "Expand" },
	{ type: "shorten", label: "Shorten" },
	{ type: "hashtags", label: "Hashtags" },
	{ type: "caption", label: "Caption" },
	{ type: "engagement", label: "Engagement" },
];

const styles = stylex.create({
	menu: {
		marginTop: spacing.md,
		padding: spacing.md,
		backgroundColor: semanticColors.bgSecondary,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
	},
	title: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		marginBottom: spacing.sm,
		color: semanticColors.textSecondary,
		fontSize: "0.8125rem",
		fontWeight: 700,
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
		gap: spacing.xs,
		"@media (min-width: 640px)": {
			gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
		},
	},
	option: {
		paddingBlock: spacing.sm,
		paddingInline: spacing.sm,
		borderRadius: radii.md,
		border: `1px solid ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.surfaceCard,
		color: semanticColors.textSecondary,
		cursor: "pointer",
		fontSize: "0.8125rem",
		fontWeight: 600,
		transition: "all 0.2s ease",
		":hover": {
			borderColor: colors.indigo500,
			color: colors.indigo500,
			backgroundColor: semanticColors.primaryLight,
		},
		":disabled": {
			opacity: 0.55,
			cursor: "not-allowed",
		},
	},
});

export function AIOptions({
	disabled,
	onSelect,
}: {
	disabled?: boolean;
	onSelect: (type: AiPostType) => void;
}) {
	return (
		<div {...stylex.props(styles.menu)}>
			<div {...stylex.props(styles.title)}>
				<Sparkles size={16} />
				AI writing tools
			</div>
			<div {...stylex.props(styles.grid)}>
				{AI_OPTIONS.map((option) => (
					<button
						key={option.type}
						type="button"
						disabled={disabled}
						onClick={() => onSelect(option.type)}
						{...stylex.props(styles.option)}
					>
						{option.label}
					</button>
				))}
			</div>
		</div>
	);
}
