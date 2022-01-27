import { logDebug } from '~/utils/log.js';
import { useDefineMethods } from '~/utils/modules.js';

export function updateModule() {
	const defineMethods = useDefineMethods();

	return defineMethods({
		async isValidLayout(props?: {
			targetNumMasterWindows?: number;
		}): Promise<{ status: true } | { status: false; reason: string }> {
			logDebug(() => 'Starting valid layout check...');

			// If there are no windows, it is a valid layout
			if (this.windowsData.length === 0) {
				return { status: true };
			}

			const targetNumMasterWindows =
				props?.targetNumMasterWindows ?? this.expectedCurrentNumMasterWindows;

			// If targetNumMasterWindows is greater or equal to the number of windows, all windows must be touching the left side
			if (
				targetNumMasterWindows >= this.windowsData.length &&
				!this.windowsData.every((window) =>
					this.isWindowTouchingLeftEdge(window)
				)
			) {
				return {
					status: false,
					reason:
						'The number of master windows is greater or equal to the number of windows and not all windows are touching the left edge.',
				};
			} else {
				// Verify that the number of master windows equals the target number of master windows
				const curNumMasterWindows = this.getMasterWindows().length;
				if (targetNumMasterWindows !== curNumMasterWindows) {
					return {
						status: false,
						reason: `Number of master windows does not equal expected number of master windows (${curNumMasterWindows}/${targetNumMasterWindows})`,
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
		},
		async updateWindows({
			targetNumMasterWindows,
		}: {
			targetNumMasterWindows: number;
		}) {
			logDebug(
				() =>
					`updateWindows() called with targetNumMasterWindows = ${targetNumMasterWindows}`
			);
			const layoutValidity = await this.isValidLayout({
				targetNumMasterWindows,
			});
			if (layoutValidity.status) {
				logDebug(() => 'Valid layout detected; no changes were made.');
				return;
			} else {
				logDebug(
					() =>
						`Invalid layout detected: ${layoutValidity.reason}. Updating windows...`
				);
			}

			const numWindows = this.windowsData.length;

			// If the stack is supposed to exist but doesn't exist
			if (targetNumMasterWindows !== numWindows && !this.doesStackExist()) {
				logDebug(() => 'Stack does not exist, creating it...');
				await this.createStack();
			}

			if (numWindows > 2) {
				const masterWindows = this.getMasterWindows();
				logDebug(
					() =>
						`Master windows: ${masterWindows
							.map((window) => window.app)
							.join(',')}`
				);
				let curNumMasterWindows = masterWindows.length;

				// If there are too many master windows, move them to stack
				if (curNumMasterWindows > targetNumMasterWindows) {
					logDebug(
						() =>
							`Too many master windows (${curNumMasterWindows}/${targetNumMasterWindows}).`
					);
					// Sort the windows from bottom to top and then right to left
					masterWindows.sort((window1, window2) =>
						window1.frame.y === window2.frame.y
							? window1.frame.x - window2.frame.x
							: window1.frame.y - window2.frame.y
					);

					while (curNumMasterWindows > targetNumMasterWindows) {
						// Remove the window with the greatest y-coordinate first
						const masterWindow = masterWindows.pop()!;

						logDebug(
							() => `Moving master window ${masterWindow.app} to stack.`
						);
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
					logDebug(() => `Middle window ${middleWindow.app} detected.`);
					if (curNumMasterWindows < targetNumMasterWindows) {
						logDebug(
							() => `Moving middle window ${middleWindow.app} to master.`
						);
						// eslint-disable-next-line no-await-in-loop
						await this.moveWindowToMaster(middleWindow);
						curNumMasterWindows += 1;
					} else {
						logDebug(
							() => `Moving middle window ${middleWindow.app} to stack.`
						);
						// eslint-disable-next-line no-await-in-loop
						await this.moveWindowToStack(middleWindow);
					}
				}

				// If there are still not enough master windows, move some of the stack windows to master
				const stackWindows = this.getStackWindows();
				// Sort the stack windows by reverse y-coordinate and reverse x-coordinate to move the
				// bottom-rightmost windows first
				stackWindows.sort((window1, window2) =>
					window1.frame.x === window2.frame.x
						? window2.frame.y - window1.frame.y
						: window2.frame.x - window1.frame.x
				);

				while (curNumMasterWindows < targetNumMasterWindows) {
					console.info(
						`Not enough master windows (${curNumMasterWindows}/${targetNumMasterWindows})`
					);
					const stackWindow = stackWindows.pop()!;
					logDebug(() => `Moving stack window ${stackWindow.app} to master.`);
					// eslint-disable-next-line no-await-in-loop
					await this.moveWindowToMaster(stackWindow);
					curNumMasterWindows += 1;
				}
			}

			const result = await this.isValidLayout({ targetNumMasterWindows });
			// Note: the following should never be called
			if (result.status) {
				logDebug(() => 'updateLayout() was successful.');
			} else {
				throw new Error(
					`updateLayout() ended with an invalid layout; reason: ${layoutValidity.reason}`
				);
			}

			this.expectedCurrentNumMasterWindows = targetNumMasterWindows;
		},
	});
}
