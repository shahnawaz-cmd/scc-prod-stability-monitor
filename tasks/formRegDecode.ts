import { Task, Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { test, expect } from '@playwright/test';

export class FormRegDecode implements Task {
  private constructor(private providedReg: string) {}

  static withReg(providedReg: string): FormRegDecode {
    return new FormRegDecode(providedReg);
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).page;

    console.log(`Starting REG Decode flow with REG: ${this.providedReg}`);

    // Fill the Registration Number
    const regInput = page.getByRole('textbox', { name: 'Enter REG' }).first();
    await regInput.click();
    await regInput.fill(this.providedReg);
    
    console.log("Submitting REG and waiting for preview page redirect...");

    try {
      const urlTimeout = 30000;

      // Click the run button
      await page.getByRole('button', { name: 'Run My Car Check Now' }).first().click();
      
      // Wait for URL redirect (This is required so we don't accidentally grab the homepage text!)
      await expect(page).toHaveURL(/.*members\/preview\?type=vhr.*/, { timeout: 30000 });
      
      // Check if the Vehicle Specifications section appears
      const specSection = page.locator('section').filter({ hasText: /Vehicle Specifications/i }).first();
      await specSection.waitFor({ state: 'visible', timeout: 30000 });
      
      // Capture data and log it in the Playwright Report using test.step
      let sectionData = '';
      let dynamicVehicleName = '';

      await test.step('Capture Vehicle Data', async () => {
        sectionData = await specSection.innerText();
        const vehicleTitleLocator = page.locator('h1, h2, .vehicle-title-class').first();
        dynamicVehicleName = await vehicleTitleLocator.innerText();
        
        await specSection.click();
        await vehicleTitleLocator.click();
      });

      // Show the captured data explicitly in the test report steps
      await test.step(`Captured Vehicle: ${dynamicVehicleName}`, async () => {
        console.log("Section Data:\n", sectionData);
      });

      // Attach to actor
      (actor as any).capturedSpecs = sectionData;
      (actor as any).capturedVehicleName = dynamicVehicleName;
      
      console.log("REG decoded successfully");

    } catch (error: any) {
      console.log("REG not decoded cases failed");
      throw new Error(`REG Decode Validation Failed: ${error.message}`);
    }
  }
}
