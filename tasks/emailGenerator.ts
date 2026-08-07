export class EmailGenerator {
  /**
   * Generates a unique email address using Gmail's plus-addressing feature.
   * This ensures the email is completely unique for every test run (to bypass duplicate email checks),
   * but all emails will still successfully route to hommy.stress123@gmail.com without bouncing!
   */
  static generate(): string {
    const baseName = "hommy.stress123";
    const domain = "@gmail.com";
    
    // Generate a random 6-character alphanumeric string
    const randomString = Math.random().toString(36).substring(2, 8);
    
    // Append it using the '+' symbol before the domain
    return `${baseName}+${randomString}${domain}`;
  }
}
