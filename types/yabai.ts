export interface Window {
	id: number;
	pid: number;
	app: string;
	title: string;
	frame: { x: number; y: number; w: number; h: number };
	role: string;
	subrole: string;
	display: number;
	space: number;
	level: number;
	'sub-level': number;
	layer: string;
	'sub-layer': string;
	opacity: number;
	'split-type': string;
	'split-child': string;
	'stack-index': number;
	'can-move': boolean;
	'can-resize': boolean;
	'has-focus': boolean;
	'has-shadow': boolean;
	'has-parent-zoom': boolean;
	'has-fullscreen-zoom': boolean;
	'has-ax-reference': boolean;
	'is-native-fullscreen': boolean;
	'is-visible': boolean;
	'is-minimized': boolean;
	'is-hidden': boolean;
	'is-floating': boolean;
	'is-sticky': boolean;
	'is-grabbed': boolean;
}

type Distinct<T, N> = T & {
	__type: N;
};

export type SpaceId = Distinct<number, 'space'>;
export type DisplayId = Distinct<number, 'display'>;
export type DisplayUuid = Distinct<number, 'displayUuid'>;
export type DisplayIndex = Distinct<number, 'displayIndex'>;

export type State = Record<string, { numMasterWindows: number }>;

export interface Display {
	id: DisplayId;
	uuid: DisplayUuid;
	index: DisplayIndex;
	frame: {
		x: number;
		y: number;
		w: number;
		h: number;
	};
	spaces: number[];
}

export interface Space {
	id: SpaceId;
	uuid: string;
	index: number;
	label: string;
	type: string;
	display: number;
	windows: number[];
	'first-window': number;
	'last-window': number;
	'has-focus': boolean;
	'is-visible': number;
	'is-native-fullscreen': number;
}

export interface YabaiMasterStackPluginConfig {
	yabaiPath: string;
	debug: boolean;
	moveNewWindowsToMaster: boolean;
	masterPosition: 'left' | 'right';
}
