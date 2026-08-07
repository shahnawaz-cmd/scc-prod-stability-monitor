import { MongoClient } from 'mongodb';
import * as crypto from 'crypto';
import { Task, Actor } from '../screenplay/actor'; // Using the actor.ts we created earlier

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_chars_long';
const IV_LENGTH = 16;

export function decryptMongoUrl(encryptedUrl: string): string | null {
    if (!encryptedUrl) return null;
    try {
        const textParts = encryptedUrl.split(':');
        const iv = Buffer.from(textParts.shift() as string, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString();
    } catch (e: any) {
        console.error("Failed to decrypt Mongo URL:", e.message);
        return null;
    }
}

export function encryptMongoUrl(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export class VINGenerate implements Task {
  static async getVinFromMongo(): Promise<string | null> {
    const encryptedUri = process.env.ENCRYPTED_MONGO_URI;
    
    if (!encryptedUri) {
      console.warn("⚠️ ENCRYPTED_MONGO_URI environment variable is not defined.");
      return null;
    }

    const decryptedUri = decryptMongoUrl(encryptedUri);
    if (!decryptedUri) {
      return null;
    }

    const DB_NAME = process.env.MONGO_DB_NAME || 'sales_history';
    const COLL_NAME = process.env.MONGO_COLL_NAME || 'sales13';
    
    const client = new MongoClient(decryptedUri);
    
    try {
      await client.connect();
      const coll = client.db(DB_NAME).collection(COLL_NAME);
      const doc = await coll.aggregate([{ $sample: { size: 1 } }]).toArray();
      return doc[0]?.vin;
    } catch (e: any) {
      console.error('Error fetching VIN from MongoDB:', e.message);
      return null;
    } finally {
      await client.close();
    }
  }

  async performAs(actor: Actor): Promise<void> {
    let generatedVin: string | null = null;
    try {
      generatedVin = await VINGenerate.getVinFromMongo();
    } catch (e: any) {
      console.warn(`⚠️ VIN retrieval from MongoDB failed: ${e.message}.`);
    }
    
    if (!generatedVin) {
      generatedVin = '1FUJHHDR4MLMJ5064';
      console.log(`Using fallback generated VIN: ${generatedVin}`);
    }
    
    // Using a dynamic property for the actor to store the VIN
    (actor as any).usVin = generatedVin;
    console.log("VIN generated and set on actor:", (actor as any).usVin);
  }
}
