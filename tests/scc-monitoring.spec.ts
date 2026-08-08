import { test } from '@playwright/test';
import { Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { FormVinDecode } from '../tasks/formVinDecode';
import { EUVinGenerate } from '../tasks/euVinGenerate';
import { FormRegDecode } from '../tasks/formRegDecode';
import { PreviewToCheckout } from '../tasks/previewToCheckout';
import { ExitIntentTrigger } from '../tasks/exitIntentTrigger';

const BASE_URL = process.env.BASE_URL || 'https://smartcarcheck.uk/';

test.describe('SCC Monitoring Flow', () => {
  
  test('Case 1: VIN decodeing Flow US VIN', async ({ page }) => {
    // Increase test timeout to 60 seconds to accommodate slow network/redirects
    test.setTimeout(60000);

    const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));

    // Browse to base URL (domcontentloaded is much faster than full load)
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }); 

    // 3. Execute the VIN Decode Task for the US region
    await user.attemptsTo(
      FormVinDecode.forRegion('US')
    );
    
    // We can also verify that the actor successfully stored the specs
    console.log("Test Completed. Vehicle Name:", (user as any).capturedVehicleName);
  });

  test('Case 2: EU VIn decode flow', async ({ page }) => {
    test.setTimeout(60000);
    const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));
    
    // Browse to base URL (domcontentloaded is much faster than full load)
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Generate dynamic EU VIN
    const euVin = EUVinGenerate.generate();
    console.log(`Generated EU VIN: ${euVin}`);

    // Decode using the EU region and specifically generated VIN
    await user.attemptsTo(
      FormVinDecode.forRegion('EU', euVin)
    );
  });

  test('Case 3: Plate REG num decode', async ({ page }) => {
    test.setTimeout(60000);
    const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));
    
    // Browse to base URL (domcontentloaded is much faster than full load)
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Provide a pool of Registration Numbers
    const regNumbers = [
      'FY12PVJ', 'FP61KZM', 'LG64YBK', 'AK59ZVR', 'GU09ZDN', 
      'WF66WUJ', 'BV16OUM', 'YL56YUX', 'BX69KDN', 'YF20YKU', 
      'C230KBW', 'WM16KLA', 'OV68PLU', 'LC66RXY', 'AV22UDS', 
      'YD20YSS', 'WB19EZH', 'RO21NDL', 'FR11YGU', 'YR08NNA', 
      'T283KLE', 'KLZ995', 'WA57OUX', 'OE72DMU', 'GJ56EYR', 
      'HST773G', 'HY15UHO', 'MA08YWN', 'LG65WPN', 'YE08JHJ', 
      'LL20YXZ', 'CP66WLC', 'YN71XZL', 'EJ20WGN', 'YA66FTX', 
      'X100MSB', 'SD21ZWL', 'HT65KKJ', 'DX69YCA', 'MV69XDA', 
      'RA65CWV', 'MT66TTF', 'WN63GYW', 'AU20OKG', 'AK16LSZ', 
      'YA70VJK', 'NG19WCT', 'OU67OGK'
    ];

    // Pick a random plate on every run
    const randomReg = regNumbers[Math.floor(Math.random() * regNumbers.length)];

    // Execute the REG Decode Task
    await user.attemptsTo(
      FormRegDecode.withReg(randomReg),
      PreviewToCheckout.initiate()
    );
  });

  test('Case 4: VIN Decode to Checkout Navigation', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Skipping Case 4: This case is configured to only run on Desktop Chrome.');
    test.setTimeout(90000); // Give it enough time to run the full E2E flow
    const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));
    
    // Browse to base URL (domcontentloaded is much faster than full load)
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Execute the VIN Decode Task (US fallback) and then proceed to Checkout
    await user.attemptsTo(
      FormVinDecode.forRegion('US'),
      PreviewToCheckout.initiate()
    );
  });

  test('Case 5: Exit Intent Trigger on Preview Page', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Skipping Case 5: Exit intent mouse movements only apply to Desktop Chrome.');
    test.setTimeout(90000); 
    const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));
    
    // Browse to base URL
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Execute REG Decode to land on Preview page, then trigger the Exit Intent banner
    await user.attemptsTo(
      FormRegDecode.withReg('AK59ZVR'),
      ExitIntentTrigger.initiate()
    );
  });

});
