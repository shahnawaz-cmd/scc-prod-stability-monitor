

import { MongoClient } from 'mongodb';
import { Task, Actor } from '../screenplay/actor';

export class VINGenerate implements Task {
  static async getVinFromMongo(): Promise<string | null> {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      console.warn("⚠️ MONGO_URI environment variable is not defined.");
      return null;
    }

    const DB_NAME = process.env.MONGO_DB_NAME || 'sales_history';
    const COLL_NAME = process.env.MONGO_COLL_NAME || 'sales13';
    
    const client = new MongoClient(uri);
    
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
