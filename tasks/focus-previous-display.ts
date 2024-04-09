import { getConfig } from '#utils/config.ts';
import { getDisplays, getFocusedDisplay } from '#utils/display.ts';
import { defineTask } from '#utils/task.ts';

export const focusPreviousDisplay = defineTask(async () => {
	const displays = await getDisplays();
	const focusedDisplay = await getFocusedDisplay();
	const sortedDisplays = displays.sort((d1, d2) => d1.frame.x - d2.frame.x);
	const focusedDisplayOrderIndex = sortedDisplays.findIndex((display) =>
		display.id === focusedDisplay.id
	);
	const nextFocusedDisplay =
		sortedDisplays[
			((focusedDisplayOrderIndex - 1) + sortedDisplays.length) %
			sortedDisplays.length
		];
	const { yabaiPath } = getConfig();
	await Bun.spawn([
		yabaiPath,
		'-m',
		'display',
		'--focus',
		nextFocusedDisplay.index.toString(),
	]);
});
