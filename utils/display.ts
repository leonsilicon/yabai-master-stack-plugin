import type { Display, DisplayIndex } from "#types";
import { getConfig } from "#utils/config.ts";
import { getYabaiOutput, executeYabaiCommand } from "./yabai.ts";
import { debug } from "./debug.ts";

export async function getDisplays() {
	const { yabaiPath } = getConfig();

	debug(() => `Executing: ${yabaiPath} -m query --displays`);

	try {
		const yabaiProcess = Bun.spawn([yabaiPath, "-m", "query", "--displays"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const yabaiOutput = await getYabaiOutput(yabaiProcess);

		debug(() => `Yabai output: ${yabaiOutput}`);

		// Check if output is empty
		if (!yabaiOutput.trim()) {
			throw new Error("Yabai returned empty output");
		}

		const displays = JSON.parse(yabaiOutput) as Display[];
		debug(() => `Parsed ${displays.length} displays`);
		return displays;
	} catch (error) {
		debug(() => `Error getting displays: ${error}`);
		throw new Error(
			`Failed to get displays: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}

export async function getFocusedDisplay() {
	const { yabaiPath } = getConfig();

	debug(() => `Executing: ${yabaiPath} -m query --displays --display`);

	try {
		const yabaiProcess = Bun.spawn(
			[yabaiPath, "-m", "query", "--displays", "--display"],
			{
				stdout: "pipe",
				stderr: "pipe",
			}
		);
		const yabaiOutput = await getYabaiOutput(yabaiProcess);

		debug(() => `Yabai output: ${yabaiOutput}`);

		// Check if output is empty
		if (!yabaiOutput.trim()) {
			throw new Error("Yabai returned empty output");
		}

		const display = JSON.parse(yabaiOutput) as Display;
		debug(() => `Parsed focused display: ${display.id}`);
		return display;
	} catch (error) {
		debug(() => `Error getting focused display: ${error}`);
		throw new Error(
			`Failed to get focused display: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}

export async function focusDisplay(displayIndex: DisplayIndex) {
	const { yabaiPath } = getConfig();

	debug(() => `Focusing display: ${displayIndex}`);

	await Bun.spawn([
		yabaiPath,
		"-m",
		"display",
		"--focus",
		displayIndex.toString(),
	]);
}
