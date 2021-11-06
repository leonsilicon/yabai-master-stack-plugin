export type Window = {
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
};

type SpaceId = number & {
	__type: 'space';
};

type DisplayId = number & {
	__type: 'display';
};

export type State = {
	[spaceId: SpaceId]: {
		numMasterWindows: number;
	};
};

export type Display = {
	id: DisplayId;
	uuid: string;
	index: number;
	spaces: number[];
	frame: {
		x: number;
		y: number;
		w: number;
		h: number;
	};
};

export type Space = {
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
};
