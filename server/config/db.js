import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  const conn = await mongoose.connect(uri, { bufferCommands: false });
  isConnected = true;
  console.log(`MongoDB connected: ${conn.connection.host}`);
}
