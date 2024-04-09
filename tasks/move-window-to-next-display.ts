import { getConfig } from '#utils/config.ts';
import { getDisplays, getFocusedDisplay } from '#utils/display.ts';
import { defineTask } from '#utils/task.ts';

export const moveWindowToNextDisplay = defineTask(async () => {
	const displays = await getDisplays();
	const focusedDisplay = await getFocusedDisplay();
	const sortedDisplays = displays.sort((d1, d2) => d1.frame.x - d2.frame.x);
	console.log(sortedDisplays)
	const focusedDisplayOrderIndex = sortedDisplays.findIndex((display) =>
		display.id === focusedDisplay.id
	);
	const nextFocusedDisplay =
		sortedDisplays[(focusedDisplayOrderIndex + 1) % sortedDisplays.length];
	const { yabaiPath } = getConfig();
	await Bun.spawn([
		yabaiPath,
		'-m',
		'window',
		'--display',
		nextFocusedDisplay.index.toString(),
	]);
});
