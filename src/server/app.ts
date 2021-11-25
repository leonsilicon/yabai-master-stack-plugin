import 'dotenv/config';

/**
 * Host a localhost server that responds to requests
 */
import fastify from 'fastify';

import { port } from '../config';
import { closeFocusedWindow } from '../fns/close-focused-window';
import { decreaseMasterWindowCount } from '../fns/decrease-master-window-count';
import { focusDownWindow } from '../fns/focus-down-window';
import { focusUpWindow } from '../fns/focus-up-window';
import { increaseMasterWindowCount } from '../fns/increase-master-window-count';
import { onYabaiStart } from '../handlers/on-yabai-start';
import { windowCreated } from '../handlers/window-created';
import { windowMoved } from '../handlers/window-moved';
import { activeHandlers, readState } from '../state';
import { Task } from '../types';
import type { WindowsManager, WMPayload } from '../utils';
import { createInitializedWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { getFocusedSpace } from '../utils/space';

const app = fastify();

async function createWMPayload(wm: WindowsManager): Promise<WMPayload> {
	const state = await readState();
	await wm.refreshWindowsData();
	const wmPayload: WMPayload = {
		display: await getFocusedDisplay(),
		space: await getFocusedSpace(),
		state,
		wm,
	};
	return wmPayload;
}

async function main() {
	const { wm } = await createInitializedWindowsManager();

	await onYabaiStart(await createWMPayload(wm));

	app.post<{
		Params: { command: string };
	}>('/run/:command', async (request, reply) => {
		const wmPayload = await createWMPayload(wm);
		switch (request.params.command) {
			case Task.closeFocusedWindow:
				await closeFocusedWindow(wmPayload);
				break;
			case Task.decreaseMasterWindowCount:
				await decreaseMasterWindowCount(wmPayload);
				break;
			case Task.focusDownWindow:
				await focusDownWindow(wmPayload);
				break;
			case Task.focusUpWindow:
				await focusUpWindow(wmPayload);
				break;
			case Task.increaseMasterWindowCount:
				await increaseMasterWindowCount(wmPayload);
				break;
		}

		return reply.status(200).send('');
	});

	app.post<{
		Params: { event: string };
	}>('/handle/:event', async (request, reply) => {
		const wmPayload = await createWMPayload(wm);
		console.log(request.params.event);
		switch (request.params.event) {
			case Task.onYabaiStart:
				await onYabaiStart(wmPayload);
				break;
			case Task.windowCreated:
				if (!activeHandlers[Task.windowMoved]) {
					try {
						activeHandlers[Task.windowMoved] = true;
						await windowCreated(wmPayload);
					} finally {
						activeHandlers[Task.windowMoved] = false;
					}
				}
				break;
			case Task.windowMoved:
				if (!activeHandlers[Task.windowMoved]) {
					try {
						activeHandlers[Task.windowMoved] = true;
						await windowMoved(wmPayload);
					} finally {
						activeHandlers[Task.windowMoved] = false;
					}
				}
				break;
		}

		return reply.status(200).send('');
	});

	app.listen(port, (err, address) => {
		if (err) {
			console.error(err);
		} else {
			console.info(`Yabai plugin server is listening at port ${address}`);
		}
	});
}

void main();
