import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Heart, MessageSquare, Search, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { requireAdminAccess } from "../../lib/auth-guard";
import { deleteAdminPost, listAdminPosts } from "../../server/functions/admin";
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
	postsList: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.md,
	},
	postCard: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
		padding: spacing.lg,
	},
	postHeader: {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "space-between",
		marginBottom: spacing.md,
	},
	authorSection: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
	},
	avatar: {
		width: "40px",
		height: "40px",
		borderRadius: "50%",
		backgroundColor: semanticColors.bgSecondary,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: semanticColors.textTertiary,
	},
	authorInfo: {
		display: "flex",
		flexDirection: "column",
	},
	authorName: {
		color: semanticColors.textPrimary,
		fontWeight: 500,
		fontSize: "0.875rem",
	},
	authorHandle: {
		color: semanticColors.textTertiary,
		fontSize: "0.75rem",
	},
	postActions: {
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
	postContent: {
		color: semanticColors.textSecondary,
		fontSize: "0.9375rem",
		lineHeight: 1.6,
		marginBottom: spacing.md,
	},
	postFooter: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	},
	postStats: {
		display: "flex",
		alignItems: "center",
		gap: spacing.lg,
	},
	stat: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		color: semanticColors.textTertiary,
		fontSize: "0.875rem",
	},
	postTime: {
		color: semanticColors.textTertiary,
		fontSize: "0.75rem",
	},
	flagged: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		color: colors.yellow500,
		fontSize: "0.75rem",
	},
	emptyState: {
		textAlign: "center",
		color: semanticColors.textTertiary,
		paddingBlock: spacing.xl,
	},
});

export const Route = createFileRoute("/posts/")({
	beforeLoad: requireAdminAccess,
	component: PostsPage,
});

interface AdminPost {
	id: string;
	author: { id: string; username: string; displayName: string };
	content: string;
	likeCount: number;
	commentCount: number;
	createdAt: string;
}

function PostsPage() {
	const [posts, setPosts] = useState<AdminPost[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState("all");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadPosts = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			setPosts(await listAdminPosts());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load posts");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadPosts();
	}, [loadPosts]);

	const visiblePosts = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		return posts
			.filter((post) =>
				query
					? post.content.toLowerCase().includes(query) ||
						post.author.username.toLowerCase().includes(query)
					: true,
			)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}, [posts, searchQuery]);

	const handleDelete = async (post: AdminPost) => {
		const reason = window.prompt("Reason for deleting this post?", "Content policy violation");
		if (!reason) return;
		try {
			await deleteAdminPost({ data: { postId: post.id, reason } });
			await loadPosts();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to delete post");
		}
	};

	return (
		<main {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.header)}>
				<h1 {...stylex.props(styles.title)}>Posts</h1>
				<div {...stylex.props(styles.filters)}>
					<select
						value={filter}
						onChange={(event) => setFilter(event.target.value)}
						{...stylex.props(styles.filterSelect)}
					>
						<option value="all">All Posts</option>
						<option value="recent">Most Recent</option>
					</select>
					<div {...stylex.props(styles.searchContainer)}>
						<Search size={16} {...stylex.props(styles.searchIcon)} />
						<input
							type="text"
							placeholder="Search posts..."
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							{...stylex.props(styles.searchInput)}
						/>
					</div>
				</div>
			</header>

			<div {...stylex.props(styles.postsList)}>
				{error && <p {...stylex.props(styles.emptyState)}>{error}</p>}
				{isLoading ? (
					<p {...stylex.props(styles.emptyState)}>Loading posts...</p>
				) : visiblePosts.length === 0 ? (
					<p {...stylex.props(styles.emptyState)}>No posts found.</p>
				) : (
					visiblePosts.map((post) => (
						<article key={post.id} {...stylex.props(styles.postCard)}>
							<div {...stylex.props(styles.postHeader)}>
								<div {...stylex.props(styles.authorSection)}>
									<div {...stylex.props(styles.avatar)}>
										<User size={20} />
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
								<div {...stylex.props(styles.postActions)}>
									<Link
										to="/posts/$postId"
										params={{ postId: post.id }}
										{...stylex.props(styles.actionButton)}
									>
										<Eye size={16} />
									</Link>
									<button
										type="button"
										onClick={() => handleDelete(post)}
										{...stylex.props(styles.actionButton, styles.deleteButton)}
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>

							<p {...stylex.props(styles.postContent)}>{post.content}</p>

							<div {...stylex.props(styles.postFooter)}>
								<div {...stylex.props(styles.postStats)}>
									<span {...stylex.props(styles.stat)}>
										<Heart size={14} /> {post.likeCount}
									</span>
									<span {...stylex.props(styles.stat)}>
										<MessageSquare size={14} /> {post.commentCount}
									</span>
								</div>
								<span {...stylex.props(styles.postTime)}>
									{new Date(post.createdAt).toLocaleString()}
								</span>
							</div>
						</article>
					))
				)}
			</div>
		</main>
	);
}
