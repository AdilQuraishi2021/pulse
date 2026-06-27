import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import { RpcError, type ServerCallContext } from "@protobuf-ts/runtime-rpc";

export type ErrorCode =
	| "INVALID_ARGUMENT"
	| "UNAUTHENTICATED"
	| "PERMISSION_DENIED"
	| "NOT_FOUND"
	| "ALREADY_EXISTS"
	| "FAILED_PRECONDITION"
	| "INTERNAL";

interface TraceContext {
	traceId: string;
	service: string;
	method: string;
}

const traceStorage = new AsyncLocalStorage<TraceContext>();

export class AppError extends Error {
	constructor(
		message: string,
		readonly code: ErrorCode,
		readonly cause?: unknown,
	) {
		super(message);
		this.name = "AppError";
	}
}

function firstMetadataValue(value: string | string[] | Uint8Array | Uint8Array[] | undefined) {
	if (Array.isArray(value)) {
		return value[0];
	}
	return value;
}

function getRequestTraceId(context?: ServerCallContext): string {
	const rawTraceId = firstMetadataValue(context?.headers["x-trace-id"]);
	return typeof rawTraceId === "string" && rawTraceId.length > 0 ? rawTraceId : randomUUID();
}

export function getTraceId(): string | undefined {
	return traceStorage.getStore()?.traceId;
}

export function classifyError(error: unknown): AppError {
	if (error instanceof AppError) {
		return error;
	}

	const message = error instanceof Error ? error.message : "Internal server error";

	if (message.includes("Authentication required") || message.includes("Invalid or expired session token")) {
		return new AppError(message, "UNAUTHENTICATED", error);
	}

	if (
		message.includes("Admin access required") ||
		message.includes("Super admin access required") ||
		message.includes("Unauthorized") ||
		message.includes("You can only") ||
		message.startsWith("Account banned")
	) {
		return new AppError(message, "PERMISSION_DENIED", error);
	}

	if (message.includes("not found") || message.includes("Not found")) {
		return new AppError(message, "NOT_FOUND", error);
	}

	if (message.includes("already exists") || message.includes("already taken")) {
		return new AppError(message, "ALREADY_EXISTS", error);
	}

	if (
		message.includes("required") ||
		message.includes("Invalid") ||
		message.includes("must be") ||
		message.includes("Cannot reply")
	) {
		return new AppError(message, "INVALID_ARGUMENT", error);
	}

	if (message.includes("expired")) {
		return new AppError(message, "FAILED_PRECONDITION", error);
	}

	return new AppError("Internal server error", "INTERNAL", error);
}

function log(level: "info" | "error", event: string, data: Record<string, unknown>) {
	const context = traceStorage.getStore();
	const entry = {
		level,
		event,
		traceId: context?.traceId,
		service: context?.service,
		method: context?.method,
		timestamp: new Date().toISOString(),
		...data,
	};

	const line = JSON.stringify(entry);
	if (level === "error") {
		console.error(line);
		return;
	}

	console.log(line);
}

function toRpcError(error: unknown, traceId: string): RpcError {
	const appError = classifyError(error);
	return new RpcError(appError.message, appError.code, {
		"x-trace-id": traceId,
		"error-code": appError.code,
	});
}

function hasResponseError(response: unknown): response is { error: string } {
	return (
		typeof response === "object" &&
		response !== null &&
		"error" in response &&
		typeof (response as { error?: unknown }).error === "string" &&
		(response as { error: string }).error.length > 0
	);
}

type HandlerMethod = (request: unknown, context?: ServerCallContext) => Promise<unknown>;

export function withObservability<T extends object>(serviceName: string, handler: T): T {
	const wrapped = {} as T;
	const handlerMethods = handler as Record<string, HandlerMethod>;
	const wrappedMethods = wrapped as Record<string, HandlerMethod>;

	for (const key of Object.keys(handlerMethods)) {
		const method = handlerMethods[key];
		wrappedMethods[key] = async (request: unknown, context?: ServerCallContext) => {
			const traceId = getRequestTraceId(context);
			const methodName = context?.method.name ?? String(key);
			const startedAt = Date.now();

			if (context) {
				context.trailers = {
					...context.trailers,
					"x-trace-id": traceId,
				};
			}

			return traceStorage.run({ traceId, service: serviceName, method: methodName }, async () => {
				log("info", "rpc.start", {});

				try {
					const response = await method.call(handler, request, context);
					const durationMs = Date.now() - startedAt;

					if (hasResponseError(response)) {
						const appError = classifyError(new Error(response.error));
						log("error", "rpc.error_response", {
							durationMs,
							errorCode: appError.code,
							error: response.error,
						});
					} else {
						log("info", "rpc.finish", { durationMs });
					}

					return response;
				} catch (error) {
					const appError = classifyError(error);
					const durationMs = Date.now() - startedAt;
					log("error", "rpc.exception", {
						durationMs,
						errorCode: appError.code,
						error: appError.message,
					});
					throw toRpcError(error, traceId);
				}
			});
		};
	}

	return wrapped;
}
