export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: 'production',
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  security: {
    bcryptSaltRounds: 12
  },
  logging: {
    level: 'info',
    format: 'json'
  }
} 