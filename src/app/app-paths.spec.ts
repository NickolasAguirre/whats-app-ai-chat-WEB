import { APP_PATHS, ROUTE_PREFIX } from './app-paths';
import { routes } from './app.routes';

describe('APP_PATHS', () => {
  const group = routes.find((route) => route.path === ROUTE_PREFIX && route.children);
  const childPaths = (group?.children ?? []).map((child) => `/${ROUTE_PREFIX}/${child.path}`);

  it('every link target points at a route the module really declares', () => {
    for (const target of Object.values(APP_PATHS)) {
      expect(childPaths, `no route for ${target}`).toContain(target);
    }
  });

  it('the bare prefix redirects to the dashboard', () => {
    const redirect = routes.find((route) => route.path === ROUTE_PREFIX && route.redirectTo);
    expect(`/${redirect?.redirectTo}`).toBe(APP_PATHS.dashboard);
  });
});
