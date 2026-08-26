import { Task, Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { test } from '@playwright/test';
import { fastInputWithHealing, clickWithHealing } from '../utils/selfHealingLocator';
import { REGISTRATION_POOL } from '../constants/vehicles';

export class FormRegDecode implements Task {
  private regPool: string[];
  private baseUrl: string;

  private constructor(private providedReg?: string, customPool?: string[], baseUrl?: string) {
    this.regPool = customPool && customPool.length > 0 ? customPool : REGISTRATION_POOL;
    this.baseUrl = baseUrl || process.env.BASE_URL || 'https://smartcarcheck.uk/';
  }

  static withReg(providedReg?: string, customPool?: string[], baseUrl?: string): FormRegDecode {
    return new FormRegDecode(providedReg, customPool, baseUrl);
  }

  private getNextPlate(currentPlate: string): string {
    const remaining = this.regPool.filter(p => p !== currentPlate);
    if (remaining.length === 0) return this.regPool[0];
    return remaining[Math.floor(Math.random() * remaining.length)];
  }

  async performAs(actor: Actor): Promise<void> {
    const browseTheWeb = actor.abilityTo(BrowseTheWeb);
    const page = browseTheWeb.page;

    const regInputSelectors = [
      'input[placeholder*="REG" i]',
      'input[name="registration"]',
      'input[name="vrm"]',
      '#plateInput',
      '#vrm-input',
      '.plate_input'
    ];

    const submitButtonSelectors = [
      '#vhr_form_plate button',
      'form:has(input[placeholder*="REG" i]) button',
      'button[type="submit"]:visible',
      'button:has-text("Run My Car Check Now"):visible',
      'text="Check VRM"',
      '.submit-btn:visible'
    ];

    const maxAttempts = 3;
    let currentReg = this.providedReg || this.getNextPlate('');
    let lastError = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[Attempt ${attempt}/${maxAttempts}] Starting REG Decode flow with REG: ${currentReg}`);

      await browseTheWeb.dismissPopupsAndCookies().catch(() => {});

      // 1. Instant REG Input Fill (Direct priority locator -> Self-healing fallback)
      const regInput = page.locator('input#plateInput, input[placeholder*="REG" i], #vhr_form_plate input, input[name="registration"]').locator('visible=true').first();
      await regInput.fill(currentReg, { force: true }).catch(async () => {
        await fastInputWithHealing(page, 'Enter REG', currentReg, regInputSelectors);
      });

      console.log(`Submitting REG "${currentReg}" and waiting for preview page redirect...`);

      // 2. Instant Submit Click (Direct priority locator -> Self-healing fallback)
      const submitBtn = page.locator('#vhr_form_plate button, form:has(input[placeholder*="REG" i]) button, button:has-text("Run My Car Check Now"):visible').first();
      await submitBtn.click({ force: true, noWaitAfter: true }).catch(async () => {
        await clickWithHealing(page, 'Run My Car Check Now', submitButtonSelectors);
      });

      // Condition-based dynamic wait: Race preview URL/specs vs Error Banner
      const notFoundLocator = page.locator(
        '.vehicle-not-found, .alert-danger, .error-message, p.error, div.error'
      ).filter({ hasText: /\b(vehicle not found|details not found|no vehicle found|invalid registration)\b/i }).locator('visible=true').first();

      const outcome = await Promise.race([
        page.waitForURL(/.*(members\/preview|preview|vhr|report|checkout).*/i, { timeout: 25000 }).then(() => 'REDIRECTED'),
        page.locator('.vehicle-specifications, .specifications, section, .preview-container, div[class*="spec"]').filter({ hasText: /Vehicle Specifications|Specifications|Vehicle Details/i }).locator('visible=true').first().waitFor({ state: 'visible', timeout: 25000 }).then(() => 'SPECS_VISIBLE'),
        notFoundLocator.waitFor({ state: 'visible', timeout: 25000 }).then(() => 'NOT_FOUND')
      ]).catch(() => 'TIMEOUT');

      if (outcome === 'NOT_FOUND' || outcome === 'TIMEOUT') {
        console.warn(`⚠️ [Condition Triggered: ${outcome}] Plate "${currentReg}"`);
        if (attempt < maxAttempts) {
          const nextReg = this.getNextPlate(currentReg);
          console.log(`🔄 Re-opening Base URL (${this.baseUrl}) and switching plate: "${currentReg}" -> "${nextReg}"`);
          currentReg = nextReg;
          await page.goto(this.baseUrl, { waitUntil: 'load' });
          await page.waitForTimeout(1000);
          continue;
        } else {
          throw new Error(`REG Decode Failed: All ${maxAttempts} plate attempts failed to redirect to preview report.`);
        }
      }

      try {
        // Ensure page has landed on preview report before extracting specs
        if (!page.url().includes('preview') && !page.url().includes('report')) {
          await page.waitForURL(/.*(members\/preview|preview|vhr|report|checkout).*/i, { timeout: 10000 });
        }

        const specSection = page.locator('.vehicle-specifications, .specifications, section, .preview-container, div[class*="spec"]').filter({ hasText: /Vehicle Specifications|Specifications|Vehicle Details/i }).locator('visible=true').first();
        await specSection.waitFor({ state: 'visible', timeout: 15000 });

        let sectionData = '';
        let dynamicVehicleName = '';

        await test.step('Capture Vehicle Data', async () => {
          sectionData = await specSection.innerText().catch(() => '');
          const vehicleTitleLocator = page.locator('h1, h2, .vehicle-title-class, [class*="vehicle-title"]').first();
          dynamicVehicleName = await vehicleTitleLocator.innerText().catch(() => 'Unknown Vehicle');
        });

        await test.step(`Captured Vehicle: ${dynamicVehicleName}`, async () => {
          console.log("Section Data:\n", sectionData);
        });

        actor.capturedSpecs = sectionData;
        actor.capturedVehicleName = dynamicVehicleName;

        console.log(`✅ REG "${currentReg}" decoded successfully. Vehicle: ${dynamicVehicleName}`);
        return;

      } catch (error: any) {
        lastError = error.message;
        console.warn(`⚠️ Attempt ${attempt} spec extraction failed for REG "${currentReg}": ${error.message}`);
        if (attempt < maxAttempts) {
          const nextReg = this.getNextPlate(currentReg);
          console.log(`🔄 Re-opening Base URL (${this.baseUrl}) and switching plate: "${currentReg}" -> "${nextReg}"`);
          currentReg = nextReg;
          await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' });
        }
      }
    }

    throw new Error(`REG Decode Validation Failed after ${maxAttempts} attempts: ${lastError}`);
  }
}