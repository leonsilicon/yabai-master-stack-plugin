export function handleMainError(error: Error & { code?: string }) {
	if (error.code === 'ELOCKED') return;
	console.error(error);
}
