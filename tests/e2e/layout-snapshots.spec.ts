import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/tools', '/community', '/profile', '/reports'] as const;

function routeSlug(route: string): string {
  return route === '/' ? 'home' : route.slice(1);
}

for (const route of ROUTES) {
  test(`above-fold layout snapshot: ${route}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load');
    // Let fonts / sticky header settle without waiting for long-polling analytics.
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot(`${routeSlug(route)}.png`, {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });
}