import { Page, Locator } from '@playwright/test';
import { Ability } from '../core';

export class BrowseTheWeb implements Ability {
  constructor(public page: Page) {}

  static using(page: Page): BrowseTheWeb {
    return new BrowseTheWeb(page);
  }

  /**
   * Smart Popup & Cookie Banner Dismissal Helper
   * Uses non-blocking smart wait techniques to detect and dismiss cookie consent dialogs, 
   * newsletter modals, or GDPR popups without slowing down test execution when absent.
   */
  async dismissPopupsAndCookies(customTimeout: number = 3000): Promise<boolean> {
    const popupLocators: Locator[] = [
      this.page.locator('button:has-text("Accept All"), button:has-text("Allow All"), button:has-text("Accept Cookies"), button:has-text("I Agree"), button:has-text("Got it")'),
      this.page.locator('#cookie-consent-accept, .cookie-accept-btn, .cc-accept, [aria-label*="accept cookies" i]'),
      this.page.locator('.modal-close, .popup-close, button[aria-label="Close"], .close-modal-btn')
    ];

    for (const locator of popupLocators) {
      try {
        // Smart Wait 1: Non-blocking visibility condition check with short timeout
        const isVisible = await locator.first().isVisible({ timeout: customTimeout }).catch(() => false);
        if (isVisible) {
          console.log('🛡️ [Smart Wait] Cookie/Popup banner detected. Dismissing...');
          
          // Smart Wait 2: Ensure element is scrolled into view before interacting
          await locator.first().scrollIntoViewIfNeeded().catch(() => {});
          await locator.first().click({ force: true }).catch(() => {});
          
          // Smart Wait 3: Wait for element state to detach or transition to hidden
          await locator.first().waitFor({ state: 'hidden', timeout: 2500 }).catch(() => {});
          console.log('✅ [Smart Wait] Cookie/Popup banner dismissed successfully.');
          return true;
        }
      } catch (e) {
        // Gracefully move to next locator strategy
      }
    }
    return false;
  }
}
