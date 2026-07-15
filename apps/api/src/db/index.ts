import "../env";
import * as schema from "@chirp/db-schema";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

function getDatabaseConfig(): mysql.PoolOptions {
	const rawUrl = process.env.DATABASE_URL;
	if (!rawUrl) {
		throw new Error("DATABASE_URL is required for the MySQL database");
	}

	const normalizedUrl = rawUrl.replace(/^jdbc:/, "");
	const url = new URL(normalizedUrl);

	return {
		host: url.hostname,
		port: url.port ? Number(url.port) : 3306,
		user: process.env.DATABASE_USERNAME || decodeURIComponent(url.username) || "root",
		password: process.env.DATABASE_PASSWORD || decodeURIComponent(url.password),
		database: url.pathname.replace(/^\//, ""),
		connectionLimit: 10,
		ssl:
			process.env.DATABASE_SSL === "true" ||
			url.searchParams.get("ssl") === "true" ||
			url.hostname.includes("tidbcloud.com")
				? { minVersion: "TLSv1.2", rejectUnauthorized: true }
				: undefined,
	};
}

export const client = mysql.createPool(getDatabaseConfig());

export const db = drizzle(client, { schema, mode: "default" });

export { schema };
