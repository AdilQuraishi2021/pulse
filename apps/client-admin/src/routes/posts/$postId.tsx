import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Heart, MessageSquare, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { requireAdminAccess } from "../../lib/auth-guard";
import {
	type AdminComment,
	deleteAdminComment,
	deleteAdminPost,
	getAdminPost,
	getAdminPostComments,
	listAdminReports,
} from "../../server/functions/admin";
import { colors, radii, spacing } from "../../tokens.stylex";

const styles = stylex.create({
	container: {
		maxWidth: "1000px",
		marginInline: "auto",
		paddingInline: spacing.lg,
		paddingBlock: spacing.xl,
	},
	backLink: {
		display: "inline-flex",
		alignItems: "center",
		gap: spacing.sm,
		color: colors.slate400,
		textDecoration: "none",
		fontSize: "0.875rem",
		marginBottom: spacing.lg,
		":hover": {
			color: colors.white,
		},
	},
	card: {
		backgroundColor: colors.slate800,
		borderRadius: radii.lg,
		border: `1px solid ${colors.slate700}`,
		overflow: "hidden",
		marginBottom: spacing.lg,
	},
	cardHeader: {
		padding: spacing.lg,
		borderBottom: `1px solid ${colors.slate700}`,
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	},
	cardTitle: {
		fontSize: "1.125rem",
		fontWeight: 600,
		color: colors.white,
	},
	cardContent: {
		padding: spacing.lg,
	},
	authorSection: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
		marginBottom: spacing.lg,
	},
	avatar: {
		width: "48px",
		height: "48px",
		borderRadius: "50%",
		backgroundColor: colors.slate700,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: colors.slate400,
	},
	authorInfo: {
		display: "flex",
		flexDirection: "column",
	},
	authorName: {
		color: colors.white,
		fontWeight: 500,
		textDecoration: "none",
		":hover": {
			textDecoration: "underline",
		},
	},
	authorHandle: {
		color: colors.slate500,
		fontSize: "0.875rem",
	},
	postContent: {
		color: colors.slate200,
		fontSize: "1.125rem",
		lineHeight: 1.7,
		marginBottom: spacing.lg,
	},
	postMeta: {
		display: "flex",
		alignItems: "center",
		gap: spacing.lg,
		paddingTop: spacing.md,
		borderTop: `1px solid ${colors.slate700}`,
	},
	metaItem: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		color: colors.slate400,
		fontSize: "0.875rem",
	},
	deleteButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		paddingInline: spacing.md,
		paddingBlock: spacing.sm,
		borderRadius: radii.md,
		border: "none",
		backgroundColor: colors.red600,
		color: colors.white,
		fontSize: "0.875rem",
		fontWeight: 500,
		cursor: "pointer",
		":hover": {
			backgroundColor: colors.red700,
		},
	},
	reportsSection: {
		marginTop: spacing.lg,
	},
	reportItem: {
		padding: spacing.md,
		borderBottom: `1px solid ${colors.slate700}`,
	},
	reportItemLast: {
		borderBottom: "none",
	},
	reportHeader: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: spacing.sm,
	},
	reportReason: {
		color: colors.white,
		fontWeight: 500,
		fontSize: "0.875rem",
	},
	reportTime: {
		color: colors.slate500,
		fontSize: "0.75rem",
	},
	reportUser: {
		color: colors.slate400,
		fontSize: "0.875rem",
	},
	emptyState: {
		textAlign: "center",
		color: colors.slate400,
		paddingBlock: spacing.lg,
	},
	commentsSection: {
		marginTop: spacing.lg,
	},
	comment: {
		padding: spacing.md,
		borderBottom: `1px solid ${colors.slate700}`,
	},
	commentLast: {
		borderBottom: "none",
	},
	commentHeader: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		marginBottom: spacing.sm,
	},
	commentAvatar: {
		width: "24px",
		height: "24px",
		borderRadius: "50%",
		backgroundColor: colors.slate700,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: colors.slate400,
	},
	commentAuthor: {
		color: colors.white,
		fontWeight: 500,
		fontSize: "0.875rem",
	},
	commentTime: {
		color: colors.slate500,
		fontSize: "0.75rem",
	},
	commentContent: {
		color: colors.slate300,
		fontSize: "0.875rem",
	},
});

export const Route = createFileRoute("/posts/$postId")({
	beforeLoad: requireAdminAccess,
	component: PostDetailPage,
});

interface AdminPost {
	id: string;
	author: { id: string; username: string; displayName: string };
	content: string;
	likeCount: number;
	commentCount: number;
	createdAt: string;
}

const flattenComments = (items: AdminComment[]): AdminComment[] =>
	items.flatMap((comment) => [comment, ...flattenComments(comment.replies)]);

function PostDetailPage() {
	const { postId } = Route.useParams();
	const navigate = useNavigate();
	const [post, setPost] = useState<AdminPost | null>(null);
	const [comments, setComments] = useState<AdminComment[]>([]);
	const [reports, setReports] = useState<
		{ id: string; reason: string; reporterUsername: string; createdAt: string }[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadPost = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [postResponse, commentsResponse, reportsResponse] = await Promise.all([
				getAdminPost({ data: { postId } }),
				getAdminPostComments({ data: { postId } }),
				listAdminReports({ data: { typeFilter: "post" } }),
			]);
			setPost(postResponse);
			setComments(flattenComments(commentsResponse));
			setReports(reportsResponse.reports.filter((report) => report.targetId === postId));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load post");
		} finally {
			setIsLoading(false);
		}
	}, [postId]);

	useEffect(() => {
		loadPost();
	}, [loadPost]);

	const handleDeletePost = async () => {
		const reason = window.prompt("Reason for deleting this post?", "Content policy violation");
		if (!reason) return;
		try {
			await deleteAdminPost({ data: { postId, reason } });
			navigate({ to: "/posts" });
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to delete post");
		}
	};

	const handleDeleteComment = async (commentId: string) => {
		const reason = window.prompt("Reason for deleting this comment?", "Content policy violation");
		if (!reason) return;
		try {
			await deleteAdminComment({ data: { commentId, reason } });
			await loadPost();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to delete comment");
		}
	};

	if (isLoading) {
		return <main {...stylex.props(styles.container, styles.emptyState)}>Loading post...</main>;
	}

	if (error || !post) {
		return (
			<main {...stylex.props(styles.container, styles.emptyState)}>
				{error || "Post not found"}
			</main>
		);
	}

	return (
		<main {...stylex.props(styles.container)}>
			<Link to="/posts" {...stylex.props(styles.backLink)}>
				<ArrowLeft size={16} />
				Back to Posts
			</Link>

			<div {...stylex.props(styles.card)}>
				<div {...stylex.props(styles.cardHeader)}>
					<h1 {...stylex.props(styles.cardTitle)}>Post Details</h1>
					<button type="button" onClick={handleDeletePost} {...stylex.props(styles.deleteButton)}>
						<Trash2 size={16} />
						Delete Post
					</button>
				</div>
				<div {...stylex.props(styles.cardContent)}>
					<div {...stylex.props(styles.authorSection)}>
						<div {...stylex.props(styles.avatar)}>
							<User size={24} />
						</div>
						<div {...stylex.props(styles.authorInfo)}>
							<Link
								to="/users/$userId"
								params={{ userId: post.author.id }}
								{...stylex.props(styles.authorName)}
							>
								{post.author.displayName}
							</Link>
							<span {...stylex.props(styles.authorHandle)}>@{post.author.username}</span>
						</div>
					</div>

					<p {...stylex.props(styles.postContent)}>{post.content}</p>

					<div {...stylex.props(styles.postMeta)}>
						<span {...stylex.props(styles.metaItem)}>
							<Heart size={14} /> {post.likeCount} likes
						</span>
						<span {...stylex.props(styles.metaItem)}>
							<MessageSquare size={14} /> {post.commentCount} comments
						</span>
						<span {...stylex.props(styles.metaItem)}>
							<Calendar size={14} /> {new Date(post.createdAt).toLocaleString()}
						</span>
					</div>
				</div>
			</div>

			<div {...stylex.props(styles.card)}>
				<div {...stylex.props(styles.cardHeader)}>
					<h2 {...stylex.props(styles.cardTitle)}>Reports ({reports.length})</h2>
				</div>
				<div>
					{reports.length === 0 ? (
						<p {...stylex.props(styles.emptyState)}>No reports for this post</p>
					) : (
						reports.map((report, index) => {
							const isLast = index === reports.length - 1;
							return (
								<div
									key={report.id}
									{...stylex.props(styles.reportItem, isLast && styles.reportItemLast)}
								>
									<div {...stylex.props(styles.reportHeader)}>
										<span {...stylex.props(styles.reportReason)}>{report.reason}</span>
										<span {...stylex.props(styles.reportTime)}>
											{new Date(report.createdAt).toLocaleString()}
										</span>
									</div>
									<span {...stylex.props(styles.reportUser)}>
										Reported by @{report.reporterUsername}
									</span>
								</div>
							);
						})
					)}
				</div>
			</div>

			<div {...stylex.props(styles.card)}>
				<div {...stylex.props(styles.cardHeader)}>
					<h2 {...stylex.props(styles.cardTitle)}>Comments ({comments.length})</h2>
				</div>
				<div>
					{comments.length === 0 ? (
						<p {...stylex.props(styles.emptyState)}>No comments on this post</p>
					) : (
						comments.map((comment, index) => {
							const isLast = index === comments.length - 1;
							return (
								<div
									key={comment.id}
									{...stylex.props(styles.comment, isLast && styles.commentLast)}
								>
									<div {...stylex.props(styles.commentHeader)}>
										<div {...stylex.props(styles.commentAvatar)}>
											<User size={12} />
										</div>
										<span {...stylex.props(styles.commentAuthor)}>
											{comment.author.displayName}
										</span>
										<span {...stylex.props(styles.commentTime)}>
											{new Date(comment.createdAt).toLocaleString()}
										</span>
										<button
											type="button"
											onClick={() => handleDeleteComment(comment.id)}
											{...stylex.props(styles.deleteButton)}
										>
											<Trash2 size={14} />
											Delete
										</button>
									</div>
									<p {...stylex.props(styles.commentContent)}>{comment.content}</p>
								</div>
							);
						})
					)}
				</div>
			</div>
		</main>
	);
}
