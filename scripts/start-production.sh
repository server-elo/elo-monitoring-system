#!/bin/bash

# Production startup script
# Implements 12-factor principles V (Build, release, run) and IX (Disposability)

set -e

echo "Starting production application..."

# Load environment variables
if [ -f .env.production ]; then
  export $(cat .env.production | grep -v '^#' | xargs)
fi

# Run database migrations (12-factor principle XII: Admin processes)
echo "Running database migrations..."
npm run db:migrate

# Verify database connection
echo "Verifying database connection..."
npx prisma db execute --stdin <<< "SELECT 1;"

# Build application if needed
if [ ! -d ".next" ]; then
  echo "Building application..."
  npm run build
fi

# Start the application with proper signal handling
echo "Starting application server..."
exec npm run start:production