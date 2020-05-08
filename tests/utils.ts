// keep track of the original one to revert the platform
const originalPlatform = process.platform;

/**
 * Change the node platform for testing purposes.
 * With this you can fake the `process.platform`.
 */
export function setPlatform(platform: NodeJS.Platform) {
	Object.defineProperty(process, 'platform', { value: platform });
}

/**
 * Revert the platform to the original one.
 */
export function restorePlatform() {
	setPlatform(originalPlatform);
}

// keep track of the original environment variables
const originalEnv = { ...process.env };

/**
 * Change the environment variable for testing purposes.
 */
export function setEnv(name: string, value: string) {
	process.env[name] = value;
}

/**
 * Revert the environment variable changes.
 */
export function restoreEnv() {
	process.env = originalEnv;
}
