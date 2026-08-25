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
      // Locating email input with accessibility roles and fallback selectors
      const emailInput = page
        .getByRole('textbox', { name: /email/i })
        .or(page.locator('input[type="email"], input[name*="email"], input[placeholder*="email" i], input[id*="email" i]'))
        .first();

      // Check if email input is already visible before trying to click trigger button
      const isEmailInputVisible = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);

      if (!isEmailInputVisible) {
        // Flexible locator for the initial trigger button using ARIA roles & fallback text selectors
        const accessRecordsBtn = page
          .getByRole('button', { name: /Access Records|Get Report|Check Now|Continue|View Report|Proceed/i })
          .or(page.getByRole('link', { name: /Access Records|Get Report|Check Now|Continue|View Report|Proceed/i }))
          .or(page.locator('button:has-text("Access Records"), a:has-text("Access Records"), [role="button"]:has-text("Access Records"), button:has-text("Get Report")'))
          .first();

        if (await accessRecordsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await accessRecordsBtn.scrollIntoViewIfNeeded().catch(() => {});
          await accessRecordsBtn.click({ force: true }).catch(() => {});
        }
      }

      await emailInput.waitFor({ state: 'visible', timeout: 20000 });
      
      const dynamicEmail = EmailGenerator.generate();
      await emailInput.fill(dynamicEmail);
      console.log(`✅ Email entered: ${dynamicEmail}`);

      // Locating modal submit button with accessibility roles and fallback selectors
      const popupSubmitBtn = page
        .getByRole('button', { name: /Access Records|Continue|Get Report|Submit|Proceed|Checkout|View Report/i })
        .or(page.locator('button[type="submit"], form button, .modal button, button:has-text("Access Records"), button:has-text("Continue")'))
        .last();

      if (await popupSubmitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await popupSubmitBtn.scrollIntoViewIfNeeded().catch(() => {});
        await popupSubmitBtn.click({ force: true });
      } else {
        await emailInput.press('Enter').catch(() => {});
      }

      // Wait for navigation or checkout UI state
      await Promise.race([
        page.waitForURL(/.*checkout.*/i, { timeout: 90000, waitUntil: 'commit' }),
        page.waitForSelector('#checkout-form, .checkout-container, form[action*="checkout"], .checkout, [class*="checkout"]', { timeout: 90000, state: 'attached' })
      ]).catch(() => {});

      // Wait for checkout container or body
      const checkoutContainer = page
        .locator('#checkout-form, .checkout-container, form[action*="checkout"], .checkout, main, body')
        .first();
      await checkoutContainer.waitFor({ state: 'attached', timeout: 30000 });

      console.log('✅ Successfully Navigated to checkout:', page.url());
    });
  }
}