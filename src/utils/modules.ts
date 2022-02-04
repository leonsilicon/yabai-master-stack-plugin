import type { InternalWindowsManager } from '~/types/index.js';

export function useDefineMethods() {
	return <M>(methods: M & ThisType<InternalWindowsManager>) =>
		// Removing the `this` type from the function
		methods as unknown as M;
}
