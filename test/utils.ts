export function p(fn: () => any) {
	return {
		defer: true,
		async fn(deferred: any) {
			await fn();
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			deferred.resolve();
		},
	};
}
