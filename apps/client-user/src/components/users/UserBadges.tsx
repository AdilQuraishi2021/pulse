import * as stylex from "@stylexjs/stylex";
import { Award, BadgeCheck, RefreshCw, Star, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getUserBadges, recalculateMyBadges } from "../../server/functions/social";
import { colors, fontSize, fontWeight, radii, semanticColors, spacing } from "../../tokens.stylex";
import { RelativeTime } from "../shared/RelativeTime";

type Badge = {
	id: string;
	code: string;
	name: string;
	description: string;
	awardedAt: Date;
};

const styles = stylex.create({
	section: {
		marginTop: spacing.lg,
		paddingTop: spacing.lg,
		borderTop: `1px solid ${semanticColors.borderSubtle}`,
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
		marginBottom: spacing.md,
	},
	title: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
	},
	refreshButton: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		width: "2rem",
		height: "2rem",
		borderRadius: radii.full,
		border: `1px solid ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.surfaceCard,
		color: semanticColors.textSecondary,
		cursor: "pointer",
		":hover": {
			backgroundColor: semanticColors.bgHover,
			color: semanticColors.primary,
		},
		":disabled": {
			opacity: 0.6,
			cursor: "not-allowed",
		},
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
		gap: spacing.sm,
	},
	badge: {
		display: "grid",
		gridTemplateColumns: "2rem 1fr",
		gap: spacing.sm,
		alignItems: "center",
		padding: spacing.md,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
		backgroundColor: semanticColors.bgTertiary,
		minWidth: 0,
	},
	iconWrap: {
		width: "2rem",
		height: "2rem",
		borderRadius: radii.full,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.indigoAlpha10,
		color: colors.indigo500,
	},
	badgeText: {
		minWidth: 0,
	},
	name: {
		fontSize: fontSize.sm,
		fontWeight: fontWeight.semibold,
		color: semanticColors.textPrimary,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
	description: {
		marginTop: "0.125rem",
		fontSize: fontSize.xs,
		color: semanticColors.textSecondary,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
	earned: {
		marginTop: spacing.xs,
		fontSize: fontSize.xs,
		color: semanticColors.textTertiary,
	},
	empty: {
		fontSize: fontSize.sm,
		color: semanticColors.textSecondary,
		padding: spacing.md,
		borderRadius: radii.lg,
		border: `1px dashed ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.bgTertiary,
	},
});

function BadgeIcon({ code }: { code: string }) {
	if (code.includes("developer")) return <BadgeCheck size={18} />;
	if (code.includes("leader") || code.includes("top")) return <Trophy size={18} />;
	if (code.includes("rising")) return <Star size={18} />;
	return <Award size={18} />;
}

export function UserBadges({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
	const [badges, setBadges] = useState<Badge[]>([]);
	const [loading, setLoading] = useState(false);

	const loadBadges = useCallback(async () => {
		const result = await getUserBadges({ data: userId });
		setBadges(result);
	}, [userId]);

	useEffect(() => {
		void loadBadges();
	}, [loadBadges]);

	const handleRefresh = async () => {
		setLoading(true);
		try {
			const result = await recalculateMyBadges();
			setBadges(result);
		} finally {
			setLoading(false);
		}
	};

	return (
		<section {...stylex.props(styles.section)}>
			<div {...stylex.props(styles.header)}>
				<div {...stylex.props(styles.title)}>
					<Award size={16} />
					<span>Achievements</span>
				</div>
				{isOwnProfile && (
					<button
						type="button"
						onClick={handleRefresh}
						disabled={loading}
						{...stylex.props(styles.refreshButton)}
						title="Refresh badges"
					>
						<RefreshCw size={15} />
					</button>
				)}
			</div>

			{badges.length > 0 ? (
				<div {...stylex.props(styles.grid)}>
					{badges.map((badge) => (
						<div key={badge.id} {...stylex.props(styles.badge)} title={badge.description}>
							<div {...stylex.props(styles.iconWrap)}>
								<BadgeIcon code={badge.code} />
							</div>
							<div {...stylex.props(styles.badgeText)}>
								<div {...stylex.props(styles.name)}>{badge.name}</div>
								<div {...stylex.props(styles.description)}>{badge.description}</div>
								<div {...stylex.props(styles.earned)}>
									<RelativeTime date={badge.awardedAt} />
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div {...stylex.props(styles.empty)}>No achievements earned yet.</div>
			)}
		</section>
	);
}
