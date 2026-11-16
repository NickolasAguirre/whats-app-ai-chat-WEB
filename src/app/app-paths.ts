/**
 * The prefix this module's routes live under. Every link inside the module is built from it, so moving the module
 * to another prefix is a one-line change here (plus the container's menu entries).
 */
export const ROUTE_PREFIX = 'whatsapp';

export const APP_PATHS = {
  dashboard: `/${ROUTE_PREFIX}/dashboard`,
  instructions: `/${ROUTE_PREFIX}/instructions`,
  numbers: `/${ROUTE_PREFIX}/numbers`,
  conversations: `/${ROUTE_PREFIX}/conversations`,
} as const;
