import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FeedSelector } from "../components/feed/FeedSelector";
import { type Post, PostList } from "../components/posts/PostList";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { getCurrentUser } from "../server/functions/auth";
import { type FeedMode, getRankedFeed } from "../server/functions/feed";
import { colors, fontSize, fontWeight, radii, semanticColors, spacing } from "../tokens.stylex";

export const Route = createFileRoute("/explore")({
	component: ExplorePage,
});

const styles = stylex.create({
	container: {
		maxWidth: "42rem",
		marginLeft: "auto",
		marginRight: "auto",
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
		paddingTop: spacing["2xl"],
		paddingBottom: spacing["3xl"],
	},
	pageHeader: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
		marginBottom: spacing["2xl"],
	},
	pageHeaderIcon: {
		width: "2.25rem",
		height: "2.25rem",
		borderRadius: radii.lg,
		backgroundImage: `linear-gradient(135deg, ${colors.emerald500}, ${colors.teal500})`,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		boxShadow: "0 4px 12px -2px rgba(16, 185, 129, 0.25)",
	},
	pageTitle: {
		fontSize: fontSize.xl,
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
		letterSpacing: "-0.025em",
	},
	pageSubtitle: {
		fontSize: fontSize.xs,
		color: semanticColors.textSecondary,
	},
	postsList: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.md,
	},
	iconWhite: {
		color: colors.white,
	},
});

function ExplorePage() {
	const [posts, setPosts] = useState<Post[]>([]);
	const [user, setUser] = useState<{ id: string } | null>(null);
	const [loading, setLoading] = useState(true);
	const [feedMode, setFeedMode] = useState<FeedMode>("latest");
	const [feedFilter, setFeedFilter] = useState("");

	const loadData = useCallback(
		async (options: { silent?: boolean } = {}) => {
			try {
				if (!options.silent) {
					setLoading(true);
				}
				const [currentUser, feedPosts] = await Promise.all([
					getCurrentUser(),
					getRankedFeed({ data: { type: feedMode, filter: feedFilter } }),
				]);
				setUser(currentUser);
				setPosts(feedPosts);
			} catch (error) {
				console.error("Failed to load data:", error);
			} finally {
				setLoading(false);
			}
		},
		[feedMode, feedFilter],
	);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useLiveRefresh(() => loadData({ silent: true }), { intervalMs: 7000 });

	return (
		<div {...stylex.props(styles.container)}>
			{/* Page Header */}
			<div {...stylex.props(styles.pageHeader)}>
				<div {...stylex.props(styles.pageHeaderIcon)}>
					<Compass size={20} {...stylex.props(styles.iconWhite)} />
				</div>
				<div>
					<h1 {...stylex.props(styles.pageTitle)}>Explore</h1>
					<p {...stylex.props(styles.pageSubtitle)}>Discover new posts from everyone</p>
				</div>
			</div>

			<FeedSelector
				value={feedMode}
				filter={feedFilter}
				onChange={setFeedMode}
				onFilterChange={setFeedFilter}
			/>

			{/* Posts */}
			<div {...stylex.props(styles.postsList)}>
				<PostList
					posts={posts}
					loading={loading}
					currentUserId={user?.id}
					onPostDelete={loadData}
				/>
			</div>
		</div>
	);
}
