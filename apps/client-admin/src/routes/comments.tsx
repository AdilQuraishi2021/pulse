import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Eye, Flag, Search, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { requireAdminAccess } from "../lib/auth-guard";
import { deleteAdminComment, listAdminComments } from "../server/functions/admin";
import { colors, radii, semanticColors, spacing } from "../tokens.stylex";

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
	filters: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
	},
	searchContainer: {
		position: "relative",
		width: "300px",
	},
	searchIcon: {
		position: "absolute",
		left: spacing.md,
		top: "50%",
		transform: "translateY(-50%)",
		color: semanticColors.textTertiary,
	},
	searchInput: {
		width: "100%",
		paddingBlock: spacing.sm,
		paddingLeft: "40px",
		paddingRight: spacing.md,
		borderRadius: radii.md,
		border: `1px solid ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.surfaceInput,
		color: semanticColors.textPrimary,
		fontSize: "0.875rem",
		"::placeholder": {
			color: semanticColors.textTertiary,
		},
		":focus": {
			outline: "none",
			borderColor: semanticColors.borderFocus,
		},
	},
	filterSelect: {
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,
		borderRadius: radii.md,
		border: `1px solid ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.surfaceInput,
		color: semanticColors.textPrimary,
		fontSize: "0.875rem",
		cursor: "pointer",
	},
	table: {
		width: "100%",
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
		overflow: "hidden",
	},
	tableHeader: {
		backgroundColor: semanticColors.bgSecondary,
	},
	tableRow: {
		borderBottom: `1px solid ${semanticColors.borderSubtle}`,
		":hover": {
			backgroundColor: semanticColors.bgHover,
		},
	},
	tableRowLast: {
		borderBottom: "none",
	},
	th: {
		textAlign: "left",
		padding: spacing.md,
		color: semanticColors.textTertiary,
		fontSize: "0.75rem",
		fontWeight: 600,
		textTransform: "uppercase",
		letterSpacing: "0.05em",
	},
	td: {
		padding: spacing.md,
		color: semanticColors.textSecondary,
		fontSize: "0.875rem",
	},
	userCell: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
	},
	avatar: {
		width: "32px",
		height: "32px",
		borderRadius: "50%",
		backgroundColor: semanticColors.bgSecondary,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: semanticColors.textTertiary,
	},
	userName: {
		color: semanticColors.textPrimary,
		fontWeight: 500,
		textDecoration: "none",
		":hover": {
			textDecoration: "underline",
		},
	},
	commentContent: {
		maxWidth: "400px",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
	postLink: {
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
	flagged: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		color: colors.yellow500,
	},
	actionsCell: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
	},
	actionButton: {
		padding: spacing.sm,
		borderRadius: radii.md,
		border: "none",
		backgroundColor: "transparent",
		color: semanticColors.textTertiary,
		cursor: "pointer",
		":hover": {
			backgroundColor: semanticColors.bgHover,
			color: semanticColors.textPrimary,
		},
	},
	deleteButton: {
		":hover": {
			backgroundColor: colors.red900,
			color: colors.red400,
		},
	},
	emptyState: {
		textAlign: "center",
		color: semanticColors.textTertiary,
		padding: spacing.xl,
	},
});

export const Route = createFileRoute("/comments")({
	beforeLoad: requireAdminAccess,
	component: CommentsPage,
});

interface AdminCommentRow {
	id: string;
	author: { id: string; username: string; displayName: string };
	content: string;
	postId: string;
	postTitle: string;
	likeCount: number;
	createdAt: string;
}

function CommentsPage() {
	const [comments, setComments] = useState<AdminCommentRow[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadComments = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			setComments(await listAdminComments());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load comments");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadComments();
	}, [loadComments]);

	const visibleComments = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return comments;
		return comments.filter(
			(comment) =>
				comment.content.toLowerCase().includes(query) ||
				comment.author.username.toLowerCase().includes(query) ||
				comment.postTitle.toLowerCase().includes(query),
		);
	}, [comments, searchQuery]);

	const handleDelete = async (commentId: string) => {
		const reason = window.prompt("Reason for deleting this comment?", "Content policy violation");
		if (!reason) return;
		try {
			await deleteAdminComment({ data: { commentId, reason } });
			await loadComments();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to delete comment");
		}
	};

	return (
		<main {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.header)}>
				<h1 {...stylex.props(styles.title)}>Comments</h1>
				<div {...stylex.props(styles.filters)}>
					<select {...stylex.props(styles.filterSelect)}>
						<option value="all">All Comments</option>
						<option value="reported">Reported Only</option>
						<option value="recent">Most Recent</option>
					</select>
					<div {...stylex.props(styles.searchContainer)}>
						<Search size={16} {...stylex.props(styles.searchIcon)} />
						<input
							type="text"
							placeholder="Search comments..."
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							{...stylex.props(styles.searchInput)}
						/>
					</div>
				</div>
			</header>

			<table {...stylex.props(styles.table)}>
				<thead {...stylex.props(styles.tableHeader)}>
					<tr>
						<th {...stylex.props(styles.th)}>Author</th>
						<th {...stylex.props(styles.th)}>Comment</th>
						<th {...stylex.props(styles.th)}>Post</th>
						<th {...stylex.props(styles.th)}>Reports</th>
						<th {...stylex.props(styles.th)}>Date</th>
						<th {...stylex.props(styles.th)}>Actions</th>
					</tr>
				</thead>
				<tbody>
					{isLoading ? (
						<tr>
							<td colSpan={6} {...stylex.props(styles.emptyState)}>
								Loading comments...
							</td>
						</tr>
					) : error ? (
						<tr>
							<td colSpan={6} {...stylex.props(styles.emptyState)}>
								{error}
							</td>
						</tr>
					) : visibleComments.length === 0 ? (
						<tr>
							<td colSpan={6} {...stylex.props(styles.emptyState)}>
								No comments found.
							</td>
						</tr>
					) : (
						visibleComments.map((comment, index) => {
							const isLast = index === visibleComments.length - 1;
							return (
								<tr
									key={comment.id}
									{...stylex.props(styles.tableRow, isLast && styles.tableRowLast)}
								>
									<td {...stylex.props(styles.td)}>
										<div {...stylex.props(styles.userCell)}>
											<div {...stylex.props(styles.avatar)}>
												<User size={16} />
											</div>
											<Link
												to="/users/$userId"
												params={{ userId: comment.author.id }}
												{...stylex.props(styles.userName)}
											>
												{comment.author.displayName}
											</Link>
										</div>
									</td>
									<td {...stylex.props(styles.td)}>
										<span {...stylex.props(styles.commentContent)}>{comment.content}</span>
									</td>
									<td {...stylex.props(styles.td)}>
										<Link
											to="/posts/$postId"
											params={{ postId: comment.postId }}
											{...stylex.props(styles.postLink)}
										>
											{comment.postTitle}
											<ExternalLink size={12} />
										</Link>
									</td>
									<td {...stylex.props(styles.td)}>
										<span {...stylex.props(styles.flagged)}>
											<Flag size={14} /> {comment.likeCount}
										</span>
									</td>
									<td {...stylex.props(styles.td)}>
										{new Date(comment.createdAt).toLocaleString()}
									</td>
									<td {...stylex.props(styles.td)}>
										<div {...stylex.props(styles.actionsCell)}>
											<Link
												to="/posts/$postId"
												params={{ postId: comment.postId }}
												{...stylex.props(styles.actionButton)}
											>
												<Eye size={16} />
											</Link>
											<button
												type="button"
												onClick={() => handleDelete(comment.id)}
												{...stylex.props(styles.actionButton, styles.deleteButton)}
											>
												<Trash2 size={16} />
											</button>
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</main>
	);
}
