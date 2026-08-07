import { Task, Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { VINGenerate } from './vingenerate';
import { test, expect } from '@playwright/test';

export class FormVinDecode implements Task {
  private constructor(private region: 'US' | 'UK' | 'EU', private providedVin?: string) {}

  static forRegion(region: 'US' | 'UK' | 'EU', providedVin?: string): FormVinDecode {
    return new FormVinDecode(region, providedVin);
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).page;

    console.log(`Starting VIN Decode flow for ${this.region}`);

    let newTab = page;
    console.log("Clicking VIN CHECK...");
    const vinCheckElement = page.locator('text="VIN CHECK"').first();
    const targetAttr = await vinCheckElement.getAttribute('target').catch(() => null);

    if (targetAttr === '_blank') {
      const [spawnedTab] = await Promise.all([
        page.context().waitForEvent('page', { timeout: 5000 }), 
        vinCheckElement.click()
      ]);
      newTab = spawnedTab;
      console.log("New tab detected.");
    } else {
      await vinCheckElement.click();
      console.log("Clicked instantly (no new tab expected).");
    }
    
    let vin = this.providedVin;
    if (!vin) {
      vin = await VINGenerate.getVinFromMongo();
      if (!vin) {
        vin = this.region === 'US' ? '1FUJHHDR4MLMJ5064' : 'WAUZZZ8P6CA083445';
        console.log(`⚠️ Using fallback VIN: ${vin}`);
      } else {
        console.log(`✅ Fetched VIN from Mongo: ${vin}`);
      }
    } else {
      console.log(`✅ Using provided VIN: ${vin}`);
    }

    await newTab.getByRole('textbox', { name: 'Enter VIN' }).fill(vin);
    console.log("Submitting VIN and waiting for preview page redirect...");
    
    try {
      const isSlowNetwork = process.env.SLOW_NETWORK === 'true';
      const urlTimeout = isSlowNetwork ? 60000 : (this.region === 'UK' ? 30000 : 20000);

      // 1. Click the button directly. We drop waitForURL to avoid ERR_ABORTED if the site uses complex client-side routing.
      await newTab.getByRole('button', { name: 'Run My Car Check Now' }).first().click();
      
      // 2. Web-First Assertion: Playwright will automatically retry checking the URL until it matches, bypassing navigation lifecycle errors.
      await expect(newTab).toHaveURL(/.*members\/preview\?type=vhr.*/, { timeout: urlTimeout });
      
      // 2. Check if the Vehicle Specifications section appears. Use .first() to prevent strict mode violations if multiple sections match.
      const specSection = newTab.locator('section').filter({ hasText: /Vehicle Specifications/i }).first();
      await specSection.waitFor({ state: 'visible', timeout: 30000 });
      
      // Capture data and log it in the Playwright Report using test.step
      let sectionData = '';
      let dynamicVehicleName = '';

      await test.step('Capture Vehicle Data', async () => {
        sectionData = await specSection.innerText();
        const vehicleTitleLocator = newTab.locator('h1, h2, .vehicle-title-class').first();
        dynamicVehicleName = await vehicleTitleLocator.innerText();
        
        // Fulfill the click request
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
      
      // 3. Success message
      console.log("VIN decoded successfully");

    } catch (error: any) {
      // 4. Failure message
      console.log("VIN not decoded cases fialed");
      // Re-throw to ensure the test runner actually fails this task
      throw new Error(`VIN Decode Validation Failed: ${error.message}`);
    }
  }
}
