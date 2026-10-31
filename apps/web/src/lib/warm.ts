// Ward Lite takes a few seconds to load (about 39 MB of model and 27 MB of WebAssembly). Starting
// it when Check opens, while the child is still choosing a chat and who they are, means the deeper
// read can begin as soon as the quick one is shown, so "I'm reading this closely" is up for less
// time. Not where Gemma will read instead: there Ward Lite would only take memory.

export async function warmReader(deps: { gemma: () => Promise<boolean>; lite: () => Promise<unknown> }): Promise<boolean> {
  if (await deps.gemma()) return false;
  await deps.lite();
  return true;
}
