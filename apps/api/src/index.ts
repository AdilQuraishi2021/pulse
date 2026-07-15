import "./env";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { startGrpcServer } from "./grpc/server";
import { initializeSocketServer } from "./realtime/socket";
import { type RpcServiceName, rpcServices } from "./rpc/services";

const HTTP_PORT = Number(process.env.PORT || process.env.HTTP_PORT) || 3001;
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50051;
const SOCKET_PORT = Number(process.env.SOCKET_PORT) || 3003;
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://localhost:3002")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);
const ENABLE_GRPC =
	process.env.ENABLE_GRPC === "true" ||
	(process.env.ENABLE_GRPC !== "false" && process.env.NODE_ENV !== "production");
const SHARE_HTTP_AND_SOCKET_PORT =
	process.env.NODE_ENV === "production" || process.env.SOCKET_PORT === process.env.PORT;

function allowedOrigin(requestOrigin: string | undefined) {
	if (process.env.NODE_ENV !== "production") {
		return requestOrigin || CLIENT_ORIGINS[0];
	}

	return CLIENT_ORIGINS.find((origin) => origin === requestOrigin);
}

function setCorsHeaders(req: IncomingMessage, res: ServerResponse) {
	const origin = allowedOrigin(req.headers.origin);
	if (origin) {
		res.setHeader("Access-Control-Allow-Origin", origin);
	}
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

function sendJson(req: IncomingMessage, res: ServerResponse, status: number, body: unknown) {
	setCorsHeaders(req, res);
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(
		JSON.stringify(body, (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
	);
}

async function readJsonBody(req: IncomingMessage) {
	const chunks: Buffer[] = [];
	for await (const chunk of req) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}

	if (chunks.length === 0) {
		return {};
	}

	return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleRpc(req: IncomingMessage, res: ServerResponse, pathname: string) {
	const [, , serviceName, methodName] = pathname.split("/");
	const service = rpcServices[serviceName as RpcServiceName] as unknown as
		| Record<string, (request: unknown) => Promise<unknown>>
		| undefined;
	const method = service?.[methodName];

	if (!service || typeof method !== "function") {
		sendJson(req, res, 404, { error: "RPC method not found" });
		return;
	}

	try {
		const request = await readJsonBody(req);
		const response = await method.call(service, request);
		sendJson(req, res, 200, { response });
	} catch (error) {
		sendJson(req, res, 500, {
			error: error instanceof Error ? error.message : "RPC request failed",
		});
	}
}

const httpServer = createServer((req, res) => {
	setCorsHeaders(req, res);

	if (req.method === "OPTIONS") {
		res.writeHead(204);
		res.end();
		return;
	}

	const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

	if (req.method === "GET" && url.pathname === "/health") {
		sendJson(req, res, 200, {
			status: "ok",
			http: true,
			socket: true,
			grpc: ENABLE_GRPC ? `localhost:${GRPC_PORT}` : "disabled",
		});
		return;
	}

	if (req.method === "GET" && url.pathname === "/") {
		sendJson(req, res, 200, {
			name: "Pulse API",
			version: "1.0.0",
			httpPort: HTTP_PORT,
			socketPort: SHARE_HTTP_AND_SOCKET_PORT ? HTTP_PORT : SOCKET_PORT,
			grpc: ENABLE_GRPC,
		});
		return;
	}

	if (req.method === "POST" && url.pathname.startsWith("/rpc/")) {
		void handleRpc(req, res, url.pathname);
		return;
	}

	sendJson(req, res, 404, { error: "Not found" });
});

const grpcServer = ENABLE_GRPC ? await startGrpcServer(GRPC_PORT) : null;
initializeSocketServer(SOCKET_PORT, SHARE_HTTP_AND_SOCKET_PORT ? httpServer : undefined);

httpServer.listen(HTTP_PORT, () => {
	console.log("Pulse API started");
	console.log(`   HTTP server: http://localhost:${HTTP_PORT}`);
	console.log(
		`   Socket.IO server: ws://localhost:${SHARE_HTTP_AND_SOCKET_PORT ? HTTP_PORT : SOCKET_PORT}`,
	);
	console.log(`   gRPC server: ${ENABLE_GRPC ? `localhost:${GRPC_PORT}` : "disabled"}`);
});

function shutdown() {
	console.log("Shutting down...");
	httpServer.close();
	grpcServer?.forceShutdown();
	process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { httpServer, grpcServer };
