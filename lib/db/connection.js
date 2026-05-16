// Re-export from the canonical connection module so existing imports keep working.
export { connectDB as default, connectDB, disconnectDB, getConnectionStatus, healthCheck } from '@/lib/mongodb';
