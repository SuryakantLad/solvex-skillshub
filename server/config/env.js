export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/talentgraph',
  jwtSecret: process.env.JWT_SECRET || 'fallback-dev-secret-change-me-32chars!!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
};
