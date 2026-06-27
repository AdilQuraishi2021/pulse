import type { ServerCallContext } from "@protobuf-ts/runtime-rpc";
import { RpcError } from "@protobuf-ts/runtime-rpc";
import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyError, getTraceId, withObservability } from "./observability";

function createContext(traceId?: string): ServerCallContext {
	return {
		method: { name: "GetThing" } as ServerCallContext["method"],
		headers: traceId ? { "x-trace-id": traceId } : {},
		deadline: new Date(Date.now() + 1000),
		trailers: {},
		status: { code: "OK", detail: "" },
		sendResponseHeaders: vi.fn(),
		cancelled: false,
		onCancel: vi.fn(),
	};
}

describe("observability", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("classifies known errors into gRPC status codes", () => {
		expect(classifyError(new Error("User not found")).code).toBe("NOT_FOUND");
		expect(classifyError(new Error("Authentication required")).code).toBe("UNAUTHENTICATED");
		expect(classifyError(new Error("Admin access required")).code).toBe("PERMISSION_DENIED");
		expect(classifyError(new Error("Username already taken")).code).toBe("ALREADY_EXISTS");
		expect(classifyError(new Error("Post content is required")).code).toBe("INVALID_ARGUMENT");
	});

	it("propagates trace IDs through context and response trailers", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const context = createContext("trace-123");
		const handler = withObservability("TestService", {
			async getThing() {
				return { traceId: getTraceId() };
			},
		});

		const response = await handler.getThing({}, context);

		expect(response).toEqual({ traceId: "trace-123" });
		expect(context.trailers["x-trace-id"]).toBe("trace-123");
	});

	it("maps thrown errors to RpcError with trace metadata", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		const context = createContext("trace-456");
		const handler = withObservability("TestService", {
			async getThing() {
				throw new Error("User not found");
			},
		});

		await expect(handler.getThing({}, context)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "User not found",
			meta: { "x-trace-id": "trace-456", "error-code": "NOT_FOUND" },
		} satisfies Partial<RpcError>);
	});
});
