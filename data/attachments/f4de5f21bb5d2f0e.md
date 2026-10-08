# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scc-member-area.spec.ts >> SCC Member Area Monitoring Flow >> Case 7: Member Area - SCC UK Report Generation Flow
- Location: tests/scc-member-area.spec.ts:38:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*my-reports.*/i
Received string:  "https://smartcarcheck.uk/members/dashboard?type=premium"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    24 × locator resolved to <html>…</html>
       - unexpected value "https://smartcarcheck.uk/members/dashboard?type=premium"

```

```yaml
- region "Notifications alt+T"
- button "close"
- img "Logo"
- button "Search":
  - img
  - link "Search":
    - /url: /members/dashboard?type=basic
- button "My Reports":
  - img
  - link "My Reports":
    - /url: /members/my-reports
- button "Order History":
  - img
  - link "Order History":
    - /url: /members/order-history
- button "Support":
  - img
  - link "Support":
    - /url: /members/help
- text: Order Credits
- button "Vehicle Report":
  - link "Vehicle Report":
    - /url: /members/credits
- link "L Basic Account":
  - /url: /members/profile
  - text: L
  - paragraph
  - paragraph: Basic Account
  - img
- button "Log Out":
  - img
  - link "Log Out":
    - /url: /members/login
- heading "Download Our App" [level=2]
- link "GooglePlay":
  - /url: https://play.google.com/store/apps/details?id=com.vehicledatabases.scc&hl=en&gl=US
  - img "GooglePlay"
- link "AppStore":
  - /url: https://apps.apple.com/us/app/smart-car-check/id1662991486?platform=iphone
  - img "AppStore"
- navigation:
  - img "Menu"
  - text: L Credits expand_more
- button "Close promotion banner":
  - img
- heading "20% Off Your Next Order" [level=2]
- paragraph: Thank you for being our valued customer. As a token of appreciation, we offer you a 20% discount on your next order.
- text: "Use code on checkout: THANKS20"
- tablist:
  - tab "Search by VIN" [selected]
  - tab "Search by Plate"
- heading "Check Any VIN and Make a Smart Decision" [level=1]
- button "Basic Car Check"
- button "Premium Car Check"
- tabpanel "Search by VIN":
  - textbox "VIN":
    - /placeholder: Enter VIN number
    - text: SB1KX28E40E035557
  - paragraph: 17/17
  - paragraph: The report for this registration number was previously generated. Go to “My Reports” page to view and manage your past reports
  - button "Check Vehicle":
    - img
    - text: Check Vehicle
- img "Vehicle Report Preview"
- button "View Sample Report"
- contentinfo:
  - paragraph: © 2026 Copyright Smart Car Check. All rights reserved.
- alert: Smart Car Check | Search
- iframe
```

# Test source

```ts
  39  |     let currentVin = this.customVin || actor.recall<string>('euVin') || actor.recall<string>('ukVin');
  40  |     if (!currentVin) {
  41  |       currentVin = EUVinGenerator.generate();
  42  |       console.log(`🇬🇧 Generated UK/EU VIN: ${currentVin}`);
  43  |     }
  44  |     actor.remember('ukVin', currentVin);
  45  |     actor.remember('euVin', currentVin);
  46  |     actor.remember('lastUsedVin', currentVin);
  47  | 
  48  |     // 3. Click "Premium Car Check" button with Self-Healing Playwright
  49  |     console.log('🔘 Selecting "Premium Car Check"...');
  50  |     const premiumCarCheckSelectors = [
  51  |       'button:has-text("Premium Car Check")',
  52  |       'a:has-text("Premium Car Check")',
  53  |       '[role="button"]:has-text("Premium Car Check")',
  54  |       '.premium-car-check',
  55  |       '#premium-car-check-tab'
  56  |     ];
  57  | 
  58  |     const premiumBtn = page.getByRole('button', { name: /Premium Car Check/i })
  59  |       .or(page.locator('button:has-text("Premium Car Check"), a:has-text("Premium Car Check")'))
  60  |       .locator('visible=true').first();
  61  | 
  62  |     await premiumBtn.click({ force: true, noWaitAfter: true }).catch(async () => {
  63  |       await clickWithHealing(page, 'Premium Car Check', premiumCarCheckSelectors);
  64  |     });
  65  | 
  66  |     // 4. Fill VIN Input with Self-Healing Playwright
  67  |     console.log(`📝 Entering UK VIN "${currentVin}"...`);
  68  |     const vinInputSelectors = [
  69  |       'input[placeholder*="VIN" i]',
  70  |       'input[name*="vin" i]',
  71  |       '#vinInput',
  72  |       '#vin-input',
  73  |       'input[id*="vin" i]',
  74  |       'input[type="text"]'
  75  |     ];
  76  | 
  77  |     const vinInput = page.getByRole('textbox', { name: /VIN/i })
  78  |       .or(page.locator('input[placeholder*="VIN" i], input[name*="vin" i], #vinInput'))
  79  |       .locator('visible=true').first();
  80  | 
  81  |     await vinInput.fill(currentVin, { force: true }).catch(async () => {
  82  |       await fastInputWithHealing(page, 'VIN Input', currentVin, vinInputSelectors);
  83  |     });
  84  | 
  85  |     // 5. Non-blocking Network Response Listener for report APIs
  86  |     page.on('response', async (res: Response) => {
  87  |       const u = res.url().toLowerCase();
  88  |       if (u.includes('api/report') || u.includes('report/generate') || u.includes('api/vhr') || u.includes('check-vehicle')) {
  89  |         try {
  90  |           const postData = res.request().postData();
  91  |           if (postData) {
  92  |             actor.remember('reportApiPayload', JSON.parse(postData));
  93  |           }
  94  |         } catch (e) {}
  95  |         try {
  96  |           const json = await res.json().catch(() => null);
  97  |           if (json) {
  98  |             actor.remember('reportApiResponse', json);
  99  |           }
  100 |         } catch (e) {}
  101 |         actor.remember('reportApiStatus', res.status());
  102 |       }
  103 |     });
  104 | 
  105 |     // 6. Click "Check Vehicle" submit button
  106 |     console.log('🚀 Submitting UK report generation via "Check Vehicle"...');
  107 |     const checkVehicleSelectors = [
  108 |       'button:has-text("Check Vehicle")',
  109 |       'button[type="submit"]:has-text("Check Vehicle")',
  110 |       '#btn-check-vehicle',
  111 |       'button:has-text("Generate Report")',
  112 |       '.check-vehicle-btn'
  113 |     ];
  114 | 
  115 |     const checkVehicleBtn = page.getByRole('button', { name: /Check Vehicle/i })
  116 |       .or(page.locator('button:has-text("Check Vehicle"), button[type="submit"]:visible'))
  117 |       .locator('visible=true').first();
  118 | 
  119 |     await checkVehicleBtn.click({ force: true, noWaitAfter: true }).catch(async () => {
  120 |       await clickWithHealing(page, 'Check Vehicle', checkVehicleSelectors);
  121 |     });
  122 | 
  123 |     // 7. Strict Dynamic Navigation Wait: Must Land on my-reports (allow 300s / 5 min for generation taking 2.5-3 min)
  124 |     console.log('⏳ Processing UK vehicle check (takes ~2.5 to 3 min)... Waiting for redirect to my-reports...');
  125 | 
  126 |     const startTime = Date.now();
  127 |     const timeoutMs = 300000; // 5 minutes (300s)
  128 | 
  129 |     while (Date.now() - startTime < timeoutMs) {
  130 |       const currentUrl = page.url().toLowerCase();
  131 |       if (currentUrl.includes('my-reports')) {
  132 |         break;
  133 |       }
  134 |       await page.waitForTimeout(1000);
  135 |     }
  136 | 
  137 |     const finalUrl = page.url();
  138 |     console.log(`📍 Landed URL: ${finalUrl}`);
> 139 |     await playwrightExpect(page).toHaveURL(/.*my-reports.*/i, { timeout: 10000 });
      |                                  ^ Error: expect(page).toHaveURL(expected) failed
  140 | 
  141 |     console.log(`✅ SCC UK Report Generation Successfully Landed on my-reports for VIN: ${currentVin}`);
  142 |   }
  143 | }
  144 | 
```