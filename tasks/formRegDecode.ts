import { Task, Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { test, expect } from '@playwright/test';
import { locateInputWithHealing, clickWithHealing } from '../utils/selfHealingLocator';

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

    const regInputSelectors = [
      'input[placeholder*="REG" i]',
      'input[name="registration"]',
      'input[name="vrm"]',
      '#plateInput',
      '#vrm-input',
      '.plate_input'
    ];

    // Self-healing locator for REG input field
    const regInput = await locateInputWithHealing(
      page,
      'Enter REG',
      regInputSelectors
    );

    await regInput.scrollIntoViewIfNeeded().catch(() => {});
    await regInput.click();
    await regInput.fill(this.providedReg);
    
    console.log("Submitting REG and waiting for preview page redirect...");

    try {
      // Self-healing click for button
      await clickWithHealing(
        page,
        'Run My Car Check Now',
        ['button[type="submit"]', 'text="Check VRM"', '.submit-btn', 'button:has-text("Run My Car Check Now")']
      );
      
      await expect(page).toHaveURL(/.*(members\/preview|preview|vhr|report|checkout).*/i, { timeout: 30000 });
      
      const specSection = page.locator('section, div, main').filter({ hasText: /Vehicle Specifications|Specifications|Vehicle Details|Specs/i }).first();
      await specSection.waitFor({ state: 'visible', timeout: 30000 });
      
      let sectionData = '';
      let dynamicVehicleName = '';

      await test.step('Capture Vehicle Data', async () => {
        sectionData = await specSection.innerText();
        const vehicleTitleLocator = page.locator('h1, h2, .vehicle-title-class, [class*="vehicle-title"]').first();
        dynamicVehicleName = await vehicleTitleLocator.innerText().catch(() => 'Unknown Vehicle');
        
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
      console.log("REG not decoded cases failed");
      throw new Error(`REG Decode Validation Failed: ${error.message}`);
    }
  }
}