import { test } from '@playwright/test';
import { Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { FormVinDecode } from '../tasks/formVinDecode';
import { decryptMongoUrl } from '../tasks/vingenerate';
import { EUVinGenerate } from '../tasks/euVinGenerate';

// Base URL securely loaded from .env
const ENCRYPTED_BASE_URL = process.env.ENCRYPTED_BASE_URL || '';

test.describe('SCC Monitoring Flow', () => {
  
  test('Case 1: VIN decodeing Flow US VIN', async ({ page }) => {
    // Increase test timeout to 60 seconds to accommodate slow network/redirects
    test.setTimeout(60000);

    const user = Actor.named('Monitor User').whoCan(BrowseTheWeb.using(page));

    const baseUrl = decryptMongoUrl(ENCRYPTED_BASE_URL) || 'https://smartcarcheck.uk/';
    
    // Browse to base URL
    await page.goto(baseUrl); 

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
    const baseUrl = decryptMongoUrl(ENCRYPTED_BASE_URL) || 'https://smartcarcheck.uk/';
    
    // Browse to base URL
    await page.goto(baseUrl);

    // Generate dynamic EU VIN
    const euVin = EUVinGenerate.generate();
    console.log(`Generated EU VIN: ${euVin}`);

    // Decode using the EU region and specifically generated VIN
    await user.attemptsTo(
      FormVinDecode.forRegion('EU', euVin)
    );
  });
});
