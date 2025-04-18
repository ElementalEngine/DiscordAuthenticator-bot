import mongoose from 'mongoose';
import { config } from '../config/index.js';

export async function initializeDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongoDb, {
      autoIndex: true,
      autoCreate: true,
    });
    console.log('✅ Connected to MongoDB (players database)');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}
