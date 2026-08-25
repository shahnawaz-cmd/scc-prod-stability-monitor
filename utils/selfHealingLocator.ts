import { Page, Locator } from '@playwright/test';

export interface SelfHealingOptions {
  timeout?: number;
  strategyTimeout?: number;
  isSlowNetwork?: boolean;
}

/**
 * Self-healing locator helper specifically designed for Input / Textbox fields.
 * Prioritizes accessibility textboxes, labels, placeholders, and attribute selectors before CSS/XPath fallbacks.
 * Always targets .first() to prevent Playwright strict mode violations.
 */
export async function locateInputWithHealing(
  page: Page,
  labelText: string,
  fallbackSelectors: (string | ((page: Page) => Locator))[] = [],
  options: SelfHealingOptions = {}
): Promise<Locator> {
  const isSlowNetwork = options.isSlowNetwork || process.env.SLOW_NETWORK === 'true';
  const baseTimeout = options.timeout || (isSlowNetwork ? 10000 : 4000);
  const strategyTimeout = options.strategyTimeout || Math.max(1500, Math.floor(baseTimeout / 3));

  const strategies: (() => Locator)[] = [
    () => page.getByRole('textbox', { name: labelText }).first(),
    () => page.getByPlaceholder(labelText).first(),
    () => page.getByLabel(labelText).first(),
    () => page.getByTestId(labelText.toLowerCase().replace(/\s+/g, '-')).first(),
    ...fallbackSelectors.map(sel => () => (typeof sel === 'function' ? sel(page).first() : page.locator(sel).first()))
  ];

  for (let i = 0; i < strategies.length; i++) {
    const getLocator = strategies[i];
    try {
      const locator = getLocator();
      const isVisible = await locator.isVisible({ timeout: strategyTimeout }).catch(() => false);
      if (isVisible) {
        console.log(`✅ [Self-Healing Input] Located field "${labelText}" using strategy #${i + 1}`);
        return locator;
      }
    } catch (e) {
      // Continue to next strategy
    }
  }

  // If accessibility locators unverified, try first valid fallback selector
  if (fallbackSelectors.length > 0) {
    const sel = fallbackSelectors[0];
    return typeof sel === 'function' ? sel(page).first() : page.locator(sel).first();
  }

  return strategies[0]();
}

/**
 * Self-healing locator helper for general interactive UI elements.
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
    () => page.getByRole('tab', { name: labelText }).first(),
    () => page.getByRole('button', { name: labelText }).first(),
    () => page.locator(`text="${labelText}"`).first(),
    () => page.getByTestId(labelText.toLowerCase().replace(/\s+/g, '-')).first(),
    ...fallbackSelectors.map(sel => () => (typeof sel === 'function' ? sel(page).first() : page.locator(sel).first()))
  ];

  for (let i = 0; i < strategies.length; i++) {
    const getLocator = strategies[i];
    try {
      const locator = getLocator();
      const isVisible = await locator.isVisible({ timeout: strategyTimeout }).catch(() => false);
      if (isVisible) {
        console.log(`✅ [Self-Healing] Located element "${labelText}" using strategy #${i + 1}`);
        return locator;
      }
    } catch (e) {
      // Continue next strategy
    }
  }

  if (fallbackSelectors.length > 0) {
    const sel = fallbackSelectors[0];
    return typeof sel === 'function' ? sel(page).first() : page.locator(sel).first();
  }

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

  if (fallbackSelectors.length > 0) {
    const sel = fallbackSelectors[0];
    const loc = typeof sel === 'function' ? sel(page).first() : page.locator(sel).first();
    await loc.click({ force: true }).catch(() => {});
    return;
  }

  await strategies[0]().click();
}
