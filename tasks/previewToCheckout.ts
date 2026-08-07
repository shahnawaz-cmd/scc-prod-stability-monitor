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
      // Click Access Records - using .first() targets the main button in the content 
      // instead of .last() which targets the sticky footer (which can fail on Chrome desktop due to chat widgets)
      const accessRecordsBtn = page.locator('text=Access Records').first();
      await accessRecordsBtn.scrollIntoViewIfNeeded();
      await accessRecordsBtn.click({ force: true });

      // Smart Wait 1: Wait for the email input popup to become explicitly visible (Replaces waitForTimeout(2000))
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 15000 });
      
      // Use our new dynamic email generator
      const dynamicEmail = EmailGenerator.generate();
      await emailInput.fill(dynamicEmail);
      console.log(`✅ Email entered: ${dynamicEmail}`);

      // Click Access Records inside popup
      const popupSubmitBtn = page.locator('button:has-text("Access Records")').last();
      await popupSubmitBtn.click();

      // Wait for checkout - use commit to not wait for full load
      await page.waitForURL('**/checkout**', { timeout: 90000, waitUntil: 'commit' });
      
      // Smart Wait 2: Wait for the checkout body/form to load (Replaces waitForTimeout(2000))
      const checkoutBody = page.locator('body').first();
      await checkoutBody.waitFor({ state: 'attached', timeout: 30000 });

      console.log('✅ Successfully Navigated to checkout:', page.url());
    });
  }
}
