// Service handler interfaces for server-side implementations
// These interfaces define the expected shape of gRPC service handlers

import type {
	AuditLogsResponse,
	AuthResponse,
	BadgesResponse,
	BanUserRequest,
	BanUserResponse,
	BasicResponse,
	BookmarkResponse,
	BookmarkStatusResponse,
	CommentsResponse,
	ConversationResponse,
	ConversationsResponse,
	CountResponse,
	// Comments
	CreateCommentRequest,
	CreateCommentResponse,
	// Posts
	CreatePostRequest,
	CreatePostResponse,
	CreateReportRequest,
	CreateReportResponse,
	DashboardStatsResponse,
	DeleteCommentAdminRequest,
	DeleteCommentAdminResponse,
	DeleteCommentRequest,
	DeleteCommentResponse,
	DeleteNotificationRequest,
	DeleteNotificationResponse,
	DeletePostAdminRequest,
	DeletePostAdminResponse,
	DeletePostRequest,
	DeletePostResponse,
	DeleteUserRequest,
	DeleteUserResponse,
	FollowResponse,
	FollowStatusResponse,
	FriendRequestActionRequest,
	FriendRequestDecisionRequest,
	FriendRequestResponse,
	GetAuditLogsRequest,
	GetBookmarkedPostsRequest,
	GetBookmarkStatusRequest,
	GetCommentLikeStatusRequest,
	GetConversationsRequest,
	GetCountRequest,
	GetCurrentUserRequest,
	GetDashboardStatsRequest,
	GetExploreFeedRequest,
	GetFollowStatusRequest,
	// Feed
	GetHomeFeedRequest,
	GetLikeStatusRequest,
	GetMessagesRequest,
	// Notifications
	GetNotificationsRequest,
	GetNotificationsResponse,
	GetOrCreateConversationRequest,
	GetPostCommentsRequest,
	GetPostReactionsRequest,
	GetPostRequest,
	GetPostsRequest,
	GetRankedFeedRequest,
	GetReportRequest,
	GetShareCountRequest,
	GetUnreadCountRequest,
	GetUnreadCountResponse,
	GetUserBadgesRequest,
	GetUserDetailsRequest,
	GetUserPostsRequest,
	// Users
	GetUserRequest,
	ImprovePostRequest,
	ImprovePostResponse,
	LikeResponse,
	LikeStatusResponse,
	ListReportsRequest,
	ListReportsResponse,
	// Admin
	ListUsersRequest,
	ListUsersResponse,
	LoginRequest,
	LogoutRequest,
	LogoutResponse,
	MarkAllAsReadRequest,
	MarkAllAsReadResponse,
	MarkAsReadRequest,
	MarkAsReadResponse,
	MarkConversationReadRequest,
	MessageResponse,
	MessagesResponse,
	PostResponse,
	PostsResponse,
	PushTokenResponse,
	ReactionCountsResponse,
	ReactionResponse,
	ReactToCommentRequest,
	ReactToPostRequest,
	RecalculateBadgesRequest,
	RegisterPushTokenRequest,
	// Auth
	RegisterRequest,
	ReportResponse,
	RepostRequest,
	RepostResponse,
	ReviewReportRequest,
	ReviewReportResponse,
	// Search
	SearchRequest,
	SendMessageRequest,
	ShareCountResponse,
	SharePostRequest,
	SharePostResponse,
	// Bookmarks
	ToggleBookmarkRequest,
	ToggleCommentLikeRequest,
	// Follows
	ToggleFollowRequest,
	// Likes
	TogglePostLikeRequest,
	UnbanUserRequest,
	UnbanUserResponse,
	UnregisterPushTokenRequest,
	UpdatePostRequest,
	UpdatePostResponse,
	UpdateProfileRequest,
	UpdateProfileResponse,
	UpdateUserRoleRequest,
	UpdateUserRoleResponse,
	UserDetailsResponse,
	UserListRequest,
	UserListResponse,
	UserProfileResponse,
	UserResponse,
	UsersResponse,
	ValidateSessionRequest,
	ValidateSessionResponse,
} from "./index";

// AI Service Handler
export interface IAiService {
	improvePost(request: ImprovePostRequest): Promise<ImprovePostResponse>;
}

// Auth Service Handler
export interface IAuthService {
	register(request: RegisterRequest): Promise<AuthResponse>;
	login(request: LoginRequest): Promise<AuthResponse>;
	logout(request: LogoutRequest): Promise<LogoutResponse>;
	getCurrentUser(request: GetCurrentUserRequest): Promise<UserResponse>;
	validateSession(request: ValidateSessionRequest): Promise<ValidateSessionResponse>;
}

// Posts Service Handler
export interface IPostsService {
	createPost(request: CreatePostRequest): Promise<CreatePostResponse>;
	getPost(request: GetPostRequest): Promise<PostResponse>;
	updatePost(request: UpdatePostRequest): Promise<UpdatePostResponse>;
	deletePost(request: DeletePostRequest): Promise<DeletePostResponse>;
	getPosts(request: GetPostsRequest): Promise<PostsResponse>;
	getUserPosts(request: GetUserPostsRequest): Promise<PostsResponse>;
}

// Comments Service Handler
export interface ICommentsService {
	createComment(request: CreateCommentRequest): Promise<CreateCommentResponse>;
	getPostComments(request: GetPostCommentsRequest): Promise<CommentsResponse>;
	deleteComment(request: DeleteCommentRequest): Promise<DeleteCommentResponse>;
}

// Reports Service Handler
export interface IReportsService {
	createReport(request: CreateReportRequest): Promise<CreateReportResponse>;
}

// Likes Service Handler
export interface ILikesService {
	togglePostLike(request: TogglePostLikeRequest): Promise<LikeResponse>;
	toggleCommentLike(request: ToggleCommentLikeRequest): Promise<LikeResponse>;
	getPostLikeStatus(request: GetLikeStatusRequest): Promise<LikeStatusResponse>;
	getCommentLikeStatus(request: GetCommentLikeStatusRequest): Promise<LikeStatusResponse>;
	reactToPost(request: ReactToPostRequest): Promise<ReactionResponse>;
	reactToComment(request: ReactToCommentRequest): Promise<ReactionResponse>;
	getPostReactions(request: GetPostReactionsRequest): Promise<ReactionCountsResponse>;
}

// Follows Service Handler
export interface IFollowsService {
	toggleFollow(request: ToggleFollowRequest): Promise<FollowResponse>;
	getFollowStatus(request: GetFollowStatusRequest): Promise<FollowStatusResponse>;
	getFollowerCount(request: GetCountRequest): Promise<CountResponse>;
	getFollowingCount(request: GetCountRequest): Promise<CountResponse>;
	sendFriendRequest(request: FriendRequestActionRequest): Promise<FriendRequestResponse>;
	acceptFriendRequest(request: FriendRequestDecisionRequest): Promise<FriendRequestResponse>;
	rejectFriendRequest(request: FriendRequestDecisionRequest): Promise<FriendRequestResponse>;
	getFollowers(request: UserListRequest): Promise<UserListResponse>;
	getFollowing(request: UserListRequest): Promise<UserListResponse>;
	getFriends(request: UserListRequest): Promise<UserListResponse>;
}

// Feed Service Handler
export interface IFeedService {
	getHomeFeed(request: GetHomeFeedRequest): Promise<PostsResponse>;
	getExploreFeed(request: GetExploreFeedRequest): Promise<PostsResponse>;
	getRankedFeed(request: GetRankedFeedRequest): Promise<PostsResponse>;
}

// Search Service Handler
export interface ISearchService {
	searchPosts(request: SearchRequest): Promise<PostsResponse>;
	searchUsers(request: SearchRequest): Promise<UsersResponse>;
}

// Users Service Handler
export interface IUsersService {
	getUser(request: GetUserRequest): Promise<UserProfileResponse>;
	updateProfile(request: UpdateProfileRequest): Promise<UpdateProfileResponse>;
}

// Admin Service Handler
export interface IAdminService {
	listUsers(request: ListUsersRequest): Promise<ListUsersResponse>;
	getUserDetails(request: GetUserDetailsRequest): Promise<UserDetailsResponse>;
	banUser(request: BanUserRequest): Promise<BanUserResponse>;
	unbanUser(request: UnbanUserRequest): Promise<UnbanUserResponse>;
	updateUserRole(request: UpdateUserRoleRequest): Promise<UpdateUserRoleResponse>;
	deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse>;
	deletePostAdmin(request: DeletePostAdminRequest): Promise<DeletePostAdminResponse>;
	deleteCommentAdmin(request: DeleteCommentAdminRequest): Promise<DeleteCommentAdminResponse>;
	listReports(request: ListReportsRequest): Promise<ListReportsResponse>;
	getReport(request: GetReportRequest): Promise<ReportResponse>;
	reviewReport(request: ReviewReportRequest): Promise<ReviewReportResponse>;
	getDashboardStats(request: GetDashboardStatsRequest): Promise<DashboardStatsResponse>;
	getAuditLogs(request: GetAuditLogsRequest): Promise<AuditLogsResponse>;
}

// Notifications Service Handler
export interface INotificationsService {
	getNotifications(request: GetNotificationsRequest): Promise<GetNotificationsResponse>;
	getUnreadCount(request: GetUnreadCountRequest): Promise<GetUnreadCountResponse>;
	registerPushToken(request: RegisterPushTokenRequest): Promise<PushTokenResponse>;
	unregisterPushToken(request: UnregisterPushTokenRequest): Promise<PushTokenResponse>;
	markAsRead(request: MarkAsReadRequest): Promise<MarkAsReadResponse>;
	markAllAsRead(request: MarkAllAsReadRequest): Promise<MarkAllAsReadResponse>;
	deleteNotification(request: DeleteNotificationRequest): Promise<DeleteNotificationResponse>;
}

// Bookmarks Service Handler
export interface IBookmarksService {
	toggleBookmark(request: ToggleBookmarkRequest): Promise<BookmarkResponse>;
	getBookmarkStatus(request: GetBookmarkStatusRequest): Promise<BookmarkStatusResponse>;
	getBookmarkedPosts(request: GetBookmarkedPostsRequest): Promise<PostsResponse>;
}

// Social Service Handler
export interface ISocialService {
	sharePost(request: SharePostRequest): Promise<SharePostResponse>;
	repost(request: RepostRequest): Promise<RepostResponse>;
	getShareCount(request: GetShareCountRequest): Promise<ShareCountResponse>;
	getOrCreateConversation(request: GetOrCreateConversationRequest): Promise<ConversationResponse>;
	getConversations(request: GetConversationsRequest): Promise<ConversationsResponse>;
	sendMessage(request: SendMessageRequest): Promise<MessageResponse>;
	getMessages(request: GetMessagesRequest): Promise<MessagesResponse>;
	markConversationRead(request: MarkConversationReadRequest): Promise<BasicResponse>;
	getUserBadges(request: GetUserBadgesRequest): Promise<BadgesResponse>;
	recalculateBadges(request: RecalculateBadgesRequest): Promise<BadgesResponse>;
}
