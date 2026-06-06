/**
 * Runtime guard for modules that must never run in the browser.
 * Unlike the `server-only` package, this does not throw when imported from
 * Node CLI scripts, PM2 workers, or Jest — only in a real browser context.
 */
if (typeof window !== 'undefined') {
  throw new Error('This module cannot be imported in the browser.');
}