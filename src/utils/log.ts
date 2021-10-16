export function logDebug(cb: () => string) {
	if (process.env.DEBUG) {
		logDebug(() => cb());
	}
}
