import { debug } from '#utils/debug.ts';
import type { WindowsManager } from '#utils/windows-manager/class.ts';
import invariant from 'tiny-invariant';

export async function isValidLayout(
	this: WindowsManager,
	args?: {
		targetNumMasterWindows?: number;
	},
): Promise<{ status: true } | { status: false; reason: string }> {
	debug(() => 'Starting valid layout check...');

	// If there are no windows, it is a valid layout
	if (this.windowsData.length === 0) {
		return { status: true };
	}

	const targetNumMasterWindows = args?.targetNumMasterWindows ??
		this.expectedCurrentNumMasterWindows;

	// If `targetNumMasterWindows` is greater or equal to the number of windows, all windows must be touching the left side
	if (
		targetNumMasterWindows > this.windowsData.length &&
		!this.windowsData.every((window) => this.isWindowTouchingLeftEdge(window))
	) {
		return {
			status: false,
			reason:
				'The number of master windows is greater than the number of windows and not all windows are touching the left edge.',
		};
	} else {
		// Verify that the number of master windows equals the target number of master windows
		const curNumMasterWindows = this.getMasterWindows().length;
		if (targetNumMasterWindows !== curNumMasterWindows) {
			return {
				status: false,
				reason:
					`Number of master windows does not equal expected number of master windows (${curNumMasterWindows}/${targetNumMasterWindows})`,
			};
		}

		// Verify that there is no middle window
		for (const window of this.windowsData) {
			if (this.isMiddleWindow(window)) {
				return {
					status: false,
					reason: `A middle window (${window.app}) was detected.`,
				};
			}
		}

		return { status: true };
	}
}

export async function updateWindows(
	this: WindowsManager,
	{
		targetNumMasterWindows,
	}: {
		targetNumMasterWindows: number;
	},
) {
	debug(
		() =>
			`updateWindows() called with targetNumMasterWindows = ${targetNumMasterWindows}`,
	);

	await this.columnizeMasterWindows();
	await this.columnizeStackWindows();

	const layoutValidity = await this.isValidLayout({
		targetNumMasterWindows,
	});
	if (layoutValidity.status) {
		debug(() => 'Valid layout detected; no changes were made.');
		return;
	} else {
		debug(
			() =>
				`Invalid layout detected: ${layoutValidity.reason}. Updating windows...`,
		);
	}

	const numWindows = this.windowsData.length;

	// If the stack is supposed to exist but doesn't exist
	if (targetNumMasterWindows !== numWindows && !this.doesStackExist()) {
		debug(() => 'Stack does not exist, creating it...');
		await this.createStack();
	}

	// If the user wants a pancake layout, set the split of all windows to horizontal
	if (targetNumMasterWindows === numWindows) {
		for (const window of this.windowsData) {
			const splitType = window['split-type'];

			if (splitType === 'vertical') {
				// eslint-disable-next-line no-await-in-loop
				await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
			}
		}
	}

	if (numWindows > 1) {
		const masterWindows = this.getMasterWindows();
		debug(
			() =>
				`Master windows: ${
					masterWindows.map((window) => window.app).join(',')
				}`,
		);
		let curNumMasterWindows = masterWindows.length;

		// If there are too many master windows, move them to stack
		if (curNumMasterWindows > targetNumMasterWindows) {
			debug(
				() =>
					`Too many master windows (${curNumMasterWindows}/${targetNumMasterWindows}).`,
			);
			// Sort the windows from bottom to top and then right to left
			masterWindows.sort((window1, window2) =>
				window1.frame.y === window2.frame.y ?
					window1.frame.x - window2.frame.x :
					window1.frame.y - window2.frame.y
			);

			while (curNumMasterWindows > targetNumMasterWindows) {
				// Remove the window with the greatest y-coordinate first
				const masterWindow = masterWindows.pop()!;

				debug(() => `Moving master window ${masterWindow.app} to stack.`);
				// eslint-disable-next-line no-await-in-loop
				await this.moveWindowToStack(masterWindow);
				curNumMasterWindows -= 1;
			}
		}

		// If there are windows that aren't touching either the left side or the right side
		// after the move, fill up master and then move the rest to stack
		let middleWindows;
		while ((middleWindows = this.getMiddleWindows()).length > 0) {
			const middleWindow = middleWindows[0];
			invariant(middleWindow);
			debug(() => `Middle window ${middleWindow.app} detected.`);
			if (curNumMasterWindows < targetNumMasterWindows) {
				debug(() => `Moving middle window ${middleWindow.app} to master.`);
				// eslint-disable-next-line no-await-in-loop
				await this.moveWindowToMaster(middleWindow);
				curNumMasterWindows += 1;
			} else {
				debug(() => `Moving middle window ${middleWindow.app} to stack.`);
				// eslint-disable-next-line no-await-in-loop
				await this.moveWindowToStack(middleWindow);
			}
		}

		// If there are still not enough master windows, move some of the stack windows to master
		const stackWindows = this.getStackWindows();
		// Sort the stack windows by reverse y-coordinate and reverse x-coordinate to move the
		// bottom-rightmost windows first
		stackWindows.sort((window1, window2) =>
			window1.frame.x === window2.frame.x ?
				window2.frame.y - window1.frame.y :
				window2.frame.x - window1.frame.x
		);

		while (curNumMasterWindows < targetNumMasterWindows) {
			console.info(
				`Not enough master windows (${curNumMasterWindows}/${targetNumMasterWindows})`,
			);
			const stackWindow = stackWindows.pop()!;
			debug(() => `Moving stack window ${stackWindow.app} to master.`);
			// eslint-disable-next-line no-await-in-loop
			await this.moveWindowToMaster(stackWindow);
			curNumMasterWindows += 1;
		}
	}

	const result = await this.isValidLayout({ targetNumMasterWindows });
	// Note: the following should never be called
	if (result.status) {
		debug(() => 'updateWindows() was successful.');
	} else {
		throw new Error(
			`updateWindows() ended with an invalid layout; reason: ${layoutValidity.reason}`,
		);
	}

	this.expectedCurrentNumMasterWindows = targetNumMasterWindows;
}
