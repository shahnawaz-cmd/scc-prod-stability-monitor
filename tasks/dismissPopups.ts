import { Task, Actor } from '../screenplay/actor';
import { BrowseTheWeb } from '../screenplay/abilities/browseTheWeb';

export class DismissPopups implements Task {
  private constructor(private timeoutMs: number) {}

  static ifPresent(timeoutMs: number = 3000): DismissPopups {
    return new DismissPopups(timeoutMs);
  }

  async performAs(actor: Actor): Promise<void> {
    const browseTheWeb = actor.abilityTo(BrowseTheWeb);
    await browseTheWeb.dismissPopupsAndCookies(this.timeoutMs);
  }
}
