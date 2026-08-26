import { test, expect } from '@playwright/test';
import { Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
import { SCCUSReportGenerate } from '../SCC member area monitoring/tasks/sccUsReportGenerate';

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

});
