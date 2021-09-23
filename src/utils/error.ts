export function handleMainError(error: Error & { code?: string }) {
	if (error.code === 'ELOCKED') {
		console.log('Lock found...aborting');
	} else {
		console.error(error);
	}
}
