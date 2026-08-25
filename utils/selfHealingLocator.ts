import { Page, Locator } from '@playwright/test';

export interface SelfHealingOptions {
  timeout?: number;
  strategyTimeout?: number;
  isSlowNetwork?: boolean;
}

/**
 * Self-healing locator helper with Condition-Based Timeouts for resilient element resolution.
 * Automatically tries multiple primary accessibility locators (getByRole, getByLabel, getByPlaceholder, getByTestId)
 * before cascading into fallback CSS/XPath selectors.
 * Always targets .first() to prevent Playwright strict mode violations when multiple inputs exist.
 */
export async function locateElementWithHealing(
  page: Page,
  labelText: string,
  fallbackSelectors: (string | ((page: Page) => Locator))[] = [],
  options: SelfHealingOptions = {}
): Promise<Locator> {
  const isSlowNetwork = options.isSlowNetwork || process.env.SLOW_NETWORK === 'true';
  const baseTimeout = options.timeout || (isSlowNetwork ? 10000 : 4000);
  const strategyTimeout = options.strategyTimeout || Math.max(1500, Math.floor(baseTimeout / 3));

  const strategies: (() => Locator)[] = [
    () => page.getByRole('button', { name: labelText }).first(),
    () => page.getByRole('tab', { name: labelText }).first(),
    () => page.getByRole('textbox', { name: labelText }).first(),
    () => page.getByLabel(labelText).first(),
    () => page.getByPlaceholder(labelText).first(),
    () => page.getByTestId(labelText.toLowerCase().replace(/\s+/g, '-')).first(),
    ...fallbackSelectors.map(sel => () => (typeof sel === 'function' ? sel(page).first() : page.locator(sel).first()))
  ];

  for (let i = 0; i < strategies.length; i++) {
    const getLocator = strategies[i];
    try {
      const locator = getLocator();

      // Dynamic condition check: wait for element visibility with dynamic timeout
      const isVisible = await locator.isVisible({ timeout: strategyTimeout }).catch(() => false);
      if (isVisible) {
        console.log(`✅ [Self-Healing] Successfully located element for "${labelText}" using strategy #${i + 1}`);
        return locator;
      }
    } catch (e) {
      // Continue to next healing strategy
    }
  }

  console.warn(`⚠️ [Self-Healing] All primary strategies unverified for "${labelText}". Returning primary fallback strategy.`);
  return strategies[0]();
}

/**
 * Helper to click an element resilience-first using self-healing strategies
 */
export async function clickWithHealing(
  page: Page,
  buttonTextTextOrLabel: string,
  fallbackSelectors: (string | ((page: Page) => Locator))[] = [],
  options: SelfHealingOptions = {}
): Promise<void> {
  const strategies: (() => Locator)[] = [
    () => page.getByRole('button', { name: buttonTextTextOrLabel }).first(),
    () => page.locator(`text="${buttonTextTextOrLabel}"`).first(),
    () => page.getByTestId(buttonTextTextOrLabel.toLowerCase().replace(/\s+/g, '-')).first(),
    ...fallbackSelectors.map(sel => () => (typeof sel === 'function' ? sel(page).first() : page.locator(sel).first()))
  ];

  const strategyTimeout = options.strategyTimeout || 3000;

  for (let i = 0; i < strategies.length; i++) {
    try {
      const locator = strategies[i]();
      const isVisible = await locator.isVisible({ timeout: strategyTimeout }).catch(() => false);
      if (isVisible) {
        console.log(`✅ [Self-Healing Click] Located button "${buttonTextTextOrLabel}" using strategy #${i + 1}`);
        await locator.click();
        return;
      }
    } catch (e) {
      // Continue next strategy
    }
  }

  console.warn(`⚠️ [Self-Healing Click] Strategies unverified for "${buttonTextTextOrLabel}". Executing fallback click.`);
  await strategies[0]().click();
}
