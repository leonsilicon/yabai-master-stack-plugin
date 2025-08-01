import type { Window } from "#types";
import { getConfig } from "#utils/config.ts";
import type { WindowsManager } from "#utils/windows-manager/class.ts";
import { getYabaiOutput } from "#utils/yabai.ts";
import { debug } from "#utils/debug.ts";
import invariant from "tiny-invariant";

export async function getWindowsData(this: WindowsManager) {
	const { yabaiPath } = getConfig();

	debug(() => `Executing: ${yabaiPath} -m query --windows`);

	try {
		const yabaiProcess = Bun.spawn([yabaiPath, "-m", "query", "--windows"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const yabaiOutput = await getYabaiOutput(yabaiProcess);

		debug(() => `Yabai output: ${yabaiOutput}`);

		// Check if output is empty
		if (!yabaiOutput.trim()) {
			throw new Error("Yabai returned empty output");
		}

		const allWindows = JSON.parse(yabaiOutput) as Window[];
		debug(() => `Parsed ${allWindows.length} total windows`);

		const windowsData = allWindows.filter(window => {
			const isFloating = window["is-floating"];

			// Window should not be floating
			if (
				isFloating ||
				window.display !== this.display.index ||
				window.space !== this.space.index
			) {
				return false;
			}

			const isMinimized = window["is-minimized"];
			const isHidden = window["is-hidden"];
			const isVisible = window["is-visible"];
			if (isMinimized || isHidden || !isVisible) return false;

			return true;
		});

		debug(() => `Filtered to ${windowsData.length} relevant windows`);
		return windowsData;
	} catch (error) {
		debug(() => `Error getting windows data: ${error}`);
		throw new Error(
			`Failed to get windows data: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}

export async function refreshWindowsData(this: WindowsManager) {
	const newWindowsData = await this.getWindowsData();
	this.windowsData = newWindowsData;
}

export async function initialize(this: WindowsManager) {
	this.windowsData = await this.getWindowsData();
}

export function getUpdatedWindowData(this: WindowsManager, window: Window) {
	return this.windowsData.find(win => window.id === win.id)!;
}

export function getWindowData(
	this: WindowsManager,
	{
		processId,
		windowId,
	}: {
		processId?: string;
		windowId?: string;
	}
): Window {
	if (processId === undefined && windowId === undefined) {
		throw new Error("Must provide at least one of processId or windowId");
	}

	const windowData = this.windowsData.find(
		window => window.pid === Number(processId) || window.id === Number(windowId)
	);

	if (windowData === undefined) {
		if (processId === undefined) {
			invariant(windowId);
			throw new Error(`Window with id ${windowId} not found.`);
		} else {
			throw new Error(`Window with pid ${processId} not found.`);
		}
	}

	return windowData;
}

export function getFocusedWindow(this: WindowsManager): Window | undefined {
	return this.windowsData.find(w => w["has-focus"]);
}
