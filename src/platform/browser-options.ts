/** Presentation-only browser options. Native hosts have no browser parent/shell. */
type BrowserParent = {
  __sfBrowserOptions?: { protocol: number; controls: boolean; fullscreen: boolean };
  location?: { origin?: string };
  postMessage(message: unknown, origin: string): void;
};
type BrowserRealm = { parent?: BrowserParent; location?: { origin?: string } };
function shell(): BrowserParent | undefined {
  try {
    const realm = globalThis as unknown as BrowserRealm;
    const parent = realm.parent;
    const capabilities = parent?.__sfBrowserOptions;
    return capabilities?.protocol === 1 && capabilities.controls && capabilities.fullscreen ? parent : undefined;
  } catch { return undefined; }
}
export function browserOptionsAvailable(): boolean { return !!shell(); }
function request(action: 'controls' | 'fullscreen'): void {
  const parent = shell();
  // The game's inherited-origin about:blank iframe has no useful URL origin.
  const origin = parent?.location?.origin;
  if (parent && origin && origin !== 'null') parent.postMessage({ type: 'sf-browser-options-v1', action }, origin);
}
export function openBrowserControls(): void { request('controls'); }
export function toggleBrowserFullscreen(): void { request('fullscreen'); }
