/** Signal that a programmatic navigation has started (for the progress bar) */
export const NAV_START_EVENT = "ug:navigation-start";

export function notifyNavigationStart(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NAV_START_EVENT));
  }
}
