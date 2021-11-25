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
import { readState } from '../state';
import type { WindowsManager, WMPayload } from '../utils';
import { createInitializedWindowsManager } from '../utils';
import { getFocusedDisplay } from '../utils/display';
import { getFocusedSpace } from '../utils/space';

const app = fastify();

async function createWMPayload(wm: WindowsManager): Promise<WMPayload> {
	const state = await readState();
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
		console.log(request.params);
		const wmPayload = await createWMPayload(wm);
		switch (request.params.command) {
			case 'close-focused-window':
				await closeFocusedWindow(wmPayload);
				break;
			case 'decrease-master-window-count':
				await decreaseMasterWindowCount(wmPayload);
				break;
			case 'focus-down-window':
				await focusDownWindow(wmPayload);
				break;
			case 'focus-up-window':
				await focusUpWindow(wmPayload);
				break;
			case 'increase-master-window-count':
				await increaseMasterWindowCount(wmPayload);
				break;
		}

		return reply.status(200).send('');
	});

	app.post<{
		Params: { event: string };
	}>('/handle/:event', async (request, reply) => {
		const wmPayload = await createWMPayload(wm);
		switch (request.params.event) {
			case 'on-yabai-start':
				await onYabaiStart(wmPayload);
				break;
			case 'window-created':
				await windowCreated(wmPayload);
				break;
			case 'window-moved':
				await windowMoved(wmPayload);
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
