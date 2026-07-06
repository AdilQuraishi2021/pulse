import * as stylex from "@stylexjs/stylex";
import { Brain, Clock3, Flame, MapPin, Search, UsersRound } from "lucide-react";
import type { FeedMode } from "../../server/functions/feed";
import { colors, fontSize, fontWeight, radii, semanticColors, spacing } from "../../tokens.stylex";

const FEED_OPTIONS: Array<{
	type: FeedMode;
	label: string;
	icon: typeof Clock3;
	requiresFilter?: boolean;
	placeholder?: string;
}> = [
	{ type: "latest", label: "Latest", icon: Clock3 },
	{ type: "trending", label: "Trending", icon: Flame },
	{ type: "friends", label: "Friends", icon: UsersRound },
	{ type: "recommended", label: "For You", icon: Brain },
	{
		type: "topic",
		label: "Topic",
		icon: Search,
		requiresFilter: true,
		placeholder: "AI, cricket, movies",
	},
	{
		type: "industry",
		label: "Industry",
		icon: Search,
		requiresFilter: true,
		placeholder: "Developer, designer, doctor",
	},
	{
		type: "community",
		label: "Community",
		icon: UsersRound,
		requiresFilter: true,
		placeholder: "Community name",
	},
	{ type: "nearby", label: "Nearby", icon: MapPin },
];

const styles = stylex.create({
	wrapper: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.md,
		marginBottom: spacing["2xl"],
	},
	options: {
		display: "flex",
		gap: spacing.sm,
		overflowX: "auto",
		paddingBottom: spacing.xs,
	},
	button: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		minWidth: "6.5rem",
		height: "2.25rem",
		paddingLeft: spacing.md,
		paddingRight: spacing.md,
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: semanticColors.borderDefault,
		borderRadius: radii.lg,
		backgroundColor: semanticColors.bgPrimary,
		color: semanticColors.textSecondary,
		fontSize: fontSize.xs,
		fontWeight: fontWeight.semibold,
		cursor: "pointer",
		whiteSpace: "nowrap",
		transition: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
		":hover": {
			backgroundColor: semanticColors.bgHover,
			color: semanticColors.textPrimary,
		},
	},
	buttonActive: {
		backgroundColor: semanticColors.primaryLight,
		borderColor: semanticColors.borderFocus,
		color: semanticColors.primary,
	},
	inputRow: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
	},
	input: {
		width: "100%",
		height: "2.5rem",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: semanticColors.borderDefault,
		borderRadius: radii.lg,
		backgroundColor: semanticColors.surfaceInput,
		color: semanticColors.textPrimary,
		fontSize: fontSize.sm,
		paddingLeft: spacing.md,
		paddingRight: spacing.md,
		outline: "none",
		":focus": {
			borderColor: semanticColors.borderFocus,
			boxShadow: `0 0 0 3px ${colors.blueAlpha10}`,
		},
	},
});

export function FeedSelector({
	value,
	filter,
	onChange,
	onFilterChange,
}: {
	value: FeedMode;
	filter: string;
	onChange: (value: FeedMode) => void;
	onFilterChange: (value: string) => void;
}) {
	const selectedOption = FEED_OPTIONS.find((option) => option.type === value);

	return (
		<div {...stylex.props(styles.wrapper)}>
			<div {...stylex.props(styles.options)}>
				{FEED_OPTIONS.map((option) => {
					const Icon = option.icon;
					const active = value === option.type;
					return (
						<button
							type="button"
							key={option.type}
							onClick={() => onChange(option.type)}
							{...stylex.props(styles.button, active && styles.buttonActive)}
						>
							<Icon size={14} />
							{option.label}
						</button>
					);
				})}
			</div>

			{selectedOption?.requiresFilter && (
				<div {...stylex.props(styles.inputRow)}>
					<input
						value={filter}
						onChange={(event) => onFilterChange(event.target.value)}
						placeholder={selectedOption.placeholder}
						{...stylex.props(styles.input)}
					/>
				</div>
			)}
		</div>
	);
}
