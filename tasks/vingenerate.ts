import { MongoClient } from 'mongodb';
import { Task, Actor } from '../screenplay/actor';
import { FALLBACK_VINS } from '../constants/vehicles';

export class VINGenerate implements Task {
  /**
   * Fetches a random live VIN from MongoDB or falls back to a verified test VIN.
   */
  static async getVinFromMongo(): Promise<string | null> {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      console.warn('⚠️ MONGO_URI environment variable is not defined.');
      return null;
    }

    if (process.env.GITHUB_ACTIONS) {
      console.log(`::add-mask::${uri}`);
    }

    const DB_NAME = process.env.MONGO_DB_NAME || 'sales_history';
    const COLL_NAME = process.env.MONGO_COLL_NAME || 'sales13';
    
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3500,
      connectTimeoutMS: 3500,
      socketTimeoutMS: 5000,
    });
    
    try {
      await client.connect();
      const coll = client.db(DB_NAME).collection(COLL_NAME);
      const doc = await coll.aggregate([{ $sample: { size: 1 } }]).toArray();
      return doc[0]?.vin || null;
    } catch (e: any) {
      console.warn(`⚠️ MongoDB VIN sampling failed: ${e.message}`);
      return null;
    } finally {
      await client.close().catch(() => {});
    }
  }

  async performAs(actor: Actor): Promise<void> {
    let generatedVin = await VINGenerate.getVinFromMongo().catch(() => null);
    
    if (!generatedVin) {
      generatedVin = FALLBACK_VINS.US;
      console.log(`⚠️ Using fallback US VIN: ${generatedVin}`);
    } else {
      console.log(`✅ Sampled US VIN from Mongo: ${generatedVin}`);
    }
    
    actor.remember('usVin', generatedVin);
  }
}
