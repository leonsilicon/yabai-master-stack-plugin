import execa from 'execa';
import fs from 'fs';
import type { State, Window } from './types';
import pkgDir from 'pkg-dir';
import path from 'path';

export let windowsData: Window[] = []; 

export function refreshWindowsData() {
	windowsData = (JSON.parse(execa.commandSync('/usr/local/bin/yabai -m query --windows').stdout) as Window[]).filter((win) => win.split !== "none");
}
refreshWindowsData();

const stateFilePath = path.join(pkgDir.sync(__dirname)!, 'state.json');

const defaultState: State = { numMainWindows: 1 };
const defaultStateJson = JSON.stringify(defaultState);

export async function writeState(state: State) {
	if (!fs.existsSync(stateFilePath)) {
		fs.writeFileSync(stateFilePath, defaultStateJson);
	}

	fs.writeFileSync(stateFilePath, JSON.stringify(state));
}

export function readState(): State {
	if (!fs.existsSync(stateFilePath)) {
		fs.writeFileSync(stateFilePath, defaultStateJson);
	}

	const data = fs.readFileSync(stateFilePath).toString();
	return JSON.parse(data);
}