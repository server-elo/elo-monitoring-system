#!/bin/bash
set -e

echo "🚨 EMERGENCY CORE REBUILD: Creating clean core files"
echo "===================================================="

# Create backup for corrupted core files
BACKUP_DIR=".backups/core-rebuild-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Backing up corrupted core files..."

# List of corrupted core files to backup and recreate
CORRUPTED_FILES=(
    "constants.ts"
    "types.ts"
    "types/collaboration.ts"
    "prisma/seed.ts"
    "sentry.server.config.ts"
    "src/config.ts"
)

# Move corrupted files to backup
for file in "${CORRUPTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  → Backing up $file"
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        mv "$file" "$BACKUP_DIR/$file" 2>/dev/null || true
    fi
done

echo "🔧 Creating clean core files..."

# Create clean constants.ts
cat > constants.ts << 'EOF'
export const APP_NAME = 'Solidity Learning Platform';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = 'Master Smart Contract Development';

export const NAVIGATION_ITEMS = [
  { name: 'Home', href: '/', icon: 'home' },
  { name: 'Learn', href: '/learn', icon: 'book' },
  { name: 'Code Lab', href: '/code', icon: 'code' },
  { name: 'Collaborate', href: '/collaborate', icon: 'users' },
  { name: 'Achievements', href: '/achievements', icon: 'trophy' },
  { name: 'Jobs', href: '/jobs', icon: 'briefcase' },
  { name: 'Certificates', href: '/certificates', icon: 'award' },
];

export const DEFAULT_LESSON = {
  id: 'intro-solidity',
  title: 'Introduction to Solidity',
  content: 'Welcome to Solidity development!',
  difficulty: 'Beginner' as const,
  estimatedTime: 30,
};

export const DEFAULT_COURSE = {
  id: 'solidity-basics',
  title: 'Solidity Basics',
  description: 'Learn the fundamentals of Solidity programming',
  icon: '📚',
  lessons: [DEFAULT_LESSON],
  progress: 0,
};
EOF

# Create clean types.ts
cat > types.ts << 'EOF'
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  xp: number;
  level: number;
  achievements: string[];
  completedLessons: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: number;
  lessons: Lesson[];
  progress: number;
  isLocked?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: number;
  codeExample?: string;
  quiz?: Quiz;
  isCompleted?: boolean;
}

export interface Quiz {
  id: string;
  questions: Question[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface Certificate {
  id: string;
  title: string;
  description: string;
  issueDate: Date;
  blockchainHash?: string;
  downloadUrl?: string;
}
EOF

# Create clean collaboration types
mkdir -p types
cat > types/collaboration.ts << 'EOF'
export interface CollaborationSession {
  id: string;
  name: string;
  participants: Participant[];
  createdAt: Date;
  isActive: boolean;
  maxParticipants: number;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
  isOnline: boolean;
  cursor?: {
    x: number;
    y: number;
    color: string;
  };
}

export interface CollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  type: 'chat' | 'system';
  timestamp: Date;
}

export interface CodeChange {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  position: {
    line: number;
    column: number;
  };
  timestamp: Date;
}
EOF

# Create clean Prisma seed
mkdir -p prisma
cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample user
  const sampleUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      xp: 0,
      level: 1,
      achievements: [],
      completedLessons: [],
    },
  });

  console.log('✅ Database seeded successfully');
  console.log(`📊 Created user: ${sampleUser.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
EOF

# Create clean Sentry config
cat > sentry.server.config.ts << 'EOF'
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  debug: false,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV || 'development',
});
EOF

# Create clean src/config.ts
mkdir -p src
cat > src/config.ts << 'EOF'
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
EOF

echo "✅ Clean core files created successfully!"
echo "🔄 Running TypeScript check..."

npm run type-check 2>&1 | head -20 || echo "⚠️  Some errors may remain - continuing cleanup..."