# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scc-monitoring.spec.ts >> SCC Monitoring Flow >> Case 1: VIN decodeing Flow US VIN
- Location: tests/scc-monitoring.spec.ts:15:7

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: page.goto: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [active] [ref=f5e1]:
  - generic [ref=f5e2]:
    - generic [ref=f5e3]: Records found for 2014 HYUNDAI ACCENT
    - main [ref=f5e9]:
      - generic [ref=f5e10]:
        - generic [ref=f5e12]:
          - generic [ref=f5e13]:
            - generic [ref=f5e14]:
              - heading "2014 HYUNDAI ACCENT" [level=1] [ref=f5e15]
              - paragraph [ref=f5e16]: "VIN: KMHCU4AE1EU775177"
            - generic [ref=f5e17]: Records found
          - generic [ref=f5e21]:
            - generic [ref=f5e22]:
              - generic [ref=f5e23]: Trim
              - generic [ref=f5e24]: 5DR SE / 5DR SE Sunroof/ 4DR GLS Prem
            - generic [ref=f5e25]:
              - generic [ref=f5e26]: Engine
              - generic [ref=f5e27]: DOHC GDI GAMMA
            - generic [ref=f5e28]:
              - generic [ref=f5e29]: Fuel Type
              - generic [ref=f5e30]: Gasoline
            - generic [ref=f5e31]:
              - generic [ref=f5e32]: Doors
              - generic [ref=f5e33]: "4"
            - generic [ref=f5e34]:
              - generic [ref=f5e35]: Manufacturer
              - generic [ref=f5e36]: HYUNDAI
        - generic [ref=f5e37]:
          - heading "Reveal records for this vehicle" [level=2] [ref=f5e38]
          - generic [ref=f5e39]:
            - generic [ref=f5e40]:
              - generic [ref=f5e41] [cursor=pointer]: Accident & Damage
              - generic [ref=f5e51] [cursor=pointer]: Title & Brand Check
              - generic [ref=f5e62] [cursor=pointer]: Odometer & Mileage
              - generic [ref=f5e73] [cursor=pointer]: Theft Records
              - generic [ref=f5e83] [cursor=pointer]: Auction History
              - generic [ref=f5e97] [cursor=pointer]: Lien & Loan
              - generic [ref=f5e107] [cursor=pointer]: Ownership & Sales
              - generic [ref=f5e119] [cursor=pointer]: Market Value
            - generic [ref=f5e130] [cursor=pointer]: Reveal Records
        - complementary [ref=f5e132]:
          - heading "Unlock the history — choose your package" [level=2] [ref=f5e134]
          - generic [ref=f5e135]:
            - button "1 Report £14.99/report £14.99" [pressed] [ref=f5e136] [cursor=pointer]:
              - generic [ref=f5e137]:
                - generic [ref=f5e141]:
                  - generic [ref=f5e142]: 1 Report
                  - generic [ref=f5e143]: £14.99/report
                - generic [ref=f5e144]: £14.99
            - button "3 Reports £9.66/report £28.99 £44.97 Save 36%" [ref=f5e146] [cursor=pointer]:
              - generic [ref=f5e147]:
                - generic [ref=f5e149]:
                  - generic [ref=f5e150]: 3 Reports
                  - generic [ref=f5e151]: £9.66/report
                - generic [ref=f5e152]:
                  - generic [ref=f5e153]: £28.99
                  - generic [ref=f5e154]: £44.97
                  - generic [ref=f5e155]: Save 36%
            - button "10 Reports £9.00/report £89.99 £149.90 Save 40%" [ref=f5e156] [cursor=pointer]:
              - generic [ref=f5e157]:
                - generic [ref=f5e159]:
                  - generic [ref=f5e160]: 10 Reports
                  - generic [ref=f5e161]: £9.00/report
                - generic [ref=f5e162]:
                  - generic [ref=f5e163]: £89.99
                  - generic [ref=f5e164]: £149.90
                  - generic [ref=f5e165]: Save 40%
          - button "Access Records" [ref=f5e166] [cursor=pointer]
          - paragraph [ref=f5e169]:
            - text: By continuing you agree to Smart Car Check
            - link "terms" [ref=f5e170] [cursor=pointer]:
              - /url: https://smartcarcheck.uk/terms-of-service
            - text: and
            - link "privacy policy" [ref=f5e171] [cursor=pointer]:
              - /url: https://smartcarcheck.uk/privacy
            - text: .
        - generic [ref=f5e173]:
          - heading "Estimated market value" [level=2] [ref=f5e178]
          - generic [ref=f5e179]:
            - generic [ref=f5e180]:
              - button "Outstanding" [expanded] [ref=f5e181] [cursor=pointer]
              - generic [ref=f5e183]:
                - generic [ref=f5e184]:
                  - generic [ref=f5e185]: Dealer Retail
                  - generic [ref=f5e186]: $5,306
                - generic [ref=f5e187]:
                  - generic [ref=f5e188]: Private Party
                  - generic [ref=f5e189]: $4,197
                - generic [ref=f5e190]:
                  - generic [ref=f5e191]: Trade-In
                  - generic [ref=f5e192]: $2,247
            - generic [ref=f5e193]:
              - button "Clean" [ref=f5e194] [cursor=pointer]
              - generic [ref=f5e196]:
                - generic [ref=f5e197]:
                  - generic [ref=f5e198]: Dealer Retail
                  - generic [ref=f5e199]: $4,966
                - generic [ref=f5e200]:
                  - generic [ref=f5e201]: Private Party
                  - generic [ref=f5e202]: $3,947
                - generic [ref=f5e203]:
                  - generic [ref=f5e204]: Trade-In
                  - generic [ref=f5e205]: $2,124
            - generic [ref=f5e206]:
              - button "Average" [ref=f5e207] [cursor=pointer]
              - generic [ref=f5e209]:
                - generic [ref=f5e210]:
                  - generic [ref=f5e211]: Dealer Retail
                  - generic [ref=f5e212]: $4,400
                - generic [ref=f5e213]:
                  - generic [ref=f5e214]: Private Party
                  - generic [ref=f5e215]: $3,531
                - generic [ref=f5e216]:
                  - generic [ref=f5e217]: Trade-In
                  - generic [ref=f5e218]: $1,919
            - generic [ref=f5e219]:
              - button "Rough" [ref=f5e220] [cursor=pointer]
              - generic [ref=f5e222]:
                - generic [ref=f5e223]:
                  - generic [ref=f5e224]: Dealer Retail
                  - generic [ref=f5e225]: $3,664
                - generic [ref=f5e226]:
                  - generic [ref=f5e227]: Private Party
                  - generic [ref=f5e228]: $2,991
                - generic [ref=f5e229]:
                  - generic [ref=f5e230]: Trade-In
                  - generic [ref=f5e231]: $1,652
        - generic [ref=f5e232]:
          - generic [ref=f5e233]: Instant access
          - generic [ref=f5e237]: Secure checkout
          - generic [ref=f5e241]: Downloadable PDF
          - generic [ref=f5e246]: Money-back guarantee
    - contentinfo [ref=f5e250]:
      - generic [ref=f5e251]:
        - heading "We check for" [level=2] [ref=f5e252]
        - list [ref=f5e253]:
          - listitem [ref=f5e254]: Ownership History
          - listitem [ref=f5e257]: Odometer Readings
          - listitem [ref=f5e260]: Title Information
          - listitem [ref=f5e263]: Accident History
          - listitem [ref=f5e266]: Junk & Salvage
          - listitem [ref=f5e269]: Total Loss History
          - listitem [ref=f5e272]: Theft & Recovery
          - listitem [ref=f5e275]: Auction Records
          - listitem [ref=f5e278]: Recalls & Defects
          - listitem [ref=f5e281]: Lien & Loan
          - listitem [ref=f5e284]: Market Value
          - listitem [ref=f5e287]: Vehicle Specifications
        - paragraph [ref=f5e290]: Your information is encrypted and transmitted using a Secure Sockets (SSL) protocol.
      - paragraph [ref=f5e292]: © 2026 Smart Car Check. All Rights Reserved.
  - alert [ref=f5e293]
```

# Test source

```ts
  1   | import { Task, Actor } from '../screenplay/actor';
  2   | import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';
  3   | import { VINGenerate } from './vingenerate';
  4   | import { test, Page } from '@playwright/test';
  5   | import { locateElementWithHealing, fastInputWithHealing, clickWithHealing } from '../utils/selfHealingLocator';
  6   | import { FALLBACK_VINS } from '../constants/vehicles';
  7   | 
  8   | export class FormVinDecode implements Task {
  9   |   private constructor(private region: 'US' | 'UK' | 'EU', private providedVin?: string) {}
  10  | 
  11  |   static forRegion(region: 'US' | 'UK' | 'EU', providedVin?: string): FormVinDecode {
  12  |     return new FormVinDecode(region, providedVin);
  13  |   }
  14  | 
  15  |   async performAs(actor: Actor): Promise<void> {
  16  |     const browseTheWeb = actor.abilityTo(BrowseTheWeb);
  17  |     const page = browseTheWeb.page;
  18  | 
  19  |     const maxAttempts = 3;
  20  |     let currentVin = this.providedVin;
  21  | 
  22  |     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  23  |       await browseTheWeb.dismissPopupsAndCookies().catch(() => {});
  24  | 
  25  |       if (!currentVin) {
  26  |         currentVin = await VINGenerate.getVinFromMongo();
  27  |         if (!currentVin) {
  28  |           currentVin = this.region === 'US' ? FALLBACK_VINS.US : FALLBACK_VINS.EU;
  29  |           console.log(`⚠️ Using fallback VIN: ${currentVin}`);
  30  |         } else {
  31  |           console.log(`✅ Fetched VIN from Mongo: ${currentVin}`);
  32  |         }
  33  |       } else {
  34  |         console.log(`✅ Using VIN: ${currentVin}`);
  35  |       }
  36  | 
  37  |       console.log(`[Attempt ${attempt}/${maxAttempts}] Starting VIN Decode flow for ${this.region}...`);
  38  | 
  39  |       // 1. Instant VIN Tab Click (Direct priority locator -> Self-healing fallback)
  40  |       const vinCheckSelectors = [
  41  |         'button:has-text("VIN CHECK")',
  42  |         '.search_by_vin',
  43  |         'button:has-text("By VIN")',
  44  |         '#vin-tab',
  45  |         '.vin-tab'
  46  |       ];
  47  | 
  48  |       const vinTab = page.locator('button:has-text("VIN CHECK"), .search_by_vin, button:has-text("By VIN"), #vin-tab, .vin-tab').locator('visible=true').first();
  49  |       await vinTab.click({ force: true, noWaitAfter: true }).catch(async () => {
  50  |         const fallbackTab = await locateElementWithHealing(page, 'VIN CHECK', vinCheckSelectors);
  51  |         await fallbackTab.click({ force: true, noWaitAfter: true });
  52  |       });
  53  | 
  54  |       // 2. Instant VIN Input Fill (Direct priority locator -> Self-healing fallback)
  55  |       const vinInputSelectors = [
  56  |         'input#vinInput',
  57  |         'input[placeholder*="VIN" i]',
  58  |         'input[name*="vin" i]',
  59  |         'input[id*="vin" i]',
  60  |         '#vin-input',
  61  |         'input[type="text"]'
  62  |       ];
  63  |       
  64  |       const vinInput = page.locator('input#vinInput, input[placeholder*="VIN" i], #vhr_form_vin input, input[name*="vin" i]').locator('visible=true').first();
  65  |       await vinInput.fill(currentVin, { force: true }).catch(async () => {
  66  |         await fastInputWithHealing(page, 'Enter VIN', currentVin, vinInputSelectors);
  67  |       });
  68  | 
  69  |       console.log(`Submitting VIN "${currentVin}" and waiting for preview page redirect...`);
  70  | 
  71  |       // 3. Instant Submit Click (Direct priority locator -> Self-healing fallback)
  72  |       const submitButtonSelectors = [
  73  |         '#vhr_form_vin button',
  74  |         'form:has(input[placeholder*="VIN" i]) button',
  75  |         'button:has-text("Run My Car Check Now"):visible',
  76  |         'button:has-text("Check VIN"):visible',
  77  |         'button:has-text("Decode VIN"):visible',
  78  |         'button[type="submit"]:visible',
  79  |         '.submit-btn:visible'
  80  |       ];
  81  | 
  82  |       const submitBtn = page.locator('#vhr_form_vin button, form:has(input[placeholder*="VIN" i]) button, button:has-text("Run My Car Check Now"):visible').first();
  83  |       await submitBtn.click({ force: true, noWaitAfter: true }).catch(async () => {
  84  |         await clickWithHealing(page, 'Run My Car Check Now', submitButtonSelectors);
  85  |       });
  86  |       const activePage: Page = page;
  87  | 
  88  |       // Condition-based dynamic wait: Race preview URL redirect vs explicit error alert
  89  |       const notFoundLocator = activePage.locator('.alert-danger, .error-message, .vehicle-not-found, .vin-not-found, p.error, div.error').filter({ hasText: /\b(VIN not found|invalid VIN|vehicle not found)\b/i }).locator('visible=true').first();
  90  | 
  91  |       const outcome = await Promise.race([
  92  |         activePage.waitForURL(/.*(members\/preview|preview|vhr|report|checkout).*/i, { timeout: 25000 }).then(() => 'PREVIEW_URL'),
  93  |         activePage.locator('.vehicle-specifications, .specifications, section, .preview-container, div[class*="spec"]').filter({ hasText: /Vehicle Specifications|Specifications|Vehicle Details|Specs|Records found/i }).locator('visible=true').first().waitFor({ state: 'visible', timeout: 25000 }).then(() => 'SPECS_VISIBLE'),
  94  |         notFoundLocator.waitFor({ state: 'visible', timeout: 25000 }).then(() => 'NOT_FOUND')
  95  |       ]).catch(() => 'TIMEOUT');
  96  | 
  97  |       if (outcome === 'NOT_FOUND' || outcome === 'TIMEOUT') {
  98  |         console.warn(`⚠️ [Condition Triggered: ${outcome}] VIN "${currentVin}"`);
  99  |         if (attempt < maxAttempts) {
> 100 |           await page.goto('https://smartcarcheck.uk/', { waitUntil: 'load' });
      |                      ^ Error: page.goto: Target page, context or browser has been closed
  101 |           await page.waitForTimeout(1000);
  102 |           continue;
  103 |         } else {
  104 |           throw new Error(`VIN Decode Failed: All ${maxAttempts} VIN attempts failed to redirect to preview report.`);
  105 |         }
  106 |       }
  107 | 
  108 |       try {
  109 |         if (!activePage.url().includes('preview') && !activePage.url().includes('report')) {
  110 |           await activePage.waitForURL(/.*(members\/preview|preview|vhr|report|checkout).*/i, { timeout: 10000 });
  111 |         }
  112 | 
  113 |         const specSection = activePage.locator('.vehicle-specifications, .specifications, section, .preview-container, div[class*="spec"]').filter({ hasText: /Vehicle Specifications|Specifications|Vehicle Details|Specs|Records found/i }).locator('visible=true').first();
  114 |         await specSection.waitFor({ state: 'visible', timeout: 15000 });
  115 | 
  116 |         let sectionData = '';
  117 |         let dynamicVehicleName = '';
  118 | 
  119 |         await test.step('Capture Vehicle Data', async () => {
  120 |           sectionData = await specSection.innerText().catch(() => '');
  121 |           const vehicleTitleLocator = activePage.locator('h1, h2, .vehicle-title-class, [class*="vehicle-title"]').first();
  122 |           dynamicVehicleName = await vehicleTitleLocator.innerText().catch(() => 'Unknown Vehicle');
  123 |         });
  124 | 
  125 |         await test.step(`Captured Vehicle: ${dynamicVehicleName}`, async () => {
  126 |           console.log("Section Data:\n", sectionData);
  127 |         });
  128 | 
  129 |         actor.capturedSpecs = sectionData;
  130 |         actor.capturedVehicleName = dynamicVehicleName;
  131 | 
  132 |         console.log(`✅ VIN "${currentVin}" decoded successfully. Vehicle: ${dynamicVehicleName}`);
  133 |         return;
  134 | 
  135 |       } catch (error: any) {
  136 |         console.warn(`⚠️ Spec capture failed for VIN "${currentVin}": ${error.message}`);
  137 |         if (attempt < maxAttempts) {
  138 |           currentVin = this.region === 'US' ? FALLBACK_VINS.US : FALLBACK_VINS.EU;
  139 |           await page.goto('https://smartcarcheck.uk/', { waitUntil: 'domcontentloaded' });
  140 |         }
  141 |       }
  142 |     }
  143 | 
  144 |     throw new Error(`VIN Decode Validation Failed after ${maxAttempts} attempts.`);
  145 |   }
  146 | }
```