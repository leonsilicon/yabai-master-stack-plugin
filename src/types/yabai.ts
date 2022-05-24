export interface Yabai3Window {
	id: number;
	pid: number;
	app: string;
	title: string;
	frame: { x: number; y: number; w: number; h: number };
	level: number;
	role: string;
	subrole: string;
	movable: number;
	resizable: number;
	display: number;
	space: number;
	focused: number;
	split: string;
	floating: number;
	sticky: number;
	minimized: number;
	topmost: number;
	opacity: number;
	shadow: number;
	border: number;
	'stack-index': number;
	'zoom-parent': number;
	'zoom-fullscreen': number;
	'native-fullscreen': number;
}

export interface Yabai4Window {
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
	opacity: number;
	'split-type': string;
	'stack-index': number;
	'can-move': boolean;
	'can-resize': boolean;
	'has-focus': boolean;
	'has-shadow': boolean;
	'has-border': boolean;
	'has-parent-zoom': boolean;
	'has-fullscreen-zoom': boolean;
	'is-native-fullscreen': boolean;
	'is-visible': boolean;
	'is-minimized': boolean;
	'is-hidden': boolean;
	'is-floating': boolean;
	'is-sticky': boolean;
	'is-topmost': boolean;
	'is-grabbed': boolean;
}

export type Window = Yabai3Window | Yabai4Window;

type Distinct<T, N> = T & {
	__type: N;
};

export type SpaceId = Distinct<number, 'space'>;
export type DisplayId = Distinct<number, 'display'>;
export type DisplayUuid = Distinct<number, 'displayUuid'>;
export type DisplayIndex = Distinct<number, 'displayIndex'>;

export type State = Record<
	string,
	{
		numMasterWindows: number;
	}
>;

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

export interface Yabai3Space {
	id: SpaceId;
	label: string;
	index: number;
	display: number;
	windows: number[];
	type: string;
	visible: number;
	focused: number;
	'native-fullscreen': number;
	'first-window': number;
	'last-window': number;
}

export interface Yabai4Space {
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

export type Space = Yabai3Space | Yabai4Space;

export interface YabaiMasterStackPluginConfig {
	yabaiPath: string;
	debug: boolean;
	masterPosition: 'left' | 'right';
}
