export const config = {
  app: {
    name: 'Solidity Learning Platform',
    version: '2.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  features: {
    aiTutoring: process.env.FEATURE_AI_TUTORING === 'true',
    collaboration: process.env.FEATURE_COLLABORATION === 'true',
    blockchain: process.env.FEATURE_BLOCKCHAIN_INTEGRATION === 'true',
  },
} as const;

export default config;
