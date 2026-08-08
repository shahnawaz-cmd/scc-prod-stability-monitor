import { Task, Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { test, expect } from '@playwright/test';

export class ExitIntentTrigger implements Task {
  static initiate(): ExitIntentTrigger {
    return new ExitIntentTrigger();
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).page;

    console.log("Starting Exit Intent Trigger flow...");

    await test.step('Trigger Exit Intent and apply discount', async () => {
      // 1. Move mouse around to simulate user reading the page
      await page.mouse.move(400, 400);
      
      // 2. Quickly move the mouse to the absolute top of the viewport (simulating aiming for the X or URL bar)
      await page.mouse.move(400, 0); 
      
      const banner = page.locator('text=Don\'t Leave Yet').or(page.locator('text=Get 10% OFF'));
      const bannerVisible = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      // 3. Fallback: If moving the mouse didn't trigger it (sometimes headless browsers suppress mouse leaves), force the event via JS
      if (!bannerVisible) {
        await page.evaluate(() => {
          document.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, clientY: 0 }));
        });
      }

      // Verify the banner is now visible
      await expect(banner.first()).toBeVisible({ timeout: 10000 });
      console.log('✅ Exit Intent Banner triggered successfully');

      // 4. Click "Take 10% off" button
      await page.locator('text=Take 10% off').first().click();

      // 5. Verify URL has updated with the offer query parameter
      await page.waitForFunction(() => window.location.href.includes('offer=preview10'), { timeout: 15000 });

      const currentURL = page.url();
      console.log('URL after applying discount:', currentURL);
      expect(currentURL).toContain('offer=preview10');
      
      console.log('✅ Discount applied! offer=preview10 is in the URL.');
    });
  }
}
