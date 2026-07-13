import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	Ban,
	Calendar,
	Heart,
	Mail,
	MessageSquare,
	Shield,
	Trash2,
	User,
	UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { requireAdminAccess } from "../../lib/auth-guard";
import {
	banAdminUser,
	deleteAdminUser,
	getAdminUserDetails,
	getAdminUserPosts,
	unbanAdminUser,
	updateAdminUserRole,
} from "../../server/functions/admin";
import { colors, radii, spacing } from "../../tokens.stylex";

const styles = stylex.create({
	container: {
		maxWidth: "1400px",
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
	header: {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "space-between",
		marginBottom: spacing.xl,
	},
	userSection: {
		display: "flex",
		alignItems: "center",
		gap: spacing.lg,
	},
	avatar: {
		width: "80px",
		height: "80px",
		borderRadius: "50%",
		backgroundColor: colors.slate700,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: colors.slate400,
	},
	userInfo: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.xs,
	},
	displayName: {
		fontSize: "1.5rem",
		fontWeight: 700,
		color: colors.white,
	},
	username: {
		color: colors.slate400,
		fontSize: "1rem",
	},
	badges: {
		display: "flex",
		gap: spacing.sm,
		marginTop: spacing.sm,
	},
	badge: {
		display: "inline-flex",
		alignItems: "center",
		paddingInline: spacing.sm,
		paddingBlock: "4px",
		borderRadius: radii.full,
		fontSize: "0.75rem",
		fontWeight: 500,
	},
	badgeUser: {
		backgroundColor: colors.slate700,
		color: colors.slate300,
	},
	badgeAdmin: {
		backgroundColor: "#581c87",
		color: "#c084fc",
	},
	badgeActive: {
		backgroundColor: colors.green900,
		color: colors.green400,
	},
	badgeBanned: {
		backgroundColor: colors.red900,
		color: colors.red400,
	},
	actions: {
		display: "flex",
		gap: spacing.sm,
	},
	actionButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		paddingInline: spacing.md,
		paddingBlock: spacing.sm,
		borderRadius: radii.md,
		border: "none",
		fontSize: "0.875rem",
		fontWeight: 500,
		cursor: "pointer",
	},
	banButton: {
		backgroundColor: colors.red600,
		color: colors.white,
		":hover": {
			backgroundColor: colors.red700,
		},
	},
	roleButton: {
		backgroundColor: colors.slate700,
		color: colors.white,
		":hover": {
			backgroundColor: colors.slate600,
		},
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "1fr 2fr",
		gap: spacing.lg,
	},
	sidebar: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.lg,
	},
	card: {
		backgroundColor: colors.slate800,
		borderRadius: radii.lg,
		border: `1px solid ${colors.slate700}`,
		overflow: "hidden",
	},
	cardHeader: {
		padding: spacing.md,
		borderBottom: `1px solid ${colors.slate700}`,
	},
	cardTitle: {
		fontSize: "1rem",
		fontWeight: 600,
		color: colors.white,
	},
	cardContent: {
		padding: spacing.md,
	},
	infoList: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.md,
	},
	infoItem: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
	},
	infoIcon: {
		color: colors.slate500,
	},
	infoLabel: {
		color: colors.slate400,
		fontSize: "0.875rem",
	},
	infoValue: {
		color: colors.white,
		fontSize: "0.875rem",
	},
	statsGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		gap: spacing.md,
	},
	stat: {
		textAlign: "center",
		paddingBlock: spacing.md,
	},
	statValue: {
		fontSize: "1.5rem",
		fontWeight: 700,
		color: colors.white,
	},
	statLabel: {
		fontSize: "0.75rem",
		color: colors.slate400,
		marginTop: "4px",
	},
	mainContent: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.lg,
	},
	postsList: {
		display: "flex",
		flexDirection: "column",
	},
	post: {
		padding: spacing.md,
		borderBottom: `1px solid ${colors.slate700}`,
	},
	postLast: {
		borderBottom: "none",
	},
	postContent: {
		color: colors.slate300,
		fontSize: "0.875rem",
		marginBottom: spacing.sm,
	},
	postMeta: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
		color: colors.slate500,
		fontSize: "0.75rem",
	},
	postMetaItem: {
		display: "flex",
		alignItems: "center",
		gap: "4px",
	},
	emptyState: {
		textAlign: "center",
		color: colors.slate400,
		paddingBlock: spacing.xl,
	},
});

export const Route = createFileRoute("/users/$userId")({
	beforeLoad: requireAdminAccess,
	component: UserDetailPage,
});

interface AdminUserDetails {
	id: string;
	username: string;
	displayName: string;
	email: string;
	avatarUrl: string | null;
	role: "user" | "admin" | "moderator";
	bannedAt: string | null;
	bannedReason: string | null;
	bio: string | null;
	postCount: number;
	commentCount: number;
	createdAt: string;
}

interface AdminPost {
	id: string;
	content: string;
	likeCount: number;
	commentCount: number;
	createdAt: string;
}

function UserDetailPage() {
	const { userId } = Route.useParams();
	const navigate = useNavigate();
	const [user, setUser] = useState<AdminUserDetails | null>(null);
	const [posts, setPosts] = useState<AdminPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadUser = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const userResponse = await getAdminUserDetails({ data: { userId } });
			setUser(userResponse);
			const postsResponse = await getAdminUserPosts({ data: { username: userResponse.username } });
			setPosts(postsResponse);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load user");
		} finally {
			setIsLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		loadUser();
	}, [loadUser]);

	const handleBanToggle = async () => {
		if (!user) return;
		try {
			if (user.bannedAt) {
				await unbanAdminUser({ data: { userId: user.id } });
			} else {
				const reason = window.prompt("Reason for banning this user?", "Policy violation");
				if (!reason) return;
				await banAdminUser({ data: { userId: user.id, reason } });
			}
			await loadUser();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to update user status");
		}
	};

	const handleRoleChange = async () => {
		if (!user) return;
		const role = window.prompt("Set role to user, moderator, or admin", user.role);
		if (role !== "user" && role !== "moderator" && role !== "admin") return;
		try {
			await updateAdminUserRole({ data: { userId: user.id, role } });
			await loadUser();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to update role");
		}
	};

	const handleDelete = async () => {
		if (!user || !window.confirm(`Delete @${user.username}? This cannot be undone.`)) return;
		try {
			await deleteAdminUser({ data: { userId: user.id } });
			navigate({ to: "/users" });
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to delete user");
		}
	};

	if (isLoading) {
		return <main {...stylex.props(styles.container, styles.emptyState)}>Loading user...</main>;
	}

	if (error || !user) {
		return (
			<main {...stylex.props(styles.container, styles.emptyState)}>
				{error || "User not found"}
			</main>
		);
	}

	return (
		<main {...stylex.props(styles.container)}>
			<Link to="/users" {...stylex.props(styles.backLink)}>
				<ArrowLeft size={16} />
				Back to Users
			</Link>

			<header {...stylex.props(styles.header)}>
				<div {...stylex.props(styles.userSection)}>
					<div {...stylex.props(styles.avatar)}>
						{user.avatarUrl ? (
							<img src={user.avatarUrl} alt="" width={80} height={80} />
						) : (
							<User size={40} />
						)}
					</div>
					<div {...stylex.props(styles.userInfo)}>
						<h1 {...stylex.props(styles.displayName)}>{user.displayName}</h1>
						<span {...stylex.props(styles.username)}>@{user.username}</span>
						<div {...stylex.props(styles.badges)}>
							<span
								{...stylex.props(
									styles.badge,
									user.role === "admin" ? styles.badgeAdmin : styles.badgeUser,
								)}
							>
								{user.role}
							</span>
							<span
								{...stylex.props(
									styles.badge,
									user.bannedAt ? styles.badgeBanned : styles.badgeActive,
								)}
							>
								{user.bannedAt ? "banned" : "active"}
							</span>
						</div>
					</div>
				</div>

				<div {...stylex.props(styles.actions)}>
					<button
						type="button"
						onClick={handleRoleChange}
						{...stylex.props(styles.actionButton, styles.roleButton)}
					>
						<Shield size={16} />
						Change Role
					</button>
					<button
						type="button"
						onClick={handleBanToggle}
						{...stylex.props(styles.actionButton, styles.banButton)}
					>
						{user.bannedAt ? <UserCheck size={16} /> : <Ban size={16} />}
						{user.bannedAt ? "Unban User" : "Ban User"}
					</button>
					<button
						type="button"
						onClick={handleDelete}
						{...stylex.props(styles.actionButton, styles.banButton)}
					>
						<Trash2 size={16} />
						Delete User
					</button>
				</div>
			</header>

			<div {...stylex.props(styles.grid)}>
				<div {...stylex.props(styles.sidebar)}>
					<div {...stylex.props(styles.card)}>
						<div {...stylex.props(styles.cardHeader)}>
							<h2 {...stylex.props(styles.cardTitle)}>User Information</h2>
						</div>
						<div {...stylex.props(styles.cardContent)}>
							<div {...stylex.props(styles.infoList)}>
								<div {...stylex.props(styles.infoItem)}>
									<Mail size={16} {...stylex.props(styles.infoIcon)} />
									<div>
										<div {...stylex.props(styles.infoLabel)}>Email</div>
										<div {...stylex.props(styles.infoValue)}>{user.email}</div>
									</div>
								</div>
								<div {...stylex.props(styles.infoItem)}>
									<Calendar size={16} {...stylex.props(styles.infoIcon)} />
									<div>
										<div {...stylex.props(styles.infoLabel)}>Joined</div>
										<div {...stylex.props(styles.infoValue)}>
											{new Date(user.createdAt).toLocaleDateString()}
										</div>
									</div>
								</div>
								<div {...stylex.props(styles.infoItem)}>
									<User size={16} {...stylex.props(styles.infoIcon)} />
									<div>
										<div {...stylex.props(styles.infoLabel)}>User ID</div>
										<div {...stylex.props(styles.infoValue)}>{userId}</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div {...stylex.props(styles.card)}>
						<div {...stylex.props(styles.cardHeader)}>
							<h2 {...stylex.props(styles.cardTitle)}>Statistics</h2>
						</div>
						<div {...stylex.props(styles.cardContent)}>
							<div {...stylex.props(styles.statsGrid)}>
								<div {...stylex.props(styles.stat)}>
									<div {...stylex.props(styles.statValue)}>{user.postCount}</div>
									<div {...stylex.props(styles.statLabel)}>Posts</div>
								</div>
								<div {...stylex.props(styles.stat)}>
									<div {...stylex.props(styles.statValue)}>{user.commentCount}</div>
									<div {...stylex.props(styles.statLabel)}>Comments</div>
								</div>
								<div {...stylex.props(styles.stat)}>
									<div {...stylex.props(styles.statValue)}>{user.bannedAt ? 1 : 0}</div>
									<div {...stylex.props(styles.statLabel)}>Warnings</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div {...stylex.props(styles.mainContent)}>
					<div {...stylex.props(styles.card)}>
						<div {...stylex.props(styles.cardHeader)}>
							<h2 {...stylex.props(styles.cardTitle)}>Recent Posts</h2>
						</div>
						<div {...stylex.props(styles.postsList)}>
							{posts.length === 0 ? (
								<p {...stylex.props(styles.emptyState)}>No posts yet.</p>
							) : (
								posts.map((post, index) => {
									const isLast = index === posts.length - 1;
									return (
										<div key={post.id} {...stylex.props(styles.post, isLast && styles.postLast)}>
											<p {...stylex.props(styles.postContent)}>{post.content}</p>
											<div {...stylex.props(styles.postMeta)}>
												<span {...stylex.props(styles.postMetaItem)}>
													<Heart size={12} /> {post.likeCount}
												</span>
												<span {...stylex.props(styles.postMetaItem)}>
													<MessageSquare size={12} /> {post.commentCount}
												</span>
												<span>{new Date(post.createdAt).toLocaleString()}</span>
											</div>
										</div>
									);
								})
							)}
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
