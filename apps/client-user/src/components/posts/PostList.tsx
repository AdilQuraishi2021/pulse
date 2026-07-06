import * as stylex from "@stylexjs/stylex";
import { FileText } from "lucide-react";
import {
	colors,
	fontSize,
	fontWeight,
	radii,
	semanticColors,
	shadows,
	spacing,
} from "../../tokens.stylex";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { PostCard } from "./PostCard";

const fadeInUp = stylex.keyframes({
	from: {
		opacity: 0,
		transform: "translateY(10px)",
	},
	to: {
		opacity: 1,
		transform: "translateY(0)",
	},
});

const styles = stylex.create({
	loadingContainer: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		paddingTop: spacing.xl,
		paddingBottom: spacing.xl,
	},
	emptyState: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
		boxShadow: shadows.card,
		padding: spacing["3xl"],
		textAlign: "center",
	},
	emptyIcon: {
		width: "3.5rem",
		height: "3.5rem",
		borderRadius: radii.lg,
		backgroundColor: semanticColors.primaryLight,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		marginLeft: "auto",
		marginRight: "auto",
		marginBottom: spacing.md,
	},
	emptyTitle: {
		fontSize: fontSize.base,
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
		marginBottom: spacing.sm,
	},
	emptyText: {
		color: semanticColors.textSecondary,
		fontSize: fontSize.sm,
	},
	postList: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.md,
	},
	postItem: {
		animationName: fadeInUp,
		animationDuration: "0.3s",
		animationFillMode: "both",
	},
});

export interface Post {
	id: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	author: {
		id: string;
		username: string;
		displayName: string;
		avatarUrl?: string | null;
	};
	likeCount: number;
	commentCount: number;
	isLiked?: boolean;
}

export function PostList({
	posts,
	loading,
	currentUserId,
	onPostDelete,
}: {
	posts: Post[];
	loading?: boolean;
	currentUserId?: string;
	onPostDelete?: () => void;
}) {
	if (loading) {
		return (
			<div {...stylex.props(styles.loadingContainer)}>
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (posts.length === 0) {
		return (
			<div {...stylex.props(styles.emptyState)}>
				<div {...stylex.props(styles.emptyIcon)}>
					<FileText size={28} color={colors.indigo500} />
				</div>
				<h3 {...stylex.props(styles.emptyTitle)}>No posts yet</h3>
				<p {...stylex.props(styles.emptyText)}>Fresh posts will appear here.</p>
			</div>
		);
	}

	return (
		<div {...stylex.props(styles.postList)}>
			{posts.map((post, index) => (
				<div
					key={post.id}
					style={{ animationDelay: `${index * 50}ms` }}
					{...stylex.props(styles.postItem)}
				>
					<PostCard post={post} currentUserId={currentUserId} onDelete={onPostDelete} />
				</div>
			))}
		</div>
	);
}
