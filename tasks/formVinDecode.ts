import { Task, Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { VINGenerate } from './vingenerate';
import { test, Page } from '@playwright/test';
import { locateElementWithHealing, fastInputWithHealing, clickWithHealing } from '../utils/selfHealingLocator';
import { FALLBACK_VINS } from '../constants/vehicles';

export class FormVinDecode implements Task {
  private constructor(private region: 'US' | 'UK' | 'EU', private providedVin?: string) {}

  static forRegion(region: 'US' | 'UK' | 'EU', providedVin?: string): FormVinDecode {
    return new FormVinDecode(region, providedVin);
  }

  async performAs(actor: Actor): Promise<void> {
    const browseTheWeb = actor.abilityTo(BrowseTheWeb);
    const page = browseTheWeb.page;

    const maxAttempts = 3;
    let currentVin = this.providedVin;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await browseTheWeb.dismissPopupsAndCookies().catch(() => {});

      if (!currentVin) {
        currentVin = await VINGenerate.getVinFromMongo();
        if (!currentVin) {
          currentVin = this.region === 'US' ? FALLBACK_VINS.US : FALLBACK_VINS.EU;
          console.log(`⚠️ Using fallback VIN: ${currentVin}`);
        } else {
          console.log(`✅ Fetched VIN from Mongo: ${currentVin}`);
        }
      } else {
        console.log(`✅ Using VIN: ${currentVin}`);
      }

      console.log(`[Attempt ${attempt}/${maxAttempts}] Starting VIN Decode flow for ${this.region}...`);

      // 1. Instant VIN Tab Click (Direct priority locator -> Self-healing fallback)
      const vinCheckSelectors = [
        'button:has-text("VIN CHECK")',
        '.search_by_vin',
        'button:has-text("By VIN")',
        '#vin-tab',
        '.vin-tab'
      ];

      const vinTab = page.locator('button:has-text("VIN CHECK"), .search_by_vin, button:has-text("By VIN"), #vin-tab, .vin-tab').locator('visible=true').first();
      await vinTab.click({ force: true, noWaitAfter: true }).catch(async () => {
        const fallbackTab = await locateElementWithHealing(page, 'VIN CHECK', vinCheckSelectors);
        await fallbackTab.click({ force: true, noWaitAfter: true });
      });

      // 2. Instant VIN Input Fill (Direct priority locator -> Self-healing fallback)
      const vinInputSelectors = [
        'input#vinInput',
        'input[placeholder*="VIN" i]',
        'input[name*="vin" i]',
        'input[id*="vin" i]',
        '#vin-input',
        'input[type="text"]'
      ];
      
      const vinInput = page.locator('input#vinInput, input[placeholder*="VIN" i], #vhr_form_vin input, input[name*="vin" i]').locator('visible=true').first();
      await vinInput.fill(currentVin, { force: true }).catch(async () => {
        await fastInputWithHealing(page, 'Enter VIN', currentVin, vinInputSelectors);
      });

      console.log(`Submitting VIN "${currentVin}" and waiting for preview page redirect...`);

      // 3. Instant Submit Click (Direct priority locator -> Self-healing fallback)
      const submitButtonSelectors = [
        '#vhr_form_vin button',
        'form:has(input[placeholder*="VIN" i]) button',
        'button:has-text("Run My Car Check Now"):visible',
        'button:has-text("Check VIN"):visible',
        'button:has-text("Decode VIN"):visible',
        'button[type="submit"]:visible',
        '.submit-btn:visible'
      ];

      const submitBtn = page.locator('#vhr_form_vin button, form:has(input[placeholder*="VIN" i]) button, button:has-text("Run My Car Check Now"):visible').first();
      await submitBtn.click({ force: true, noWaitAfter: true }).catch(async () => {
        await clickWithHealing(page, 'Run My Car Check Now', submitButtonSelectors);
      });
      const activePage: Page = page;

      // Condition-based dynamic wait: Race preview URL redirect vs explicit error alert
      const notFoundLocator = activePage.locator('.alert-danger, .error-message, .vehicle-not-found, .vin-not-found, p.error, div.error').filter({ hasText: /\b(VIN not found|invalid VIN|vehicle not found)\b/i }).locator('visible=true').first();

      const outcome = await Promise.race([
        activePage.waitForURL(/.*(members\/preview|preview|vhr|report|checkout).*/i, { timeout: 25000 }).then(() => 'PREVIEW_URL'),
        activePage.locator('.vehicle-specifications, .specifications, section, .preview-container, div[class*="spec"]').filter({ hasText: /Vehicle Specifications|Specifications|Vehicle Details|Specs|Records found/i }).locator('visible=true').first().waitFor({ state: 'visible', timeout: 25000 }).then(() => 'SPECS_VISIBLE'),
        notFoundLocator.waitFor({ state: 'visible', timeout: 25000 }).then(() => 'NOT_FOUND')
      ]).catch(() => 'TIMEOUT');

      if (outcome === 'NOT_FOUND' || outcome === 'TIMEOUT') {
        console.warn(`⚠️ [Condition Triggered: ${outcome}] VIN "${currentVin}"`);
        if (attempt < maxAttempts) {
          await page.goto('https://smartcarcheck.uk/', { waitUntil: 'load' });
          await page.waitForTimeout(1000);
          continue;
        } else {
          throw new Error(`VIN Decode Failed: All ${maxAttempts} VIN attempts failed to redirect to preview report.`);
        }
      }

      try {
        if (!activePage.url().includes('preview') && !activePage.url().includes('report')) {
          await activePage.waitForURL(/.*(members\/preview|preview|vhr|report|checkout).*/i, { timeout: 10000 });
        }

        const specSection = activePage.locator('.vehicle-specifications, .specifications, section, .preview-container, div[class*="spec"]').filter({ hasText: /Vehicle Specifications|Specifications|Vehicle Details|Specs|Records found/i }).locator('visible=true').first();
        await specSection.waitFor({ state: 'visible', timeout: 15000 });

        let sectionData = '';
        let dynamicVehicleName = '';

        await test.step('Capture Vehicle Data', async () => {
          sectionData = await specSection.innerText().catch(() => '');
          const vehicleTitleLocator = activePage.locator('h1, h2, .vehicle-title-class, [class*="vehicle-title"]').first();
          dynamicVehicleName = await vehicleTitleLocator.innerText().catch(() => 'Unknown Vehicle');
        });

        await test.step(`Captured Vehicle: ${dynamicVehicleName}`, async () => {
          console.log("Section Data:\n", sectionData);
        });

        actor.capturedSpecs = sectionData;
        actor.capturedVehicleName = dynamicVehicleName;

        console.log(`✅ VIN "${currentVin}" decoded successfully. Vehicle: ${dynamicVehicleName}`);
        return;

      } catch (error: any) {
        console.warn(`⚠️ Spec capture failed for VIN "${currentVin}": ${error.message}`);
        if (attempt < maxAttempts) {
          currentVin = this.region === 'US' ? FALLBACK_VINS.US : FALLBACK_VINS.EU;
          await page.goto('https://smartcarcheck.uk/', { waitUntil: 'domcontentloaded' });
        }
      }
    }

    throw new Error(`VIN Decode Validation Failed after ${maxAttempts} attempts.`);
  }
}