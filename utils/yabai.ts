import type { SpawnOptions, Subprocess } from "bun";

export async function getYabaiOutput(
	yabaiProcess: Subprocess<SpawnOptions.Readable, "pipe">
) {
	// Wait for the process to complete
	const exitCode = await yabaiProcess.exited;

	// Get the output
	const output = await new Response(yabaiProcess.stdout).text();

	// Check if the process failed
	if (exitCode !== 0) {
		const stderr = await new Response(yabaiProcess.stderr).text();
		throw new Error(
			`Yabai command failed with exit code ${exitCode}. Stderr: ${stderr}`
		);
	}

	// Return the output
	return output;
}

export async function executeYabaiCommand(args: string[]): Promise<string> {
	const { yabaiPath } = await import("#utils/config.ts").then(m =>
		m.getConfig()
	);

	const yabaiProcess = Bun.spawn([yabaiPath, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});

	return getYabaiOutput(yabaiProcess);
}
