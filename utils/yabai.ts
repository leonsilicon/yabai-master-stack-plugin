import type { SpawnOptions, Subprocess } from 'bun';

export async function getYabaiOutput(
	yabaiProcess: Subprocess<SpawnOptions.Readable, 'pipe'>,
) {
	return new Response(yabaiProcess.stdout).text();
}
