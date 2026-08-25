import { Task, Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { test, expect } from '@playwright/test';
import { locateElementWithHealing, clickWithHealing } from '../utils/selfHealingLocator';

export class FormRegDecode implements Task {
  private constructor(private providedReg: string) {}

  static withReg(providedReg: string): FormRegDecode {
    return new FormRegDecode(providedReg);
  }

  async performAs(actor: Actor): Promise<void> {
    const browseTheWeb = actor.abilityTo(BrowseTheWeb);
    const page = browseTheWeb.page;

    // Smart Wait Popup / Cookie Banner Dismissal
    await browseTheWeb.dismissPopupsAndCookies();

    console.log(`Starting REG Decode flow with REG: ${this.providedReg}`);

    // Self-healing locator for REG input field
    const regInput = await locateElementWithHealing(
      page,
      'Enter REG',
      [
        'input[name="registration"]',
        'input[name="vrm"]',
        'input[name="reg"]',
        'input[placeholder*="REG" i]',
        'input[placeholder*="VRM" i]',
        'input[placeholder*="Enter" i]',
        '#vrm-input',
        '#vrm',
        '#registration',
        'input[aria-label*="registration" i]',
        'input[aria-label*="vrm" i]',
        'input[type="text"]'
      ]
    );

    await regInput.scrollIntoViewIfNeeded().catch(() => {});
    await regInput.click();
    await regInput.fill(this.providedReg);
    
    console.log("Submitting REG and waiting for preview page redirect...");

    try {
      // Self-healing click for submit button
      await clickWithHealing(
        page,
        'Run My Car Check Now',
        [
          'button[type="submit"]',
          'text="Check VRM"',
          'text="Run My Car Check Now"',
          'text="Get Check"',
          'button:has-text("Check")',
          'button:has-text("Search")',
          '.submit-btn',
          '[data-testid="submit-vrm"]',
          'a[role="button"]:has-text("Check")'
        ]
      );
      
      // Wait for navigation or preview state change
      await Promise.race([
        expect(page).toHaveURL(/.*members\/preview.*/i, { timeout: 30000 }),
        expect(page).toHaveURL(/.*vhr.*/i, { timeout: 30000 }),
        page.waitForSelector('section:has-text("Vehicle")', { timeout: 30000 }).catch(() => null)
      ]);

      // Flexible locator for Vehicle Specifications
      const specSection = page
        .locator('section, div.specifications, div[class*="spec"], div[class*="vehicle-details"]')
        .filter({ hasText: /Vehicle Specifications|Vehicle Specs|Vehicle Details|Specifications/i })
        .first();

      await specSection.waitFor({ state: 'visible', timeout: 30000 }).catch(async () => {
        await page.waitForLoadState('networkidle').catch(() => {});
      });
      
      let sectionData = '';
      let dynamicVehicleName = '';

      await test.step('Capture Vehicle Data', async () => {
        if (await specSection.isVisible().catch(() => false)) {
          sectionData = await specSection.innerText();
        } else {
          sectionData = await page.locator('main, body').innerText();
        }

        const vehicleTitleLocator = page
          .locator('h1, h2, .vehicle-title, [class*="vehicle-title"], [class*="vrm-title"]')
          .first();

        if (await vehicleTitleLocator.isVisible().catch(() => false)) {
          dynamicVehicleName = await vehicleTitleLocator.innerText();
        } else {
          dynamicVehicleName = this.providedReg;
        }
        
        await specSection.click().catch(() => {});
        await vehicleTitleLocator.click().catch(() => {});
      });

      await test.step(`Captured Vehicle: ${dynamicVehicleName}`, async () => {
        console.log("Section Data:\n", sectionData);
      });

      (actor as any).capturedSpecs = sectionData;
      (actor as any).capturedVehicleName = dynamicVehicleName;
      
      console.log("REG decoded successfully");

    } catch (error: any) {
      console.log("REG not decoded cases failed:", error.message);
      throw new Error(`REG Decode Validation Failed: ${error.message}`);
    }
  }
}