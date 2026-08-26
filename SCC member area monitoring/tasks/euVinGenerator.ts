import { Task, Actor } from '../../screenplay/actor';

export class EUVinGenerator implements Task {
  private static readonly BASE_VIN_PREFIX = 'SB1KX28E40E03'; // First 13 characters of SB1KX28E40E037750

  /**
   * Generates a valid 17-character EU/UK VIN using the base SB1KX28E40E03 prefix
   * and randomized 4-digit numeric suffix on every execution.
   */
  static generate(): string {
    const randomFourDigits = Math.floor(1000 + Math.random() * 9000).toString();
    const generatedVin = `${this.BASE_VIN_PREFIX}${randomFourDigits}`;
    return generatedVin;
  }

  static create(): EUVinGenerator {
    return new EUVinGenerator();
  }

  async performAs(actor: Actor): Promise<void> {
    const generatedVin = EUVinGenerator.generate();
    console.log(`🇪🇺 [EU VIN Generator] Generated EU/UK VIN: ${generatedVin}`);
    
    actor.remember('euVin', generatedVin);
    actor.remember('ukVin', generatedVin);
    actor.remember('lastUsedVin', generatedVin);
  }
}
