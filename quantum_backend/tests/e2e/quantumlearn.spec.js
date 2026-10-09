import { test, expect } from '@playwright/test';

test('QuantumLearn homepage loads', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await expect(page).toHaveTitle(/QuantumLearn/i);

  await page.screenshot({
    path: 'test-results/homepage.png',
    fullPage: true,
  });
});y