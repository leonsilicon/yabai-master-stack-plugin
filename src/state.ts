import execa from 'execa';
import fs from 'fs';
import lockfile from 'proper-lockfile';
import type { State, Window } from './types';

export let windowsData: Window[] = []; 

export function refreshWindowsData() {
	windowsData = (JSON.parse(execa.commandSync('yabai -m query --windows').stdout) as Window[]).filter((win) => win.split !== "none");
}
refreshWindowsData();

const defaultState: State = { numMainWindows: 1 };
const defaultStateJson = JSON.stringify(defaultState);

export async function writeState(state: State) {
	if (!fs.existsSync('state.json')) {
		fs.writeFileSync('state.json', defaultStateJson);
	}

	fs.writeFileSync('state.json', JSON.stringify(state));
}

export function readState(): State {
	if (!fs.existsSync('state.json')) {
		fs.writeFileSync('state.json', defaultStateJson);
	}

	const data = fs.readFileSync('state.json').toString();
	return JSON.parse(data);
}