import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CommentCard } from "../../components/comments/CommentCard";
import { CommentForm } from "../../components/comments/CommentForm";
import { PostCard } from "../../components/posts/PostCard";
import { LoadingSpinner } from "../../components/shared/LoadingSpinner";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import { getCurrentUser } from "../../server/functions/auth";
import { getPostComments } from "../../server/functions/comments";
import { getPost } from "../../server/functions/posts";
import {
	colors,
	fontSize,
	fontWeight,
	radii,
	semanticColors,
	shadows,
	spacing,
} from "../../tokens.stylex";

export const Route = createFileRoute("/posts/$postId")({
	component: PostPage,
});

type DetailUser = {
	id: string;
	username: string;
	displayName: string;
	avatarUrl?: string | null;
};

type DetailPost = {
	id: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	author: DetailUser;
	likeCount: number;
	commentCount: number;
	isLiked?: boolean;
};

type DetailComment = {
	id: string;
	content: string;
	createdAt: Date;
	author: DetailUser;
	replies?: DetailComment[];
};

const styles = stylex.create({
	container: {
		maxWidth: "44rem",
		marginLeft: "auto",
		marginRight: "auto",
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
		paddingTop: spacing["2xl"],
		paddingBottom: spacing["3xl"],
	},
	loadingShell: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "20rem",
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
		marginBottom: spacing["2xl"],
	},
	headerLeft: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
		minWidth: 0,
	},
	backLink: {
		width: "2.5rem",
		height: "2.5rem",
		borderRadius: radii.lg,
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		color: semanticColors.textSecondary,
		backgroundColor: semanticColors.surfaceCard,
		border: `1px solid ${semanticColors.borderSubtle}`,
		boxShadow: shadows.sm,
		textDecoration: "none",
		flexShrink: 0,
		":hover": {
			color: semanticColors.primary,
			borderColor: semanticColors.borderFocus,
			transform: "translateX(-1px)",
		},
	},
	title: {
		fontSize: fontSize.xl,
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
		letterSpacing: "0",
	},
	subtitle: {
		fontSize: fontSize.sm,
		color: semanticColors.textSecondary,
		marginTop: spacing.xs,
	},
	contextPill: {
		display: "none",
		alignItems: "center",
		gap: spacing.xs,
		paddingLeft: spacing.md,
		paddingRight: spacing.md,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		borderRadius: radii.full,
		backgroundColor: semanticColors.primaryLight,
		color: semanticColors.primary,
		fontSize: fontSize.xs,
		fontWeight: fontWeight.bold,
		"@media (min-width: 640px)": {
			display: "inline-flex",
		},
	},
	postWrap: {
		marginBottom: spacing["2xl"],
	},
	commentsPanel: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
		boxShadow: shadows.card,
		overflow: "hidden",
	},
	commentsHeader: {
		padding: spacing.lg,
		borderBottom: `1px solid ${semanticColors.borderSubtle}`,
	},
	commentsTitleRow: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
	},
	commentsIcon: {
		width: "2.5rem",
		height: "2.5rem",
		borderRadius: radii.lg,
		backgroundImage: `linear-gradient(135deg, ${colors.indigo500}, ${colors.cyan500})`,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: colors.white,
		boxShadow: shadows.indigoSm,
		flexShrink: 0,
	},
	commentsTitle: {
		fontSize: fontSize.base,
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
	},
	commentsMeta: {
		fontSize: fontSize.sm,
		color: semanticColors.textSecondary,
		marginTop: spacing.xs,
	},
	loginPrompt: {
		marginTop: spacing.lg,
		padding: spacing.md,
		borderRadius: radii.lg,
		backgroundColor: semanticColors.bgTertiary,
		border: `1px solid ${semanticColors.borderSubtle}`,
		textAlign: "center",
		color: semanticColors.textSecondary,
		fontSize: fontSize.sm,
	},
	loginLink: {
		color: semanticColors.primary,
		fontWeight: fontWeight.bold,
		textDecoration: "none",
		":hover": {
			textDecoration: "underline",
		},
	},
	commentsList: {
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
	},
	replyWrap: {
		marginLeft: spacing["2xl"],
		paddingLeft: spacing.lg,
		borderLeft: `2px solid ${semanticColors.borderSubtle}`,
	},
	emptyState: {
		paddingTop: spacing["4xl"],
		paddingBottom: spacing["4xl"],
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
		marginBottom: spacing.lg,
		color: semanticColors.primary,
	},
	emptyTitle: {
		fontSize: fontSize.base,
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
		marginBottom: spacing.xs,
	},
	emptyText: {
		fontSize: fontSize.sm,
		color: semanticColors.textSecondary,
	},
	notFoundCard: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
		boxShadow: shadows.card,
		padding: spacing["4xl"],
		textAlign: "center",
	},
	notFoundIcon: {
		width: "4rem",
		height: "4rem",
		borderRadius: radii.lg,
		backgroundColor: semanticColors.errorLight,
		color: semanticColors.error,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		marginLeft: "auto",
		marginRight: "auto",
		marginBottom: spacing.lg,
	},
	homeButton: {
		display: "inline-flex",
		alignItems: "center",
		gap: spacing.sm,
		marginTop: spacing.xl,
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		borderRadius: radii.lg,
		backgroundColor: semanticColors.primary,
		color: colors.white,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.bold,
		textDecoration: "none",
		boxShadow: shadows.indigoSm,
		":hover": {
			backgroundColor: semanticColors.primaryActive,
			transform: "translateY(-1px)",
		},
	},
});

function PostPage() {
	const { postId } = Route.useParams();
	const [post, setPost] = useState<DetailPost | null>(null);
	const [comments, setComments] = useState<DetailComment[]>([]);
	const [user, setUser] = useState<{ id: string } | null>(null);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(
		async (options: { silent?: boolean } = {}) => {
			try {
				if (!options.silent) {
					setLoading(true);
				}
				const [currentUser, postData, commentsData] = await Promise.all([
					getCurrentUser(),
					getPost({ data: postId }),
					getPostComments({ data: postId }),
				]);
				setUser(currentUser);
				setPost(postData as DetailPost);
				setComments(commentsData as DetailComment[]);
			} catch (error) {
				console.error("Failed to load post:", error);
				setPost(null);
				setComments([]);
			} finally {
				setLoading(false);
			}
		},
		[postId],
	);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useLiveRefresh(() => loadData({ silent: true }), { intervalMs: 5000, enabled: Boolean(post) });

	if (loading) {
		return (
			<div {...stylex.props(styles.container, styles.loadingShell)}>
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (!post) {
		return (
			<div {...stylex.props(styles.container)}>
				<div {...stylex.props(styles.notFoundCard)}>
					<div {...stylex.props(styles.notFoundIcon)}>
						<AlertCircle size={32} />
					</div>
					<h3 {...stylex.props(styles.emptyTitle)}>Post not found</h3>
					<p {...stylex.props(styles.emptyText)}>
						This post may have been deleted or never existed.
					</p>
					<Link to="/" {...stylex.props(styles.homeButton)}>
						<ArrowLeft size={16} />
						Back to Home
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.header)}>
				<div {...stylex.props(styles.headerLeft)}>
					<Link to="/" {...stylex.props(styles.backLink)} title="Back to feed">
						<ArrowLeft size={20} />
					</Link>
					<div>
						<h1 {...stylex.props(styles.title)}>Post</h1>
						<p {...stylex.props(styles.subtitle)}>Read the full post and join the conversation.</p>
					</div>
				</div>
				<div {...stylex.props(styles.contextPill)}>
					<MessageCircle size={14} />
					{comments.length}
				</div>
			</header>

			<div {...stylex.props(styles.postWrap)}>
				<PostCard post={post} currentUserId={user?.id} onDelete={() => window.history.back()} />
			</div>

			<section {...stylex.props(styles.commentsPanel)}>
				<div {...stylex.props(styles.commentsHeader)}>
					<div {...stylex.props(styles.commentsTitleRow)}>
						<div {...stylex.props(styles.commentsIcon)}>
							<MessageCircle size={20} />
						</div>
						<div>
							<h2 {...stylex.props(styles.commentsTitle)}>Conversation</h2>
							<p {...stylex.props(styles.commentsMeta)}>
								{comments.length} {comments.length === 1 ? "comment" : "comments"}
							</p>
						</div>
					</div>

					{user ? (
						<CommentForm postId={postId} onSuccess={loadData} />
					) : (
						<div {...stylex.props(styles.loginPrompt)}>
							<Link to="/auth/login" {...stylex.props(styles.loginLink)}>
								Sign in
							</Link>{" "}
							to leave a comment.
						</div>
					)}
				</div>

				<div {...stylex.props(styles.commentsList)}>
					{comments.length === 0 ? (
						<div {...stylex.props(styles.emptyState)}>
							<div {...stylex.props(styles.emptyIcon)}>
								<MessageCircle size={26} />
							</div>
							<h3 {...stylex.props(styles.emptyTitle)}>No comments yet</h3>
							<p {...stylex.props(styles.emptyText)}>
								Start the conversation with a thoughtful reply.
							</p>
						</div>
					) : (
						comments.map((comment) => (
							<div key={comment.id}>
								<CommentCard comment={comment} currentUserId={user?.id} onDelete={loadData} />
								{comment.replies?.map((reply) => (
									<div key={reply.id} {...stylex.props(styles.replyWrap)}>
										<CommentCard comment={reply} currentUserId={user?.id} onDelete={loadData} />
									</div>
								))}
							</div>
						))
					)}
				</div>
			</section>
		</div>
	);
}
