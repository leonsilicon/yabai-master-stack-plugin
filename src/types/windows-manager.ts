import type { UnionToIntersection } from 'type-fest';
import type { RemovePrivateProperties } from 'liontypes';
import * as windowsManagerModules from '~/windows-manager/modules/index.js';
import type { Window } from '~/types/index.js';
import type { Display, Space } from '~/types/yabai.js';

class ModulesWrapper {
	wrapped() {
		return windowsManagerModules['' as keyof typeof windowsManagerModules]();
	}
}

export type InternalWindowsManagerProperties = UnionToIntersection<
	ReturnType<ModulesWrapper['wrapped']>
>;

export type InternalWindowsManagerState = {
	display: Display;
	space: Space;
	expectedCurrentNumMasterWindows: number;
	windowsData: Window[];
};

type InternalWindowsManagerKeys = InternalWindowsManagerProperties &
	InternalWindowsManagerState;

export interface InternalWindowsManager extends InternalWindowsManagerKeys {}

export interface WindowsManager
	extends RemovePrivateProperties<InternalWindowsManager> {}
