// Mock @tanstack/react-start for tests
import { vi } from "vitest";

type ServerFnHandler = (context?: { data?: unknown }) => unknown;

export function createServerFn(_options?: unknown, legacyHandler?: ServerFnHandler) {
	const serverFn = vi.fn(async (args?: unknown) => {
		if (legacyHandler) {
			return legacyHandler(args as { data?: unknown });
		}

		return undefined;
	});

	const builder = {
		inputValidator: vi.fn(() => builder),
		handler: vi.fn((handler: ServerFnHandler) => {
			serverFn.mockImplementation(async (args?: unknown) =>
				handler((args ?? {}) as { data?: unknown }),
			);
			return serverFn;
		}),
	};

	return builder;
}
