import { Task, Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { test } from '@playwright/test';
import { EmailGenerator } from './emailGenerator';

export class PreviewToCheckout implements Task {
  static initiate(): PreviewToCheckout {
    return new PreviewToCheckout();
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).page;

    console.log("Starting Preview to Checkout flow...");

    await test.step('Proceed to Checkout', async () => {
      // Flexible locator for the initial trigger button using ARIA roles & fallback text selectors
      const accessRecordsBtn = page
        .getByRole('button', { name: /Access Records|Get Report|Check Now|Continue/i })
        .or(page.locator('button:has-text("Access Records"), a:has-text("Access Records"), [role="button"]:has-text("Access Records")'))
        .first();

      await accessRecordsBtn.scrollIntoViewIfNeeded().catch(() => {});
      await accessRecordsBtn.click({ force: true });

      // Locating email input in popup or inline form with robust ARIA and attribute fallbacks
      const emailInput = page
        .getByRole('textbox', { name: /email/i })
        .or(page.locator('input[type="email"], input[name*="email"], input[placeholder*="email" i]'))
        .first();

      await emailInput.waitFor({ state: 'visible', timeout: 20000 });
      
      const dynamicEmail = EmailGenerator.generate();
      await emailInput.fill(dynamicEmail);
      console.log(`✅ Email entered: ${dynamicEmail}`);

      // Locating modal submit button with accessibility roles and fallback selectors
      const popupSubmitBtn = page
        .getByRole('button', { name: /Access Records|Continue|Get Report|Submit/i })
        .or(page.locator('button[type="submit"], button:has-text("Access Records")'))
        .last();

      await popupSubmitBtn.scrollIntoViewIfNeeded().catch(() => {});
      await popupSubmitBtn.click({ force: true });

      // Wait for navigation to checkout URL
      await page.waitForURL('**/checkout**', { timeout: 90000, waitUntil: 'commit' });
      
      // Wait for checkout content or body container
      const checkoutContainer = page
        .locator('#checkout-form, .checkout-container, form[action*="checkout"], body')
        .first();
      await checkoutContainer.waitFor({ state: 'attached', timeout: 30000 });

      console.log('✅ Successfully Navigated to checkout:', page.url());
    });
  }
}