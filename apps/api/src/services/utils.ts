import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";

const PASSWORD_SCHEME = "scrypt";
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_PARAMS = {
	N: 16384,
	r: 8,
	p: 1,
};

const derivePasswordKey = (
	password: string,
	salt: string,
	keyLength: number,
	params = SCRYPT_PARAMS,
): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		scryptCallback(password, salt, keyLength, params, (error, derivedKey) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(derivedKey);
		});
	});

/**
 * Generate a simple ID
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function hashLegacyPassword(password: string): string {
	const hash = createHash("sha256");
	hash.update(password + "salt");
	return hash.digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const derivedKey = await derivePasswordKey(password, salt, SCRYPT_KEY_LENGTH);

	return [
		PASSWORD_SCHEME,
		SCRYPT_PARAMS.N,
		SCRYPT_PARAMS.r,
		SCRYPT_PARAMS.p,
		salt,
		derivedKey.toString("hex"),
	].join("$");
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	if (!hashedPassword.startsWith(`${PASSWORD_SCHEME}$`)) {
		return hashLegacyPassword(password) === hashedPassword;
	}

	const [, rawN, rawR, rawP, salt, storedKey] = hashedPassword.split("$");
	const keyBuffer = Buffer.from(storedKey ?? "", "hex");
	const derivedKey = await derivePasswordKey(password, salt, keyBuffer.length, {
		N: Number(rawN),
		r: Number(rawR),
		p: Number(rawP),
	});

	return keyBuffer.length === derivedKey.length && timingSafeEqual(keyBuffer, derivedKey);
}

export function passwordNeedsRehash(hashedPassword: string): boolean {
	return !hashedPassword.startsWith(`${PASSWORD_SCHEME}$`);
}

/**
 * Convert Date to protobuf Timestamp
 */
export function toProtoTimestamp(date: Date): { seconds: bigint; nanos: number } {
	const ms = date.getTime();
	return {
		seconds: BigInt(Math.floor(ms / 1000)),
		nanos: (ms % 1000) * 1000000,
	};
}

/**
 * Convert protobuf Timestamp to Date
 */
export function fromProtoTimestamp(timestamp: { seconds: bigint; nanos: number }): Date {
	return new Date(Number(timestamp.seconds) * 1000 + timestamp.nanos / 1000000);
}
