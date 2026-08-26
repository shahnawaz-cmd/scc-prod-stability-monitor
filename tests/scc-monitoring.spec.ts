import { test } from '@playwright/test';
import { Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { FormVinDecode } from '../tasks/formVinDecode';
import { EUVinGenerate } from '../tasks/euVinGenerate';
import { FormRegDecode } from '../tasks/formRegDecode';
import { PreviewToCheckout } from '../tasks/previewToCheckout';
import { ExitIntentTrigger } from '../tasks/exitIntentTrigger';
import { REGISTRATION_POOL } from '../constants/vehicles';

const BASE_URL = process.env.BASE_URL || 'https://smartcarcheck.uk/';

test.describe('SCC Monitoring Flow', () => {
  
  test('Case 1: VIN decodeing Flow US VIN', async ({ page }) => {
    test.setTimeout(90000);
    const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));

    await page.goto(BASE_URL, { waitUntil: 'load' }); 
    await page.waitForTimeout(1000);

    await user.attemptsTo(
      FormVinDecode.forRegion('US')
    );
    
    console.log('Test Completed. Vehicle Name:', user.capturedVehicleName);
  });

  // test('Case 2: EU VIn decode flow', async ({ page }) => {
  //   test.setTimeout(90000);
  //   const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));
  //   
  //   await page.goto(BASE_URL, { waitUntil: 'load' });
  //   await page.waitForTimeout(1000);
  //
  //   const euVin = EUVinGenerate.generate();
  //   console.log(`Generated EU VIN: ${euVin}`);
  //
  //   await user.attemptsTo(
  //     FormVinDecode.forRegion('EU', euVin)
  //   );
  //
  //   console.log('Test Completed. Vehicle Name:', user.capturedVehicleName);
  // });

  test('Case 3: Plate REG num decode', async ({ page }) => {
    test.setTimeout(90000);
    const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));
    
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    const randomReg = REGISTRATION_POOL[Math.floor(Math.random() * REGISTRATION_POOL.length)];

    await user.attemptsTo(
      FormRegDecode.withReg(randomReg, REGISTRATION_POOL, BASE_URL)
    );

    console.log('Test Completed. Vehicle Name:', user.capturedVehicleName);
  });

  test('Case 4: VIN Decode to Checkout Navigation', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Skipping Case 4: This case is configured to only run on Desktop Chrome.');
    test.setTimeout(90000);
    const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));
    
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    await user.attemptsTo(
      FormVinDecode.forRegion('US'),
      PreviewToCheckout.initiate()
    );
  });

  test('Case 5: Exit Intent Trigger on Preview Page', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Skipping Case 5: Exit intent mouse movements only apply to Desktop Chrome.');
    test.setTimeout(90000); 
    const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));
    
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    await user.attemptsTo(
      FormRegDecode.withReg('WF66WUJ'),
      ExitIntentTrigger.initiate()
    );
  });

});
