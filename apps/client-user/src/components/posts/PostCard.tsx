import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import {
	BadgeCheck,
	Edit,
	HandHeart,
	Heart,
	Laugh,
	MessageCircle,
	PartyPopper,
	Repeat2,
	Share2,
	ThumbsUp,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { broadcastLiveActivity } from "../../hooks/useLiveRefresh";
import {
	getPostReactions,
	type ReactionName,
	reactToPost,
	togglePostLike,
} from "../../server/functions/likes";
import { deletePost } from "../../server/functions/posts";
import { getShareCount, repost, sharePost } from "../../server/functions/social";
import {
	colors,
	fontSize,
	fontWeight,
	radii,
	semanticColors,
	shadows,
	spacing,
} from "../../tokens.stylex";
import { ReportButton } from "../reports/ReportButton";
import { ParsedContent } from "../shared/ParsedContent";
import { RelativeTime } from "../shared/RelativeTime";
import { UserAvatar } from "../users/UserAvatar";
import { BookmarkButton } from "./BookmarkButton";

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

const heartBeat = stylex.keyframes({
	"0%": { transform: "scale(1)" },
	"25%": { transform: "scale(1.3)" },
	"50%": { transform: "scale(1)" },
	"75%": { transform: "scale(1.3)" },
	"100%": { transform: "scale(1)" },
});

const styles = stylex.create({
	article: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
		boxShadow: shadows.card,
		padding: spacing.lg,
		transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
		animationName: fadeInUp,
		animationDuration: "0.3s",
		animationFillMode: "both",
		":hover": {
			borderColor: semanticColors.borderDefault,
			boxShadow: shadows.cardHover,
			transform: "translateY(-1px)",
		},
	},
	container: {
		display: "flex",
		gap: spacing.md,
	},
	content: {
		flex: 1,
		minWidth: 0,
	},
	authorInfo: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		flexWrap: "wrap",
		minHeight: "1.5rem",
	},
	displayName: {
		display: "inline-flex",
		alignItems: "center",
		gap: "0.25rem",
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
		textDecoration: "none",
		transition: "color 0.2s",
		":hover": {
			color: colors.blue600,
		},
	},
	verifiedIcon: {
		color: colors.blue500,
		flexShrink: 0,
	},
	username: {
		color: semanticColors.textTertiary,
		fontSize: fontSize.sm,
		textDecoration: "none",
		transition: "color 0.2s",
		":hover": {
			color: semanticColors.textSecondary,
		},
	},
	separator: {
		color: semanticColors.textTertiary,
	},
	editedBadge: {
		fontSize: "0.75rem",
		color: semanticColors.textTertiary,
		backgroundColor: semanticColors.bgSecondary,
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		paddingTop: "0.125rem",
		paddingBottom: "0.125rem",
		borderRadius: radii.full,
	},
	postContent: {
		display: "block",
		marginTop: spacing.md,
		color: semanticColors.textPrimary,
		whiteSpace: "pre-wrap",
		overflowWrap: "break-word",
		lineHeight: 1.625,
		fontSize: fontSize.base,
		textDecoration: "none",
		transition: "color 0.2s",
		":hover": {
			color: semanticColors.textSecondary,
		},
	},
	actions: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		marginTop: spacing.lg,
		marginLeft: "-0.5rem",
		paddingTop: spacing.sm,
		borderTop: `1px solid ${semanticColors.borderSubtle}`,
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	reactionGroup: {
		display: "flex",
		alignItems: "center",
		gap: "0.125rem",
		padding: "0.125rem",
		borderRadius: radii.full,
		backgroundColor: semanticColors.bgTertiary,
		border: `1px solid ${semanticColors.borderSubtle}`,
	},
	reactionButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "2rem",
		height: "2rem",
		borderRadius: radii.full,
		border: "none",
		backgroundColor: "transparent",
		color: semanticColors.textTertiary,
		cursor: "pointer",
		":hover": {
			backgroundColor: semanticColors.bgPrimary,
			color: semanticColors.primary,
		},
		":disabled": {
			opacity: 0.5,
			cursor: "not-allowed",
		},
	},
	reactionButtonActive: {
		backgroundColor: semanticColors.primaryLight,
		color: semanticColors.primary,
	},
	actionButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		borderRadius: radii.full,
		transition: "all 0.2s",
		backgroundColor: "transparent",
		border: "none",
		cursor: "pointer",
		color: semanticColors.textTertiary,
		":hover": {
			color: colors.red500,
			backgroundColor: semanticColors.errorLight,
		},
		":disabled": {
			opacity: 0.5,
			cursor: "not-allowed",
		},
	},
	actionButtonLiked: {
		color: colors.red500,
		backgroundColor: semanticColors.errorLight,
	},
	commentLink: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		borderRadius: radii.full,
		color: semanticColors.textTertiary,
		textDecoration: "none",
		transition: "all 0.2s",
		":hover": {
			color: colors.blue500,
			backgroundColor: colors.blueAlpha10,
		},
	},
	shareButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		borderRadius: radii.full,
		transition: "all 0.2s",
		backgroundColor: "transparent",
		border: "none",
		cursor: "pointer",
		color: semanticColors.textTertiary,
		":hover": {
			color: colors.green600,
			backgroundColor: "rgba(16, 185, 129, 0.1)",
		},
		":disabled": {
			opacity: 0.5,
			cursor: "not-allowed",
		},
	},
	actionCount: {
		fontSize: "0.875rem",
		fontWeight: 500,
	},
	ownerActions: {
		flex: 1,
		display: "flex",
		justifyContent: "flex-end",
		gap: spacing.xs,
	},
	iconButton: {
		padding: spacing.sm,
		borderRadius: radii.full,
		backgroundColor: "transparent",
		border: "none",
		cursor: "pointer",
		color: semanticColors.textTertiary,
		transition: "all 0.2s",
		":hover": {
			color: colors.blue500,
			backgroundColor: colors.blueAlpha10,
		},
		":disabled": {
			opacity: 0.5,
			cursor: "not-allowed",
		},
	},
	iconButtonDanger: {
		":hover": {
			color: colors.red500,
			backgroundColor: colors.red50,
		},
	},
	heartFilled: {
		fill: "currentColor",
	},
	heartBeat: {
		animationName: heartBeat,
		animationDuration: "0.4s",
	},
});

const reactionOptions: Array<{
	name: ReactionName;
	label: string;
	icon: typeof ThumbsUp;
}> = [
	{ name: "like", label: "Like", icon: ThumbsUp },
	{ name: "love", label: "Love", icon: Heart },
	{ name: "celebrate", label: "Celebrate", icon: PartyPopper },
	{ name: "support", label: "Support", icon: HandHeart },
	{ name: "funny", label: "Funny", icon: Laugh },
];

interface PostCardProps {
	post: {
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
	};
	currentUserId?: string;
	onDelete?: () => void;
}

export function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
	const [liked, setLiked] = useState(Boolean(post.isLiked));
	const [likeCount, setLikeCount] = useState(post.likeCount);
	const [selectedReaction, setSelectedReaction] = useState<ReactionName | null>(
		post.isLiked ? "like" : null,
	);
	const [reactionCounts, setReactionCounts] = useState<Record<ReactionName, number>>({
		like: post.likeCount,
		love: 0,
		celebrate: 0,
		support: 0,
		funny: 0,
	});
	const [shareCount, setShareCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [animateLike, setAnimateLike] = useState(false);

	const isOwnPost = currentUserId === post.author.id;
	const canEdit = isOwnPost && Date.now() - post.createdAt.getTime() < 5 * 60 * 1000;
	const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

	useEffect(() => {
		let mounted = true;

		const loadEngagement = async () => {
			try {
				const [reactions, shares] = await Promise.all([
					getPostReactions({ data: post.id }),
					getShareCount({ data: post.id }),
				]);

				if (!mounted) return;

				const nextCounts: Record<ReactionName, number> = {
					like: 0,
					love: 0,
					celebrate: 0,
					support: 0,
					funny: 0,
				};
				for (const reaction of reactions) {
					nextCounts[reaction.reaction] = reaction.count;
				}
				setReactionCounts(nextCounts);
				setLikeCount(nextCounts.like);
				setShareCount(shares);
			} catch (error) {
				console.error("Failed to load engagement:", error);
			}
		};

		void loadEngagement();

		return () => {
			mounted = false;
		};
	}, [post.id]);

	const handleLike = async () => {
		if (loading) return;
		setLoading(true);

		try {
			const result = await togglePostLike({ data: post.id });
			setLiked(result.liked);
			setSelectedReaction(result.liked ? "like" : null);
			setLikeCount((prev) => (result.liked ? prev + 1 : prev - 1));
			setReactionCounts((prev) => ({
				...prev,
				like: Math.max(0, prev.like + (result.liked ? 1 : -1)),
			}));
			if (result.liked) {
				setAnimateLike(true);
				setTimeout(() => setAnimateLike(false), 400);
			}
			broadcastLiveActivity();
		} catch (error) {
			console.error("Failed to like post:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleReaction = async (reaction: ReactionName) => {
		if (loading) return;
		setLoading(true);

		try {
			const previousReaction = selectedReaction;
			const result = await reactToPost({ data: { postId: post.id, reaction } });
			setSelectedReaction(result.reacted ? result.reaction : null);
			setLiked(result.reacted);
			const nextCounts = { ...reactionCounts };
			if (previousReaction) {
				nextCounts[previousReaction] = Math.max(0, nextCounts[previousReaction] - 1);
			}
			if (result.reacted) {
				nextCounts[result.reaction] += 1;
			}
			setReactionCounts(nextCounts);
			setLikeCount(nextCounts.like);
			if (result.reacted) {
				setAnimateLike(true);
				setTimeout(() => setAnimateLike(false), 400);
			}
			broadcastLiveActivity();
		} catch (error) {
			console.error("Failed to react:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleShare = async () => {
		if (loading) return;
		setLoading(true);
		try {
			const result = await sharePost({ data: { postId: post.id, destination: "external" } });
			setShareCount(result.shareCount);
			if (typeof navigator !== "undefined" && navigator.clipboard) {
				await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
			}
			broadcastLiveActivity();
		} catch (error) {
			console.error("Failed to share post:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleRepost = async () => {
		if (loading) return;
		setLoading(true);
		try {
			const result = await repost({ data: { postId: post.id } });
			setShareCount(result.shareCount);
			broadcastLiveActivity();
		} catch (error) {
			console.error("Failed to repost:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this post?")) return;

		setLoading(true);
		try {
			await deletePost({ data: post.id });
			broadcastLiveActivity();
			onDelete?.();
		} catch (error) {
			console.error("Failed to delete post:", error);
			alert("Failed to delete post");
		} finally {
			setLoading(false);
		}
	};

	return (
		<article {...stylex.props(styles.article)}>
			<div {...stylex.props(styles.container)}>
				<Link to="/users/$username" params={{ username: post.author.username }}>
					<UserAvatar avatarUrl={post.author.avatarUrl} username={post.author.username} />
				</Link>

				<div {...stylex.props(styles.content)}>
					{/* Author Info */}
					<div {...stylex.props(styles.authorInfo)}>
						<Link
							to="/users/$username"
							params={{ username: post.author.username }}
							{...stylex.props(styles.displayName)}
						>
							{post.author.displayName}
							<BadgeCheck
								size={14}
								{...stylex.props(styles.verifiedIcon)}
								aria-label="Verified account"
							/>
						</Link>
						<Link
							to="/users/$username"
							params={{ username: post.author.username }}
							{...stylex.props(styles.username)}
						>
							@{post.author.username}
						</Link>
						<span {...stylex.props(styles.separator)}>-</span>
						<RelativeTime date={post.createdAt} />
						{post.updatedAt.getTime() !== post.createdAt.getTime() && (
							<span {...stylex.props(styles.editedBadge)}>edited</span>
						)}
					</div>

					{/* Post Content */}
					<Link
						to="/posts/$postId"
						params={{ postId: post.id }}
						{...stylex.props(styles.postContent)}
					>
						<ParsedContent content={post.content} />
					</Link>

					{/* Actions */}
					<div {...stylex.props(styles.actions)}>
						<div {...stylex.props(styles.reactionGroup)} title="Reactions">
							{reactionOptions.map((option) => {
								const Icon = option.icon;
								const active = selectedReaction === option.name;
								return (
									<button
										key={option.name}
										type="button"
										onClick={() => handleReaction(option.name)}
										disabled={loading}
										{...stylex.props(styles.reactionButton, active && styles.reactionButtonActive)}
										title={option.label}
									>
										<Icon size={16} />
									</button>
								);
							})}
						</div>

						<button
							type="button"
							onClick={handleLike}
							disabled={loading}
							{...stylex.props(styles.actionButton, liked && styles.actionButtonLiked)}
						>
							<Heart
								size={20}
								{...stylex.props(liked && styles.heartFilled, animateLike && styles.heartBeat)}
							/>
							<span {...stylex.props(styles.actionCount)}>{totalReactions || likeCount}</span>
						</button>

						<Link
							to="/posts/$postId"
							params={{ postId: post.id }}
							{...stylex.props(styles.commentLink)}
						>
							<MessageCircle size={20} />
							<span {...stylex.props(styles.actionCount)}>{post.commentCount}</span>
						</Link>

						<BookmarkButton postId={post.id} />

						<button
							type="button"
							onClick={handleShare}
							disabled={loading}
							{...stylex.props(styles.shareButton)}
							title="Share post"
						>
							<Share2 size={20} />
							<span {...stylex.props(styles.actionCount)}>{shareCount}</span>
						</button>

						<button
							type="button"
							onClick={handleRepost}
							disabled={loading}
							{...stylex.props(styles.shareButton)}
							title="Repost"
						>
							<Repeat2 size={20} />
						</button>

						{currentUserId && !isOwnPost && (
							<ReportButton targetType="post" targetId={post.id} targetLabel="post" compact />
						)}

						{isOwnPost && (
							<div {...stylex.props(styles.ownerActions)}>
								{canEdit && (
									<Link
										to="/posts/$postId"
										params={{ postId: post.id }}
										{...stylex.props(styles.iconButton)}
										title="Edit post"
									>
										<Edit size={16} />
									</Link>
								)}
								<button
									type="button"
									onClick={handleDelete}
									disabled={loading}
									{...stylex.props(styles.iconButton, styles.iconButtonDanger)}
									title="Delete post"
								>
									<Trash2 size={16} />
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</article>
	);
}
