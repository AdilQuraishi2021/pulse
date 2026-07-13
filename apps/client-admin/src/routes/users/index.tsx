import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, Eye, Search, Shield, Trash2, User, UserCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { requireAdminAccess } from "../../lib/auth-guard";
import {
	banAdminUser,
	deleteAdminUser,
	listAdminUsers,
	unbanAdminUser,
	updateAdminUserRole,
} from "../../server/functions/admin";
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
	searchContainer: {
		position: "relative",
		width: "300px",
	},
	filters: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
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
	avatarImg: {
		width: "40px",
		height: "40px",
		borderRadius: "50%",
		objectFit: "cover",
	},
	userInfo: {
		display: "flex",
		flexDirection: "column",
	},
	userName: {
		color: semanticColors.textPrimary,
		fontWeight: 500,
	},
	userHandle: {
		color: semanticColors.textTertiary,
		fontSize: "0.75rem",
	},
	badge: {
		display: "inline-flex",
		alignItems: "center",
		paddingInline: spacing.sm,
		paddingBlock: "2px",
		borderRadius: radii.full,
		fontSize: "0.75rem",
		fontWeight: 500,
	},
	badgeUser: {
		backgroundColor: colors.slate700,
		color: colors.slate300,
	},
	badgeModerator: {
		backgroundColor: colors.blue900,
		color: colors.blue400,
	},
	badgeAdmin: {
		backgroundColor: "#581c87",
		color: "#c084fc",
	},
	badgeBanned: {
		backgroundColor: colors.red900,
		color: colors.red400,
	},
	statusActive: {
		color: colors.green400,
	},
	statusBanned: {
		color: colors.red400,
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
	viewLink: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.sm,
		borderRadius: radii.md,
		textDecoration: "none",
		color: semanticColors.textTertiary,
		":hover": {
			backgroundColor: semanticColors.bgHover,
			color: semanticColors.textPrimary,
		},
	},
	roleSelect: {
		paddingBlock: spacing.xs,
		paddingInline: spacing.sm,
		borderRadius: radii.md,
		border: `1px solid ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.surfaceInput,
		color: semanticColors.textPrimary,
		fontSize: "0.75rem",
	},
	emptyState: {
		textAlign: "center",
		color: semanticColors.textTertiary,
		padding: spacing.xl,
	},
});

export const Route = createFileRoute("/users/")({
	beforeLoad: requireAdminAccess,
	component: UsersPage,
});

interface AdminUser {
	id: string;
	username: string;
	displayName: string;
	email: string;
	avatarUrl: string | null;
	role: "user" | "admin" | "moderator";
	bannedAt: string | null;
	bannedReason: string | null;
	postCount: number;
	commentCount: number;
	createdAt: string;
}

function UsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadUsers = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await listAdminUsers({ data: { searchQuery, roleFilter } });
			setUsers(response.users);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load users");
		} finally {
			setIsLoading(false);
		}
	}, [searchQuery, roleFilter]);

	useEffect(() => {
		loadUsers();
	}, [loadUsers]);

	const handleBanToggle = async (user: AdminUser) => {
		try {
			if (user.bannedAt) {
				await unbanAdminUser({ data: { userId: user.id } });
			} else {
				const reason = window.prompt("Reason for banning this user?", "Policy violation");
				if (!reason) return;
				await banAdminUser({ data: { userId: user.id, reason } });
			}
			await loadUsers();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to update user status");
		}
	};

	const handleRoleChange = async (userId: string, role: AdminUser["role"]) => {
		try {
			await updateAdminUserRole({ data: { userId, role } });
			await loadUsers();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to update role");
		}
	};

	const handleDelete = async (user: AdminUser) => {
		if (!window.confirm(`Delete @${user.username}? This cannot be undone.`)) return;
		try {
			await deleteAdminUser({ data: { userId: user.id } });
			await loadUsers();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to delete user");
		}
	};

	const getRoleBadgeStyle = (role: string) => {
		switch (role) {
			case "admin":
				return styles.badgeAdmin;
			case "moderator":
				return styles.badgeModerator;
			default:
				return styles.badgeUser;
		}
	};

	const getRoleIcon = (role: string) => {
		switch (role) {
			case "admin":
				return Shield;
			case "moderator":
				return Shield;
			default:
				return User;
		}
	};

	return (
		<main {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.header)}>
				<h1 {...stylex.props(styles.title)}>Users</h1>
				<div {...stylex.props(styles.filters)}>
					<select
						value={roleFilter}
						onChange={(event) => setRoleFilter(event.target.value)}
						{...stylex.props(styles.roleSelect)}
					>
						<option value="all">All Roles</option>
						<option value="user">Users</option>
						<option value="moderator">Moderators</option>
						<option value="admin">Admins</option>
					</select>
					<div {...stylex.props(styles.searchContainer)}>
						<Search size={16} {...stylex.props(styles.searchIcon)} />
						<input
							type="text"
							placeholder="Search users..."
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							{...stylex.props(styles.searchInput)}
						/>
					</div>
				</div>
			</header>

			{error && <p {...stylex.props(styles.emptyState)}>{error}</p>}

			<table {...stylex.props(styles.table)}>
				<thead {...stylex.props(styles.tableHeader)}>
					<tr>
						<th {...stylex.props(styles.th)}>User</th>
						<th {...stylex.props(styles.th)}>Email</th>
						<th {...stylex.props(styles.th)}>Role</th>
						<th {...stylex.props(styles.th)}>Status</th>
						<th {...stylex.props(styles.th)}>Posts</th>
						<th {...stylex.props(styles.th)}>Joined</th>
						<th {...stylex.props(styles.th)}>Actions</th>
					</tr>
				</thead>
				<tbody>
					{isLoading ? (
						<tr>
							<td colSpan={7} {...stylex.props(styles.emptyState)}>
								Loading users...
							</td>
						</tr>
					) : users.length === 0 ? (
						<tr>
							<td colSpan={7} {...stylex.props(styles.emptyState)}>
								No users found.
							</td>
						</tr>
					) : (
						users.map((user, index) => {
							const isLast = index === users.length - 1;
							const RoleIcon = getRoleIcon(user.role);
							return (
								<tr key={user.id} {...stylex.props(styles.tableRow, isLast && styles.tableRowLast)}>
									<td {...stylex.props(styles.td)}>
										<div {...stylex.props(styles.userCell)}>
											<div {...stylex.props(styles.avatar)}>
												{user.avatarUrl ? (
													<img
														src={user.avatarUrl}
														alt={user.displayName}
														{...stylex.props(styles.avatarImg)}
													/>
												) : (
													<User size={20} />
												)}
											</div>
											<div {...stylex.props(styles.userInfo)}>
												<span {...stylex.props(styles.userName)}>{user.displayName}</span>
												<span {...stylex.props(styles.userHandle)}>@{user.username}</span>
											</div>
										</div>
									</td>
									<td {...stylex.props(styles.td)}>{user.email}</td>
									<td {...stylex.props(styles.td)}>
										<span {...stylex.props(styles.badge, getRoleBadgeStyle(user.role))}>
											<RoleIcon size={12} style={{ marginRight: "4px" }} />
											{user.role}
										</span>
									</td>
									<td {...stylex.props(styles.td)}>
										<span
											{...stylex.props(user.bannedAt ? styles.statusBanned : styles.statusActive)}
										>
											{user.bannedAt ? "Banned" : "Active"}
										</span>
									</td>
									<td {...stylex.props(styles.td)}>{user.postCount}</td>
									<td {...stylex.props(styles.td)}>
										{new Date(user.createdAt).toLocaleDateString()}
									</td>
									<td {...stylex.props(styles.td)}>
										<div {...stylex.props(styles.actionsCell)}>
											<select
												value={user.role}
												onChange={(event) =>
													handleRoleChange(user.id, event.target.value as AdminUser["role"])
												}
												aria-label={`Change role for ${user.username}`}
												{...stylex.props(styles.roleSelect)}
											>
												<option value="user">user</option>
												<option value="moderator">moderator</option>
												<option value="admin">admin</option>
											</select>
											<Link
												to="/users/$userId"
												params={{ userId: user.id }}
												{...stylex.props(styles.viewLink)}
											>
												<Eye size={16} />
											</Link>
											<button
												type="button"
												onClick={() => handleBanToggle(user)}
												title={user.bannedAt ? "Unban user" : "Ban user"}
												{...stylex.props(styles.actionButton)}
											>
												{user.bannedAt ? <UserCheck size={16} /> : <Ban size={16} />}
											</button>
											<button
												type="button"
												onClick={() => handleDelete(user)}
												title="Delete user"
												{...stylex.props(styles.actionButton)}
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
