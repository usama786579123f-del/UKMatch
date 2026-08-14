/**
 * Single on/off switch for the whole demo layer. When true, api.js
 * intercepts specific endpoints (events, listings, orders) and
 * returns fake data instead of hitting a real backend - lets the
 * client click through the full buyer + seller flow on a static
 * Vercel deployment. Set to false once a real backend is connected.
 */
export const DEMO_MODE = true;