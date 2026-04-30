import { test, expect } from '@playwright/test';

test.describe('VOTE-पथ 2.0 E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should load the dashboard and show tricolor stripe', async ({ page }) => {
    const stripe = page.locator('.tricolor-stripe');
    await expect(stripe).toBeVisible();
    await expect(page).toHaveTitle(/VOTE-पथ/);
  });

  test('should open and close the location picker', async ({ page }) => {
    const pickerButton = page.getByLabel('Change location');
    await pickerButton.click();
    
    const cityInput = page.getByPlaceholder('City Name');
    await expect(cityInput).toBeVisible();
    
    await page.getByRole('button', { name: 'Update Location' }).click({ force: true });
    // Should show error if empty
  });

  test('should open the AI chatbot', async ({ page }) => {
    const fab = page.locator('#chatbot-fab');
    await fab.click();
    
    const chatTitle = page.getByText('VOTE-पथ AI ASSISTANT');
    await expect(chatTitle).toBeVisible();
  });

  test('should allow switching between Explore and Report tabs in Booth Pulse', async ({ page }) => {
    const reportTab = page.getByRole('tab', { name: 'REPORT' });
    await reportTab.click();
    
    const reportButton = page.getByRole('button', { name: 'TRANSMIT REPORT' });
    await expect(reportButton).toBeVisible();
    
    const exploreTab = page.getByRole('tab', { name: 'EXPLORE' });
    await exploreTab.click();
    await expect(page.getByText('Local Summary')).toBeVisible();
  });
});
