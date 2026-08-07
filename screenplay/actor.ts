import { Ability, Task, Question } from './core';

export class Actor {
  private abilities: Map<string, Ability> = new Map();

  constructor(public name: string) {}

  static named(name: string): Actor {
    return new Actor(name);
  }

  whoCan(...abilities: Ability[]): Actor {
    for (const ability of abilities) {
      this.abilities.set(ability.constructor.name, ability);
    }
    return this;
  }

  abilityTo<T extends Ability>(abilityClass: new (...args: any[]) => T): T {
    const ability = this.abilities.get(abilityClass.name) as T;
    if (!ability) {
      throw new Error(`${this.name} does not have the ability to ${abilityClass.name}`);
    }
    return ability;
  }

  async attemptsTo(...tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      await task.performAs(this);
    }
  }

  async asks<T>(question: Question<T>): Promise<T> {
    return question.answeredBy(this);
  }
}
