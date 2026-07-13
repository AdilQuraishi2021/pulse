import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Send, UserX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import { RelativeTime } from "../components/shared/RelativeTime";
import { UserAvatar } from "../components/users/UserAvatar";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { getCurrentUser } from "../server/functions/auth";
import {
	getConversations,
	getMessages,
	markConversationRead,
	sendMessage,
} from "../server/functions/social";
import {
	colors,
	fontSize,
	fontWeight,
	radii,
	semanticColors,
	shadows,
	spacing,
} from "../tokens.stylex";

export const Route = createFileRoute("/messages")({
	component: MessagesPage,
});

type Conversation = {
	id: string;
	participants: Array<{
		id: string;
		username: string;
		displayName: string;
		avatarUrl?: string;
	}>;
	unreadCount: number;
	lastMessage?: string;
	updatedAt: Date;
};

type Message = {
	id: string;
	conversationId: string;
	sender: {
		id: string;
		username: string;
		displayName: string;
		avatarUrl?: string;
	} | null;
	content: string;
	read: boolean;
	createdAt: Date;
};

const styles = stylex.create({
	container: {
		maxWidth: "68rem",
		marginLeft: "auto",
		marginRight: "auto",
		padding: spacing.lg,
		display: "grid",
		gridTemplateColumns: "minmax(16rem, 20rem) 1fr",
		gap: spacing.lg,
		"@media (max-width: 760px)": {
			gridTemplateColumns: "1fr",
		},
	},
	panel: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.lg,
		border: `1px solid ${semanticColors.borderSubtle}`,
		boxShadow: shadows.card,
		minHeight: "32rem",
		overflow: "hidden",
	},
	sidebarHeader: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.lg,
		borderBottom: `1px solid ${semanticColors.borderSubtle}`,
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
	},
	conversationButton: {
		width: "100%",
		display: "grid",
		gridTemplateColumns: "2.5rem 1fr",
		gap: spacing.md,
		padding: spacing.md,
		border: "none",
		borderBottom: `1px solid ${semanticColors.borderSubtle}`,
		backgroundColor: "transparent",
		textAlign: "left",
		cursor: "pointer",
		":hover": {
			backgroundColor: semanticColors.bgHover,
		},
	},
	conversationButtonActive: {
		backgroundColor: semanticColors.primaryLight,
	},
	conversationMeta: {
		minWidth: 0,
	},
	conversationName: {
		fontSize: fontSize.sm,
		fontWeight: fontWeight.semibold,
		color: semanticColors.textPrimary,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
	conversationPreview: {
		fontSize: fontSize.xs,
		color: semanticColors.textSecondary,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
		marginTop: "0.125rem",
	},
	unread: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		minWidth: "1.25rem",
		height: "1.25rem",
		paddingLeft: spacing.xs,
		paddingRight: spacing.xs,
		borderRadius: radii.full,
		backgroundColor: colors.red500,
		color: colors.white,
		fontSize: fontSize.xs,
		fontWeight: fontWeight.bold,
		marginTop: spacing.xs,
	},
	chat: {
		display: "grid",
		gridTemplateRows: "auto 1fr auto",
	},
	chatHeader: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
		padding: spacing.lg,
		borderBottom: `1px solid ${semanticColors.borderSubtle}`,
	},
	chatTitle: {
		fontWeight: fontWeight.bold,
		color: semanticColors.textPrimary,
	},
	chatSubtitle: {
		fontSize: fontSize.xs,
		color: semanticColors.textSecondary,
	},
	messageList: {
		padding: spacing.lg,
		display: "flex",
		flexDirection: "column",
		gap: spacing.md,
		overflowY: "auto",
		minHeight: "22rem",
	},
	messageRow: {
		display: "flex",
	},
	messageRowOwn: {
		justifyContent: "flex-end",
	},
	bubble: {
		maxWidth: "75%",
		padding: spacing.md,
		borderRadius: radii.lg,
		backgroundColor: semanticColors.bgSecondary,
		color: semanticColors.textPrimary,
		fontSize: fontSize.sm,
		lineHeight: "1.5",
	},
	bubbleOwn: {
		backgroundColor: semanticColors.primary,
		color: colors.white,
	},
	messageTime: {
		marginTop: spacing.xs,
		fontSize: fontSize.xs,
		color: semanticColors.textTertiary,
	},
	composer: {
		display: "grid",
		gridTemplateColumns: "1fr auto",
		gap: spacing.sm,
		padding: spacing.lg,
		borderTop: `1px solid ${semanticColors.borderSubtle}`,
	},
	input: {
		borderRadius: radii.full,
		border: `1px solid ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.surfaceInput,
		color: semanticColors.textPrimary,
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
		minHeight: "2.5rem",
		outline: "none",
	},
	sendButton: {
		width: "2.5rem",
		height: "2.5rem",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radii.full,
		border: "none",
		backgroundColor: semanticColors.primary,
		color: colors.white,
		cursor: "pointer",
		":disabled": {
			opacity: 0.6,
			cursor: "not-allowed",
		},
	},
	empty: {
		minHeight: "32rem",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.md,
		color: semanticColors.textSecondary,
		textAlign: "center",
		padding: spacing["2xl"],
	},
});

function MessagesPage() {
	const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [draft, setDraft] = useState("");
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);

	const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);
	const otherParticipant = selectedConversation?.participants.find(
		(participant) => participant.id !== currentUser?.id,
	);

	const loadConversations = useCallback(async () => {
		try {
			const [user, nextConversations] = await Promise.all([
				getCurrentUser(),
				getConversations({ data: { limit: 30 } }),
			]);
			setCurrentUser(user);
			setConversations(nextConversations);

			const requestedId =
				typeof window !== "undefined"
					? new URLSearchParams(window.location.search).get("conversationId")
					: null;
			setSelectedId(
				(currentSelectedId) => requestedId || currentSelectedId || nextConversations[0]?.id || null,
			);
		} finally {
			setLoading(false);
		}
	}, []);

	const loadMessages = useCallback(async () => {
		if (!selectedId) {
			setMessages([]);
			return;
		}
		const nextMessages = await getMessages({ data: { conversationId: selectedId } });
		setMessages(nextMessages);
		await markConversationRead({ data: selectedId });
	}, [selectedId]);

	useEffect(() => {
		void loadConversations();
	}, [loadConversations]);

	useEffect(() => {
		void loadMessages();
	}, [loadMessages]);

	useLiveRefresh(() => {
		void loadConversations();
		void loadMessages();
	});

	const handleSend = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!selectedId || !draft.trim() || sending) return;

		setSending(true);
		try {
			const message = await sendMessage({
				data: { conversationId: selectedId, content: draft.trim() },
			});
			setMessages((current) => [...current, message]);
			setDraft("");
			await loadConversations();
		} finally {
			setSending(false);
		}
	};

	if (loading) {
		return (
			<div {...stylex.props(styles.empty)}>
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	return (
		<div {...stylex.props(styles.container)}>
			<aside {...stylex.props(styles.panel)}>
				<div {...stylex.props(styles.sidebarHeader)}>
					<MessageSquare size={18} />
					<span>Messages</span>
				</div>

				{conversations.length > 0 ? (
					conversations.map((conversation) => {
						const participant =
							conversation.participants.find((item) => item.id !== currentUser?.id) ||
							conversation.participants[0];
						return (
							<button
								key={conversation.id}
								type="button"
								onClick={() => setSelectedId(conversation.id)}
								{...stylex.props(
									styles.conversationButton,
									conversation.id === selectedId && styles.conversationButtonActive,
								)}
							>
								<UserAvatar
									avatarUrl={participant?.avatarUrl}
									username={participant?.username || "user"}
								/>
								<div {...stylex.props(styles.conversationMeta)}>
									<div {...stylex.props(styles.conversationName)}>
										{participant?.displayName || "Conversation"}
									</div>
									<div {...stylex.props(styles.conversationPreview)}>
										{conversation.lastMessage || "No messages yet"}
									</div>
									{conversation.unreadCount > 0 && (
										<span {...stylex.props(styles.unread)}>{conversation.unreadCount}</span>
									)}
								</div>
							</button>
						);
					})
				) : (
					<div {...stylex.props(styles.empty)}>
						<UserX size={28} />
						<span>Open a profile and choose Message to start a conversation.</span>
					</div>
				)}
			</aside>

			<section {...stylex.props(styles.panel, styles.chat)}>
				{selectedConversation && otherParticipant ? (
					<>
						<div {...stylex.props(styles.chatHeader)}>
							<Link to="/users/$username" params={{ username: otherParticipant.username }}>
								<UserAvatar
									avatarUrl={otherParticipant.avatarUrl}
									username={otherParticipant.username}
								/>
							</Link>
							<div>
								<div {...stylex.props(styles.chatTitle)}>{otherParticipant.displayName}</div>
								<div {...stylex.props(styles.chatSubtitle)}>@{otherParticipant.username}</div>
							</div>
						</div>

						<div {...stylex.props(styles.messageList)}>
							{messages.map((message) => {
								const isOwn = message.sender?.id === currentUser?.id;
								return (
									<div
										key={message.id}
										{...stylex.props(styles.messageRow, isOwn && styles.messageRowOwn)}
									>
										<div {...stylex.props(styles.bubble, isOwn && styles.bubbleOwn)}>
											<div>{message.content}</div>
											<div {...stylex.props(styles.messageTime)}>
												<RelativeTime date={message.createdAt} />
											</div>
										</div>
									</div>
								);
							})}
						</div>

						<form onSubmit={handleSend} {...stylex.props(styles.composer)}>
							<input
								value={draft}
								onChange={(event) => setDraft(event.target.value)}
								placeholder="Write a message"
								{...stylex.props(styles.input)}
							/>
							<button
								type="submit"
								disabled={sending || !draft.trim()}
								{...stylex.props(styles.sendButton)}
								title="Send message"
							>
								<Send size={18} />
							</button>
						</form>
					</>
				) : (
					<div {...stylex.props(styles.empty)}>
						<MessageSquare size={32} />
						<span>Select a conversation to start messaging.</span>
					</div>
				)}
			</section>
		</div>
	);
}
