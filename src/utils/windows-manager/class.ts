import type { Display, Space, Window } from '~/types/yabai.js';

import * as windowsManagerMethods from './methods/index.js';

class WindowManagerClass {
	display: Display;
	space: Space;
	expectedCurrentNumMasterWindows: number;
	windowsData: Window[];

	constructor({
		display,
		expectedCurrentNumMasterWindows,
		space,
	}: {
		display: Display;
		space: Space;
		expectedCurrentNumMasterWindows: number;
	}) {
		this.display = display;
		this.space = space;
		this.expectedCurrentNumMasterWindows = expectedCurrentNumMasterWindows;
		Object.assign(this, windowsManagerMethods);
	}
}

export type WindowsManager = InstanceType<typeof WindowManagerClass> &
	typeof windowsManagerMethods;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const WindowsManager = WindowManagerClass as unknown as {
	new(
		...args: ConstructorParameters<typeof WindowManagerClass>
	): WindowsManager;
};
