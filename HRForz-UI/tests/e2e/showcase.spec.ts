import { test, expect } from '@playwright/test';

test.describe('Component Library Showcase', () => {
  test('renders the showcase page with components', async ({ page }) => {
    // Wait for Next.js to load the page (since webServer runs Storybook, we might need to change it, 
    // but we can test the local Next.js dev server if we override the URL, 
    // or test Storybook directly. The user specifically asked to build the demo page, so let's test it.)
    
    // Instead of testing Storybook, we'll test the Next.js app running at localhost:3000
    // We assume the Next.js dev server is running because `npm run dev` is running based on the system prompt.
    await page.goto('http://localhost:3000');
    
    // Check heading
    await expect(page.getByRole('heading', { name: 'Next.js React Component Library' })).toBeVisible();
    
    // Check some buttons
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Primary Button' })).toBeVisible();
    
    // Check tabs
    await expect(page.getByRole('tab', { name: 'Form Controls' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Display & Feedback' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Layout & Overlay' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Data & Typography' })).toBeVisible();

    // Click tabs and check content visibility
    await page.getByRole('tab', { name: 'Display & Feedback' }).click();
    await expect(page.getByText('This is an informational alert.')).toBeVisible();

    await page.getByRole('tab', { name: 'Layout & Overlay' }).click();
    await expect(page.getByRole('button', { name: 'Options ▾' })).toBeVisible();
    
    await page.getByRole('tab', { name: 'Data & Typography' }).click();
    await expect(page.getByRole('heading', { name: 'Typography Elements' })).toBeVisible();
  });
});
