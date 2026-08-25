import { Task, Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { VINGenerate } from './vingenerate';
import { test, expect } from '@playwright/test';
import { locateElementWithHealing, locateInputWithHealing, clickWithHealing } from '../utils/selfHealingLocator';

export class FormVinDecode implements Task {
  private constructor(private region: 'US' | 'UK' | 'EU', private providedVin?: string) {}

  static forRegion(region: 'US' | 'UK' | 'EU', providedVin?: string): FormVinDecode {
    return new FormVinDecode(region, providedVin);
  }

  async performAs(actor: Actor): Promise<void> {
    const browseTheWeb = actor.abilityTo(BrowseTheWeb);
    const page = browseTheWeb.page;

    // Smart Wait Popup / Cookie Banner Dismissal
    await browseTheWeb.dismissPopupsAndCookies();

    console.log(`Starting VIN Decode flow for ${this.region}`);

    let newTab = page;
    console.log("Clicking VIN CHECK...");

    const vinCheckSelectors = [
      'text="VIN CHECK"',
      'button:has-text("VIN")',
      'a:has-text("VIN CHECK")',
      'a[href*="vin"]',
      '#vin-tab',
      '.vin-tab'
    ];
    
    let vinCheckElement;
    try {
      vinCheckElement = await locateElementWithHealing(
        page,
        'VIN CHECK',
        vinCheckSelectors
      );
    } catch {
      vinCheckElement = page.locator('text=/VIN/i').first();
    }

    const targetAttr = await vinCheckElement.getAttribute('target').catch(() => null);

    if (targetAttr === '_blank') {
      const [spawnedTab] = await Promise.all([
        page.context().waitForEvent('page', { timeout: 10000 }).catch(() => page),
        vinCheckElement.click().catch(async () => {
          await page.locator('text=/VIN/i').first().click();
        })
      ]);
      newTab = spawnedTab;
      console.log("New tab detected.");
    } else {
      await vinCheckElement.click({ force: true }).catch(async () => {
        await page.locator('text=/VIN/i').first().click({ force: true });
      });
      console.log("Clicked VIN CHECK tab.");
    }

    // Smart Wait: Ensure tab transition completes and VIN input becomes visible
    await newTab.waitForSelector('input[placeholder*="VIN" i], #vinInput, #vin-input, input[name*="vin" i]', { state: 'visible', timeout: 10000 }).catch(() => {});

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

    const vinInputSelectors = [
      'input[placeholder*="VIN" i]',
      'input[name*="vin" i]',
      'input[id*="vin" i]',
      '#vinInput',
      '#vin-input',
      'input[type="text"]'
    ];
    
    const vinInput = await locateInputWithHealing(
      newTab,
      'Enter VIN',
      vinInputSelectors
    );
    await vinInput.scrollIntoViewIfNeeded().catch(() => {});
    await vinInput.click({ force: true }).catch(() => {});
    await vinInput.fill(vin);

    console.log("Submitting VIN and waiting for preview page redirect...");

    try {
      const isSlowNetwork = process.env.SLOW_NETWORK === 'true';
      const urlTimeout = isSlowNetwork ? 60000 : (this.region === 'UK' ? 30000 : 20000);

      const submitButtonSelectors = [
        'button:has-text("Run My Car Check Now")',
        'button:has-text("Check VIN")',
        'button:has-text("Decode VIN")',
        'button[type="submit"]',
        '.submit-btn'
      ];
      await clickWithHealing(
        newTab,
        'Run My Car Check Now',
        submitButtonSelectors
      );

      // Web-First Assertion
      await expect(newTab).toHaveURL(/.*(members\/preview|preview|vhr|report|checkout).*/i, { timeout: urlTimeout });

      const specSection = newTab.locator('section, div, main').filter({ hasText: /Vehicle Specifications|Specifications|Vehicle Details|Specs/i }).first();
      await specSection.waitFor({ state: 'visible', timeout: 30000 });

      let sectionData = '';
      let dynamicVehicleName = '';

      await test.step('Capture Vehicle Data', async () => {
        sectionData = await specSection.innerText();
        const vehicleTitleLocator = newTab.locator('h1, h2, .vehicle-title-class, [class*="vehicle-title"]').first();
        dynamicVehicleName = await vehicleTitleLocator.innerText().catch(() => 'Unknown Vehicle');

        await specSection.click().catch(() => {});
        await vehicleTitleLocator.click().catch(() => {});
      });

      await test.step(`Captured Vehicle: ${dynamicVehicleName}`, async () => {
        console.log("Section Data:\n", sectionData);
      });

      (actor as any).capturedSpecs = sectionData;
      (actor as any).capturedVehicleName = dynamicVehicleName;

      console.log("VIN decoded successfully");

    } catch (error: any) {
      console.log("VIN not decoded cases failed");
      throw new Error(`VIN Decode Validation Failed: ${error.message}`);
    }
  }
}