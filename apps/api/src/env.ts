import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRootEnv = fileURLToPath(new URL("../../../.env", import.meta.url));
const apiEnv = fileURLToPath(new URL("../.env", import.meta.url));
const envFiles = [
	repoRootEnv,
	apiEnv,
	resolve(process.cwd(), ".env"),
	resolve(process.cwd(), "apps/api/.env"),
];

for (const file of envFiles) {
	if (!existsSync(file)) {
		continue;
	}

	const lines = readFileSync(file, "utf8").split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}

		const separator = trimmed.indexOf("=");
		if (separator === -1) {
			continue;
		}

		const key = trimmed.slice(0, separator).trim();
		const value = trimmed
			.slice(separator + 1)
			.trim()
			.replace(/^["']|["']$/g, "");
		process.env[key] ??= value;
	}
}
