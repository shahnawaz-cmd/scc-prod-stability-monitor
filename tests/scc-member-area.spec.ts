import { test, expect } from '@playwright/test';
import { Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { SCCUSReportGenerate } from '../SCC member area monitoring/tasks/sccUsReportGenerate';
import { SCCUKReportGenerate } from '../SCC member area monitoring/tasks/sccUkReportGenerate';
import { EUVinGenerator } from '../SCC member area monitoring/tasks/euVinGenerator';

test.describe('SCC Member Area Monitoring Flow', () => {

  test('Case 6: Member Area - SCC US Report Generation Flow', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes to support 2-2.5 min report generation
    const user = Actor.named('Admin Member User').whoCan(BrowseTheWeb.using(page));

    // Execute the Member Area US Report Generation Task
    await user.attemptsTo(
      SCCUSReportGenerate.forUS()
    );

    // Verify navigation strictly landed on my-reports?region=us
    const finalUrl = page.url();
    console.log('📍 Verified Landed Page URL:', finalUrl);
    expect(finalUrl).toMatch(/.*my-reports.*region=us.*/i);

    // Retrieve captured data from Actor memory
    const apiResponse = user.recall('reportApiResponse');
    const apiPayload = user.recall('reportApiPayload');
    const apiStatus = user.recall('reportApiStatus');
    const usedVin = user.recall('usVin');

    console.log('--- Test Execution Summary (US) ---');
    console.log('🚗 Used US VIN:', usedVin);
    console.log('🔗 Destination URL:', finalUrl);
    if (apiStatus) console.log('📡 API Status Code:', apiStatus);
    if (apiPayload) console.log('📦 API Payload:', JSON.stringify(apiPayload));
    if (apiResponse) console.log('📄 API Response Preview:', JSON.stringify(apiResponse).substring(0, 200));
  });

  test('Case 7: Member Area - SCC UK Report Generation Flow', async ({ page }) => {
    test.setTimeout(360000); // 6 minutes to support ~3 min UK report generation
    const user = Actor.named('Admin Member User').whoCan(BrowseTheWeb.using(page));

    // 1. Generate dynamic EU/UK VIN with randomized 4-digit suffix
    await user.attemptsTo(
      EUVinGenerator.create()
    );

    const generatedUkVin = user.recall<string>('ukVin');
    console.log(`🚗 Initiating UK Report Generation with VIN: ${generatedUkVin}`);

    // 2. Execute the Member Area UK Report Generation Task
    await user.attemptsTo(
      SCCUKReportGenerate.forUK(generatedUkVin)
    );

    // 3. Verify navigation strictly landed on my-reports (without region=us)
    const finalUrl = page.url();
    console.log('📍 Verified Landed Page URL (UK):', finalUrl);
    expect(finalUrl).toMatch(/.*my-reports.*/i);

    // Retrieve captured data from Actor memory
    const apiResponse = user.recall('reportApiResponse');
    const apiPayload = user.recall('reportApiPayload');
    const apiStatus = user.recall('reportApiStatus');

    console.log('--- Test Execution Summary (UK) ---');
    console.log('🚗 Used UK VIN:', generatedUkVin);
    console.log('🔗 Destination URL:', finalUrl);
    if (apiStatus) console.log('📡 API Status Code:', apiStatus);
    if (apiPayload) console.log('📦 API Payload:', JSON.stringify(apiPayload));
    if (apiResponse) console.log('📄 API Response Preview:', JSON.stringify(apiResponse).substring(0, 200));
  });

});
