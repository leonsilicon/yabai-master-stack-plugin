import execa from 'execa';
import type { Window } from './types';

export let windowsData: Window[]; 
refreshWindowsData();

export function refreshWindowsData() {
	windowsData = (JSON.parse(execa.commandSync('yabai -m query --windows').stdout) as Window[]).filter((win) => win.split !== "none");
}