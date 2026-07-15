import "./src/env";
import { defineConfig } from "drizzle-kit";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
	throw new Error("DATABASE_URL is required to run drizzle-kit");
}

const normalizedUrl = rawUrl.replace(/^jdbc:/, "");
const url = new URL(normalizedUrl);

export default defineConfig({
	schema: "../../packages/db-schema/src/schema.ts",
	out: "../../db/migrations",
	dialect: "mysql",
	dbCredentials: {
		host: url.hostname,
		port: url.port ? Number(url.port) : 3306,
		user: process.env.DATABASE_USERNAME || decodeURIComponent(url.username) || "root",
		password: process.env.DATABASE_PASSWORD || decodeURIComponent(url.password),
		database: url.pathname.replace(/^\//, ""),
		ssl:
			process.env.DATABASE_SSL === "true" ||
			url.searchParams.get("ssl") === "true" ||
			url.hostname.includes("tidbcloud.com")
				? "require"
				: undefined,
	},
});
