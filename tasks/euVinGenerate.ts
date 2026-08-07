export class EUVinGenerate {
  /**
   * Generates an EU VIN based on WAUZZZ8P19A128674 
   * by replacing the last 2 characters with random numeric digits.
   */
  static generate(): string {
    const baseVin = 'WAUZZZ8P19A128674';
    const prefix = baseVin.substring(0, 15);
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return prefix + randomSuffix;
  }
}
