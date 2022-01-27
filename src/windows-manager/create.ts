import { retrieveModuleProperties, createInstance } from 'lion-architecture';
import * as windowsManagerModules from './modules/index.js';
import type {
	InternalWindowsManagerProperties,
	InternalWindowsManagerState,
	WindowsManager,
} from '~/types/windows-manager.js';
import type { Display, Space } from '~/types/yabai.js';
import { getFocusedDisplay } from '~/utils/display.js';
import { getFocusedSpace } from '~/utils/space.js';
import { readState } from '~/utils/state.js';

const properties = retrieveModuleProperties(
	windowsManagerModules
) as InternalWindowsManagerProperties;

type CreateWindowsManagerProps = {
	display: Display;
	space: Space;
	expectedCurrentNumMasterWindows: number;
};

/**
 * Creates a windows manager.
 * @param props
 * @param props.expectedCurrentNumMasterWindows The expected current number of master
 * windows active on the screen (used as part of a heuristic for determining the master
 * windows).
 */
export function createWindowsManager({
	display,
	space,
	expectedCurrentNumMasterWindows,
}: CreateWindowsManagerProps) {
	const state: InternalWindowsManagerState = {
		windowsData: [],
		expectedCurrentNumMasterWindows,
		display,
		space,
	};

	const windowsManager = createInstance(properties, state);

	return windowsManager as WindowsManager;
}
