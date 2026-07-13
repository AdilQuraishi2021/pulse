import * as stylex from "@stylexjs/stylex";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
	Bookmark,
	Compass,
	Home,
	LogIn,
	LogOut,
	MessageCircle,
	MessageSquare,
	Search,
	UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import { getCurrentUser, logoutUser } from "../../server/functions/auth";
import { getUnreadMessageCount } from "../../server/functions/social";
import { colors, radii, semanticColors, shadows, spacing, zIndex } from "../../tokens.stylex";
import { NotificationBell } from "../notifications/NotificationBell";

const styles = stylex.create({
	header: {
		position: "sticky",
		top: 0,
		zIndex: zIndex.sticky,
		backgroundColor: semanticColors.surfaceOverlay,
		backdropFilter: "blur(20px) saturate(180%)",
		borderBottom: `1px solid ${semanticColors.borderSubtle}`,
		boxShadow: "0 10px 30px -24px rgba(15, 23, 42, 0.45)",
	},
	container: {
		maxWidth: "76rem",
		marginLeft: "auto",
		marginRight: "auto",
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		"@media (min-width: 640px)": {
			paddingLeft: spacing.lg,
			paddingRight: spacing.lg,
		},
	},
	inner: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		height: "3.75rem",
	},
	logoLink: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		textDecoration: "none",
		flexShrink: 0,
	},
	logoIcon: {
		width: "2.25rem",
		height: "2.25rem",
		borderRadius: radii.lg,
		backgroundImage: `linear-gradient(135deg, ${colors.indigo500}, ${colors.cyan500})`,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		boxShadow: "0 4px 12px -2px rgba(99, 102, 241, 0.3)",
		transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
	},
	logoIconHover: {
		":hover": {
			boxShadow: "0 6px 16px -2px rgba(99, 102, 241, 0.4)",
			transform: "translateY(-1px)",
		},
	},
	logoText: {
		fontSize: "1.25rem",
		fontWeight: 800,
		backgroundImage: `linear-gradient(135deg, ${colors.indigo500}, ${colors.cyan500})`,
		backgroundClip: "text",
		WebkitBackgroundClip: "text",
		color: "transparent",
		letterSpacing: "0",
		display: "none",
		"@media (min-width: 640px)": {
			display: "block",
		},
	},
	nav: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		padding: "0.25rem",
		borderRadius: radii.xl,
		backgroundColor: semanticColors.bgTertiary,
		border: `1px solid ${semanticColors.borderSubtle}`,
	},
	navLink: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		paddingTop: "0.375rem",
		paddingBottom: "0.375rem",
		borderRadius: radii.lg,
		transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
		textDecoration: "none",
		color: semanticColors.textSecondary,
		fontSize: "0.875rem",
		fontWeight: 600,
		":hover": {
			backgroundColor: semanticColors.bgPrimary,
			color: semanticColors.textPrimary,
		},
		"@media (min-width: 768px)": {
			paddingLeft: spacing.md,
			paddingRight: spacing.md,
		},
	},
	navLinkActive: {
		backgroundColor: semanticColors.bgPrimary,
		color: semanticColors.primary,
		boxShadow: shadows.sm,
	},
	navIconWrapper: {
		position: "relative",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		width: "1.25rem",
		height: "1.25rem",
		flexShrink: 0,
	},
	navBadge: {
		position: "absolute",
		top: "-0.55rem",
		right: "-0.6rem",
		minWidth: "1rem",
		height: "1rem",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		paddingLeft: "0.25rem",
		paddingRight: "0.25rem",
		borderRadius: radii.full,
		backgroundColor: colors.red500,
		color: colors.white,
		borderWidth: "2px",
		borderStyle: "solid",
		borderColor: semanticColors.bgTertiary,
		fontSize: "0.625rem",
		fontWeight: 800,
		lineHeight: 1,
	},
	navLinkText: {
		display: "none",
		"@media (min-width: 768px)": {
			display: "block",
		},
	},
	userActions: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		flexShrink: 0,
	},
	profileLink: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		paddingLeft: "0.375rem",
		paddingRight: spacing.md,
		paddingTop: "0.375rem",
		paddingBottom: "0.375rem",
		borderRadius: radii.full,
		textDecoration: "none",
		transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
		":hover": {
			backgroundColor: semanticColors.bgHover,
		},
	},
	profileAvatar: {
		width: "2rem",
		height: "2rem",
		borderRadius: radii.full,
		backgroundImage: `linear-gradient(135deg, ${colors.indigo500}, ${colors.purple600})`,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		boxShadow: "0 2px 8px -2px rgba(99, 102, 241, 0.3)",
	},
	profileInitial: {
		color: colors.white,
		fontWeight: 700,
		fontSize: "0.8rem",
	},
	profileName: {
		fontWeight: 500,
		color: semanticColors.textSecondary,
		fontSize: "0.875rem",
		display: "none",
		"@media (min-width: 1024px)": {
			display: "block",
		},
	},
	logoutButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		borderRadius: radii.lg,
		backgroundColor: "transparent",
		border: "none",
		cursor: "pointer",
		color: semanticColors.textTertiary,
		transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
		":hover": {
			backgroundColor: colors.red50,
			color: colors.red500,
		},
	},
	authLink: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		minHeight: "2.25rem",
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		borderRadius: radii.lg,
		textDecoration: "none",
		fontSize: "0.875rem",
		fontWeight: 700,
		color: semanticColors.textSecondary,
		":hover": {
			backgroundColor: semanticColors.bgHover,
			color: semanticColors.textPrimary,
		},
		"@media (min-width: 640px)": {
			paddingLeft: spacing.md,
			paddingRight: spacing.md,
		},
	},
	authLinkPrimary: {
		backgroundColor: semanticColors.primary,
		color: colors.white,
		boxShadow: shadows.indigoSm,
		":hover": {
			backgroundColor: semanticColors.primaryActive,
			color: colors.white,
		},
	},
	authText: {
		display: "none",
		"@media (min-width: 640px)": {
			display: "inline",
		},
	},
	logoutText: {
		display: "none",
		fontWeight: 500,
		fontSize: "0.875rem",
		"@media (min-width: 1024px)": {
			display: "block",
		},
	},
	iconWhite: {
		color: colors.white,
	},
});

export function Header() {
	const navigate = useNavigate();
	const location = useLocation();
	const [user, setUser] = useState<{ username: string; displayName: string } | null>(null);
	const [messageUnreadCount, setMessageUnreadCount] = useState(0);

	const loadUser = useCallback(async () => {
		try {
			const currentUser = await getCurrentUser();
			setUser(currentUser);
			if (!currentUser) {
				setMessageUnreadCount(0);
			}
		} catch (error) {
			console.error("Failed to load user:", error);
		}
	}, []);

	const loadUnreadMessages = useCallback(async () => {
		if (!user) {
			setMessageUnreadCount(0);
			return;
		}

		try {
			const count = await getUnreadMessageCount();
			setMessageUnreadCount(count);
		} catch (error) {
			console.error("Failed to load unread messages:", error);
		}
	}, [user]);

	useEffect(() => {
		if (location.pathname.startsWith("/auth/")) {
			return;
		}

		loadUser();
	}, [loadUser, location.pathname]);

	useEffect(() => {
		loadUnreadMessages();
	}, [loadUnreadMessages]);

	useLiveRefresh(loadUnreadMessages, { intervalMs: 5000, enabled: Boolean(user) });

	const handleLogout = async () => {
		try {
			await logoutUser();
			setUser(null);
			setMessageUnreadCount(0);
			navigate({ to: "/auth/login" });
		} catch (error) {
			console.error("Failed to logout:", error);
		}
	};

	// Don't show header on auth pages
	if (location.pathname.startsWith("/auth/")) {
		return null;
	}

	const isActive = (path: string) => location.pathname === path;

	return (
		<header {...stylex.props(styles.header)}>
			<div {...stylex.props(styles.container)}>
				<div {...stylex.props(styles.inner)}>
					{/* Logo */}
					<Link to="/" {...stylex.props(styles.logoLink)}>
						<div {...stylex.props(styles.logoIcon, styles.logoIconHover)}>
							<MessageCircle {...stylex.props(styles.iconWhite)} size={20} />
						</div>
						<span {...stylex.props(styles.logoText)}>Pulse</span>
					</Link>

					{/* Navigation */}
					<nav {...stylex.props(styles.nav)}>
						<Link to="/" {...stylex.props(styles.navLink, isActive("/") && styles.navLinkActive)}>
							<Home size={20} />
							<span {...stylex.props(styles.navLinkText)}>Home</span>
						</Link>

						<Link
							to="/explore"
							{...stylex.props(styles.navLink, isActive("/explore") && styles.navLinkActive)}
						>
							<Compass size={20} />
							<span {...stylex.props(styles.navLinkText)}>Explore</span>
						</Link>

						<Link
							to="/search"
							{...stylex.props(styles.navLink, isActive("/search") && styles.navLinkActive)}
						>
							<Search size={20} />
							<span {...stylex.props(styles.navLinkText)}>Search</span>
						</Link>

						<Link
							to="/bookmarks"
							{...stylex.props(styles.navLink, isActive("/bookmarks") && styles.navLinkActive)}
						>
							<Bookmark size={20} />
							<span {...stylex.props(styles.navLinkText)}>Bookmarks</span>
						</Link>

						<Link
							to="/messages"
							{...stylex.props(styles.navLink, isActive("/messages") && styles.navLinkActive)}
						>
							<span {...stylex.props(styles.navIconWrapper)}>
								<MessageSquare size={20} />
								{messageUnreadCount > 0 && (
									<span {...stylex.props(styles.navBadge)}>
										{messageUnreadCount > 99 ? "99+" : messageUnreadCount}
									</span>
								)}
							</span>
							<span {...stylex.props(styles.navLinkText)}>Messages</span>
						</Link>
					</nav>

					{/* User Actions */}
					{user ? (
						<div {...stylex.props(styles.userActions)}>
							<NotificationBell isActive={isActive("/notifications")} />

							<Link
								to="/users/$username"
								params={{ username: user.username }}
								{...stylex.props(styles.profileLink)}
							>
								<div {...stylex.props(styles.profileAvatar)}>
									<span {...stylex.props(styles.profileInitial)}>
										{user.displayName.charAt(0).toUpperCase()}
									</span>
								</div>
								<span {...stylex.props(styles.profileName)}>{user.displayName}</span>
							</Link>

							<button
								type="button"
								onClick={handleLogout}
								{...stylex.props(styles.logoutButton)}
								title="Logout"
							>
								<LogOut size={20} />
								<span {...stylex.props(styles.logoutText)}>Logout</span>
							</button>
						</div>
					) : (
						<div {...stylex.props(styles.userActions)}>
							<Link to="/auth/login" {...stylex.props(styles.authLink)}>
								<LogIn size={18} />
								<span {...stylex.props(styles.authText)}>Log in</span>
							</Link>
							<Link to="/auth/register" {...stylex.props(styles.authLink, styles.authLinkPrimary)}>
								<UserPlus size={18} />
								<span {...stylex.props(styles.authText)}>Join</span>
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
