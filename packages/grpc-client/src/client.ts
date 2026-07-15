import {
	AdminServiceClient,
	AiServiceClient,
	AuthServiceClient,
	BookmarksServiceClient,
	CommentsServiceClient,
	FeedServiceClient,
	FollowsServiceClient,
	LikesServiceClient,
	NotificationsServiceClient,
	PostsServiceClient,
	ReportsServiceClient,
	SearchServiceClient,
	SocialServiceClient,
	UsersServiceClient,
} from "@chirp/proto";
import { ChannelCredentials } from "@grpc/grpc-js";
import { GrpcTransport } from "@protobuf-ts/grpc-transport";

export interface ChirpClientConfig {
	host: string;
	secure?: boolean;
	httpUrl?: string;
}

export interface ChirpClient {
	ai: AiServiceClient;
	auth: AuthServiceClient;
	posts: PostsServiceClient;
	reports: ReportsServiceClient;
	comments: CommentsServiceClient;
	likes: LikesServiceClient;
	follows: FollowsServiceClient;
	feed: FeedServiceClient;
	search: SearchServiceClient;
	social: SocialServiceClient;
	users: UsersServiceClient;
	admin: AdminServiceClient;
	notifications: NotificationsServiceClient;
	bookmarks: BookmarksServiceClient;
	transport: GrpcTransport;
}

/**
 * Creates a gRPC client for the Chirp API
 */
export function createChirpClient(config: ChirpClientConfig): ChirpClient {
	const { host, secure = false, httpUrl } = config;

	if (httpUrl) {
		return createHttpChirpClient(httpUrl);
	}

	const channelCredentials = secure
		? ChannelCredentials.createSsl()
		: ChannelCredentials.createInsecure();

	const transport = new GrpcTransport({
		host,
		channelCredentials,
	});

	return {
		ai: new AiServiceClient(transport),
		auth: new AuthServiceClient(transport),
		posts: new PostsServiceClient(transport),
		reports: new ReportsServiceClient(transport),
		comments: new CommentsServiceClient(transport),
		likes: new LikesServiceClient(transport),
		follows: new FollowsServiceClient(transport),
		feed: new FeedServiceClient(transport),
		search: new SearchServiceClient(transport),
		social: new SocialServiceClient(transport),
		users: new UsersServiceClient(transport),
		admin: new AdminServiceClient(transport),
		notifications: new NotificationsServiceClient(transport),
		bookmarks: new BookmarksServiceClient(transport),
		transport,
	};
}

function createHttpChirpClient(httpUrl: string): ChirpClient {
	const baseUrl = httpUrl.replace(/\/$/, "");
	const serviceNames = [
		"admin",
		"ai",
		"auth",
		"bookmarks",
		"comments",
		"feed",
		"follows",
		"likes",
		"notifications",
		"posts",
		"reports",
		"search",
		"social",
		"users",
	] as const;

	const createService = (serviceName: (typeof serviceNames)[number]) =>
		new Proxy(
			{},
			{
				get(_target, property) {
					if (typeof property !== "string") {
						return undefined;
					}

					return async (request: unknown) => {
						const response = await fetch(`${baseUrl}/rpc/${serviceName}/${property}`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify(request ?? {}),
						});

						const body = await response.json().catch(() => ({}));
						if (!response.ok) {
							throw new Error(body.error || `HTTP RPC failed: ${response.status}`);
						}

						return body;
					};
				},
			},
		);

	const client = Object.fromEntries(
		serviceNames.map((serviceName) => [serviceName, createService(serviceName)]),
	) as unknown as ChirpClient;

	return {
		...client,
		transport: undefined as unknown as GrpcTransport,
	};
}

/**
 * Default API host for development
 */
export const DEFAULT_GRPC_HOST = "localhost:50051";
