import execa from 'execa';
import fs from 'fs';
import lockfile from 'proper-lockfile';
import type { State, Window } from './types';

export let windowsData: Window[] = []; 
refreshWindowsData();

export function refreshWindowsData() {
	windowsData = (JSON.parse(execa.commandSync('yabai -m query --windows').stdout) as Window[]).filter((win) => win.split !== "none");
}

const defaultState: State = { mainWindowIds: [windowsData[windowsData.length - 1].id.toString()] };
const defaultStateJson = JSON.stringify(defaultState);

export async function writeState(state: State) {
	if (!fs.existsSync('state.json')) {
		fs.writeFileSync('state.json', defaultStateJson);
	}

	lockfile.lockSync('state.json');
	fs.writeFileSync('state.json', JSON.stringify(state));
	lockfile.unlockSync('state.json');
}

export function readState(): State {
	if (!fs.existsSync('state.json')) {
		fs.writeFileSync('state.json', defaultStateJson);
	}

	lockfile.lockSync('state.json');
	const data = fs.readFileSync('state.json').toString();
	lockfile.unlockSync('state.json');
	return JSON.parse(data);
}