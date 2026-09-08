/** Read stdout from a yabai subprocess created with piped output. */
export async function getYabaiOutput(yabaiProcess: {
  stdout: ReadableStream<Uint8Array>;
}): Promise<string> {
  return new Response(yabaiProcess.stdout).text();
}
