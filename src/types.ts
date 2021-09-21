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

export type State = {
	numMainWindows: number;
};
