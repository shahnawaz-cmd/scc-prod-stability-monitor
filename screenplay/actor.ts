import { Ability, Task, Question } from './core';

export { Ability, Task, Question } from './core';

export class Actor {
  private abilities: Map<string, Ability> = new Map();
  private memory: Map<string, any> = new Map();

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

  remember(key: string, value: any): this {
    this.memory.set(key, value);
    return this;
  }

  recall<T = any>(key: string): T | undefined {
    return this.memory.get(key) as T;
  }

  get capturedVehicleName(): string {
    return this.recall<string>('capturedVehicleName') || 'Unknown Vehicle';
  }

  set capturedVehicleName(value: string) {
    this.remember('capturedVehicleName', value);
  }

  get capturedSpecs(): string {
    return this.recall<string>('capturedSpecs') || '';
  }

  set capturedSpecs(value: string) {
    this.remember('capturedSpecs', value);
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
