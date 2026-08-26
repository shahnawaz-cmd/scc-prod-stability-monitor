import { Task, Actor } from '../../screenplay/actor';
import { BrowseTheWeb } from '../../screenplay/abilities/browseTheWeb';
import { VINGenerate } from '../../tasks/vingenerate';
import { FALLBACK_VINS } from '../../constants/vehicles';
import { fastInputWithHealing, clickWithHealing } from '../../utils/selfHealingLocator';
import { Response, expect as playwrightExpect } from '@playwright/test';

export class SCCUSReportGenerate implements Task {
  private customVin?: string;

  private constructor(customVin?: string) {
    this.customVin = customVin;
  }

  static forUS(customVin?: string): SCCUSReportGenerate {
    return new SCCUSReportGenerate(customVin);
  }

  async performAs(actor: Actor): Promise<void> {
    const browseTheWeb = actor.abilityTo(BrowseTheWeb);
    const page = browseTheWeb.page;

    // 1. Resolve Admin Login URL dynamically from environment
    const token = process.env.SCC_ADMIN_TOKEN || '';
    const baseUrl = process.env.BASE_URL || 'https://smartcarcheck.uk/';
    const adminLoginUrl = process.env.SCC_ADMIN_LOGIN_URL || `${baseUrl.replace(/\/$/, '')}/members/admin-login?token=${token}`;

    console.log('🔐 [Admin Auth] Navigating to Member Area via Token Login...');
    await page.goto(adminLoginUrl, { waitUntil: 'load' });
    await browseTheWeb.dismissPopupsAndCookies().catch(() => {});

    // Condition-based readiness wait for Member Dashboard UI elements
    const dashboardReadyLocator = page.locator(
      'button:has-text("Premium Car Check"), [role="button"]:has-text("Premium Car Check"), input[placeholder*="VIN" i], #vinInput, #vhr_form_vin'
    ).locator('visible=true').first();

    await dashboardReadyLocator.waitFor({ state: 'visible', timeout: 25000 }).catch(() => {});

    // 2. Obtain US VIN (from MongoDB sampling or fallback)
    let currentVin = this.customVin || actor.recall<string>('usVin');
    if (!currentVin) {
      currentVin = await VINGenerate.getVinFromMongo().catch(() => null);
      if (!currentVin) {
        currentVin = FALLBACK_VINS.US;
        console.log(`⚠️ Using fallback US VIN: ${currentVin}`);
      } else {
        console.log(`✅ Sampled US VIN from Mongo: ${currentVin}`);
      }
    }
    actor.remember('usVin', currentVin);

    // 3. Click "Premium Car Check" button with Self-Healing Playwright
    console.log('🔘 Selecting "Premium Car Check"...');
    const premiumCarCheckSelectors = [
      'button:has-text("Premium Car Check")',
      'a:has-text("Premium Car Check")',
      '[role="button"]:has-text("Premium Car Check")',
      '.premium-car-check',
      '#premium-car-check-tab'
    ];

    const premiumBtn = page.getByRole('button', { name: /Premium Car Check/i })
      .or(page.locator('button:has-text("Premium Car Check"), a:has-text("Premium Car Check")'))
      .locator('visible=true').first();

    await premiumBtn.click({ force: true, noWaitAfter: true }).catch(async () => {
      await clickWithHealing(page, 'Premium Car Check', premiumCarCheckSelectors);
    });

    // 4. Fill VIN Input with Self-Healing Playwright
    console.log(`📝 Entering VIN "${currentVin}"...`);
    const vinInputSelectors = [
      'input[placeholder*="VIN" i]',
      'input[name*="vin" i]',
      '#vinInput',
      '#vin-input',
      'input[id*="vin" i]',
      'input[type="text"]'
    ];

    const vinInput = page.getByRole('textbox', { name: /VIN/i })
      .or(page.locator('input[placeholder*="VIN" i], input[name*="vin" i], #vinInput'))
      .locator('visible=true').first();

    await vinInput.fill(currentVin, { force: true }).catch(async () => {
      await fastInputWithHealing(page, 'VIN Input', currentVin, vinInputSelectors);
    });

    // 5. Non-blocking Network Response Listener for report APIs
    page.on('response', async (res: Response) => {
      const u = res.url().toLowerCase();
      if (u.includes('api/report') || u.includes('report/generate') || u.includes('api/vhr') || u.includes('check-vehicle')) {
        try {
          const postData = res.request().postData();
          if (postData) {
            actor.remember('reportApiPayload', JSON.parse(postData));
          }
        } catch (e) {}
        try {
          const json = await res.json().catch(() => null);
          if (json) {
            actor.remember('reportApiResponse', json);
          }
        } catch (e) {}
        actor.remember('reportApiStatus', res.status());
      }
    });

    // 6. Click "Check Vehicle" submit button
    console.log('🚀 Submitting report generation via "Check Vehicle"...');
    const checkVehicleSelectors = [
      'button:has-text("Check Vehicle")',
      'button[type="submit"]:has-text("Check Vehicle")',
      '#btn-check-vehicle',
      'button:has-text("Generate Report")',
      '.check-vehicle-btn'
    ];

    const checkVehicleBtn = page.getByRole('button', { name: /Check Vehicle/i })
      .or(page.locator('button:has-text("Check Vehicle"), button[type="submit"]:visible'))
      .locator('visible=true').first();

    await checkVehicleBtn.click({ force: true, noWaitAfter: true }).catch(async () => {
      await clickWithHealing(page, 'Check Vehicle', checkVehicleSelectors);
    });

    // 7. Strict Dynamic Navigation Wait with Progress Tracking (allow 240s for 2-2.5 min report generation)
    console.log('⏳ Processing vehicle check (report generation takes ~2-2.5 min)... Waiting for redirect to my-reports?region=us...');

    const startTime = Date.now();
    const timeoutMs = 240000;

    while (Date.now() - startTime < timeoutMs) {
      const currentUrl = page.url().toLowerCase();
      if (currentUrl.includes('my-reports') && currentUrl.includes('region=us')) {
        break;
      }
      await page.waitForTimeout(1000);
    }

    const finalUrl = page.url();
    console.log(`📍 Landed URL: ${finalUrl}`);
    await playwrightExpect(page).toHaveURL(/.*my-reports.*region=us.*/i, { timeout: 10000 });

    console.log(`✅ SCC US Report Generation Successfully Landed on my-reports?region=us for VIN: ${currentVin}`);
  }
}
