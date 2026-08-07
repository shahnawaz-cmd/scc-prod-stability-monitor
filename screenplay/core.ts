import { Actor } from './actor';

export interface Ability {}

export interface Task {
  performAs(actor: Actor): Promise<void>;
}

export interface Question<T> {
  answeredBy(actor: Actor): Promise<T>;
}
