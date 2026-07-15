import * as stylex from "@stylexjs/stylex";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { checkAdminAuth, loginAdmin } from "../server/functions/auth";
import { colors, fontSize, fontWeight, radii, semanticColors, spacing } from "../tokens.stylex";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		// If already logged in as admin, redirect to dashboard
		const { isAuthenticated } = await checkAdminAuth();
		if (isAuthenticated) {
			throw redirect({ to: "/" });
		}
	},
	component: LoginPage,
});

const styles = stylex.create({
	container: {
		minHeight: "100vh",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: semanticColors.bgPrimary,
		padding: spacing.lg,
	},
	card: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.xl,
		padding: spacing["2xl"],
		width: "100%",
		maxWidth: "400px",
		border: `1px solid ${semanticColors.borderSubtle}`,
		boxShadow: "0 18px 45px -30px rgba(15, 23, 42, 0.55)",
	},
	iconWrap: {
		width: "3rem",
		height: "3rem",
		borderRadius: radii.xl,
		backgroundColor: semanticColors.primaryLight,
		color: semanticColors.primary,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		marginInline: "auto",
		marginBottom: spacing.md,
	},
	header: {
		textAlign: "center",
		marginBottom: spacing.xl,
	},
	title: {
		fontSize: fontSize["2xl"],
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
		marginBottom: spacing.xs,
	},
	subtitle: {
		fontSize: fontSize.sm,
		color: semanticColors.textTertiary,
	},
	form: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.md,
	},
	inputGroup: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.xs,
	},
	inputWrapper: {
		position: "relative",
	},
	inputIcon: {
		position: "absolute",
		left: spacing.md,
		top: "50%",
		transform: "translateY(-50%)",
		color: semanticColors.textTertiary,
		pointerEvents: "none",
	},
	label: {
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: semanticColors.textSecondary,
	},
	input: {
		width: "100%",
		padding: `${spacing.sm} ${spacing.md} ${spacing.sm} 2.5rem`,
		backgroundColor: semanticColors.surfaceInput,
		border: `1px solid ${semanticColors.borderDefault}`,
		borderRadius: radii.lg,
		color: semanticColors.textPrimary,
		fontSize: fontSize.base,
		outline: "none",
		transition: "border-color 0.2s",
		":focus": {
			borderColor: semanticColors.borderFocus,
		},
		"::placeholder": {
			color: semanticColors.textMuted,
		},
	},
	button: {
		width: "100%",
		padding: `${spacing.sm} ${spacing.md}`,
		backgroundImage: `linear-gradient(135deg, ${colors.indigo500}, ${colors.blue600})`,
		color: colors.white,
		border: "none",
		borderRadius: radii.lg,
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		cursor: "pointer",
		transition: "background-color 0.2s",
		marginTop: spacing.sm,
		":hover": {
			backgroundColor: semanticColors.primaryHover,
		},
		":disabled": {
			opacity: 0.6,
			cursor: "not-allowed",
		},
	},
	error: {
		backgroundColor: semanticColors.errorLight,
		border: `1px solid ${semanticColors.error}`,
		borderRadius: radii.md,
		padding: spacing.sm,
		color: semanticColors.error,
		fontSize: fontSize.sm,
		textAlign: "center",
	},
	info: {
		marginTop: spacing.lg,
		padding: spacing.md,
		backgroundColor: semanticColors.bgSecondary,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
		fontSize: fontSize.xs,
		color: semanticColors.textTertiary,
		textAlign: "center",
	},
});

function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			await loginAdmin({ data: { email, password } });
			navigate({ to: "/" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.card)}>
				<div {...stylex.props(styles.header)}>
					<div {...stylex.props(styles.iconWrap)}>
						<ShieldCheck size={24} />
					</div>
					<h1 {...stylex.props(styles.title)}>Pulse Admin</h1>
					<p {...stylex.props(styles.subtitle)}>Sign in to access the admin dashboard</p>
				</div>

				<form {...stylex.props(styles.form)} onSubmit={handleSubmit}>
					{error && <div {...stylex.props(styles.error)}>{error}</div>}

					<div {...stylex.props(styles.inputGroup)}>
						<label {...stylex.props(styles.label)} htmlFor="email">
							Email
						</label>
						<div {...stylex.props(styles.inputWrapper)}>
							<Mail size={16} {...stylex.props(styles.inputIcon)} />
							<input
								{...stylex.props(styles.input)}
								id="email"
								name="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="admin@chirp.test"
								required
								autoComplete="email"
							/>
						</div>
					</div>

					<div {...stylex.props(styles.inputGroup)}>
						<label {...stylex.props(styles.label)} htmlFor="password">
							Password
						</label>
						<div {...stylex.props(styles.inputWrapper)}>
							<Lock size={16} {...stylex.props(styles.inputIcon)} />
							<input
								{...stylex.props(styles.input)}
								id="password"
								name="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								required
								autoComplete="current-password"
							/>
						</div>
					</div>

					<button {...stylex.props(styles.button)} type="submit" disabled={isLoading}>
						{isLoading ? "Signing in..." : "Sign in"}
					</button>
				</form>

				<div {...stylex.props(styles.info)}>
					Verified admin and moderator roles only. Access is session protected.
				</div>
			</div>
		</div>
	);
}
