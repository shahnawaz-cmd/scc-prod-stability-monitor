import { Page } from '@playwright/test';
import { Ability } from '../core';

export class BrowseTheWeb implements Ability {
  private constructor(public page: Page) {}

  static using(page: Page): BrowseTheWeb {
    return new BrowseTheWeb(page);
  }
}
