import { FALLBACK_VINS } from '../constants/vehicles';

export class EUVinGenerate {
  /**
   * Generates an EU VIN based on verified Audi A3 pattern (WAUZZZ8P19A128638)
   */
  static generate(): string {
    const baseVin = FALLBACK_VINS.EU;
    const prefix = baseVin.substring(0, 15);
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return prefix + randomSuffix;
  }
}
