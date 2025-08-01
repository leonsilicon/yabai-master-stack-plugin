import type { Space } from "#types";
import { getConfig } from "./config.ts";
import { getYabaiOutput } from "./yabai.ts";
import { debug } from "./debug.ts";

export async function getSpaces() {
	const { yabaiPath } = getConfig();

	debug(() => `Executing: ${yabaiPath} -m query --spaces`);

	try {
		const yabaiProcess = Bun.spawn([yabaiPath, "-m", "query", "--spaces"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const yabaiOutput = await getYabaiOutput(yabaiProcess);

		debug(() => `Yabai output: ${yabaiOutput}`);

		// Check if output is empty
		if (!yabaiOutput.trim()) {
			throw new Error("Yabai returned empty output");
		}

		const spaces = JSON.parse(yabaiOutput) as Space[];
		debug(() => `Parsed ${spaces.length} spaces`);
		return spaces;
	} catch (error) {
		debug(() => `Error getting spaces: ${error}`);
		throw new Error(
			`Failed to get spaces: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}

export async function getFocusedSpace() {
	const { yabaiPath } = getConfig();

	debug(() => `Executing: ${yabaiPath} -m query --spaces --space`);

	try {
		const yabaiProcess = Bun.spawn(
			[yabaiPath, "-m", "query", "--spaces", "--space"],
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

		const space = JSON.parse(yabaiOutput) as Space;
		debug(() => `Parsed focused space: ${space.id}`);
		return space;
	} catch (error) {
		debug(() => `Error getting focused space: ${error}`);
		throw new Error(
			`Failed to get focused space: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}
