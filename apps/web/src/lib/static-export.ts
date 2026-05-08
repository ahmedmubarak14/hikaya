/**
 * Set to true at build time when running with EXPORT=1 (the GitHub Pages
 * workflow). Used to short-circuit anything that touches cookies, server
 * actions, or auth — none of which exist on a static host.
 *
 * Usage:
 *   if (IS_STATIC_EXPORT) return <DemoModeNotice />;
 */
export const IS_STATIC_EXPORT = process.env.EXPORT === '1';
