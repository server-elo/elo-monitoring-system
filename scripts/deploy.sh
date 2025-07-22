#!/bin/bash

# Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
BACKUP_BEFORE_DEPLOY=${BACKUP_BEFORE_DEPLOY:-true}
RUN_MIGRATIONS=${RUN_MIGRATIONS:-true}
BUILD_IMAGES=${BUILD_IMAGES:-true}

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
pre_deploy_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed"
        exit 1
    fi
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found"
        log_info "Run: node scripts/setup-production-env.js"
        exit 1
    fi
    
    # Validate environment variables
    log_info "Validating environment variables..."
    npm run env:validate || {
        log_error "Environment validation failed"
        exit 1
    }
    
    log_info "Pre-deployment checks passed ✓"
}

# Backup database
backup_database() {
    if [ "$BACKUP_BEFORE_DEPLOY" = true ]; then
        log_info "Creating database backup..."
        
        # Create backup directory
        mkdir -p backups
        
        # Generate backup filename
        BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
        
        # Run backup
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres solidity_learning_prod > "$BACKUP_FILE" || {
            log_warn "Database backup failed, but continuing deployment"
        }
        
        if [ -f "$BACKUP_FILE" ]; then
            log_info "Database backup created: $BACKUP_FILE"
            
            # Keep only last 5 backups
            ls -t backups/backup_*.sql | tail -n +6 | xargs -r rm
        fi
    fi
}

# Build application
build_application() {
    log_info "Building application..."
    
    # Run linting
    log_info "Running linter..."
    npm run lint || {
        log_error "Linting failed"
        exit 1
    }
    
    # Run type checking
    log_info "Running type check..."
    npm run type-check || {
        log_warn "Type checking failed - continuing with warnings"
    }
    
    # Build Next.js application
    log_info "Building Next.js application..."
    npm run build || {
        log_error "Build failed"
        exit 1
    }
    
    log_info "Application build completed ✓"
}

# Build Docker images
build_docker_images() {
    if [ "$BUILD_IMAGES" = true ]; then
        log_info "Building Docker images..."
        
        # Build with docker-compose
        docker-compose -f docker-compose.prod.yml build --no-cache || {
            log_error "Docker build failed"
            exit 1
        }
        
        log_info "Docker images built ✓"
    fi
}

# Run database migrations
run_migrations() {
    if [ "$RUN_MIGRATIONS" = true ]; then
        log_info "Running database migrations..."
        
        # Start only database service
        docker-compose -f docker-compose.prod.yml up -d postgres
        
        # Wait for database to be ready
        sleep 10
        
        # Run migrations
        DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npm run db:migrate:deploy || {
            log_error "Database migrations failed"
            exit 1
        }
        
        log_info "Database migrations completed ✓"
    fi
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down
    
    # Start new containers
    log_info "Starting new containers..."
    docker-compose -f docker-compose.prod.yml up -d || {
        log_error "Failed to start containers"
        exit 1
    }
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_info "Application is healthy ✓"
    else
        log_error "Health check failed"
        docker-compose -f docker-compose.prod.yml logs app
        exit 1
    fi
}

# Post-deployment tasks
post_deployment() {
    log_info "Running post-deployment tasks..."
    
    # Clear caches
    docker-compose -f docker-compose.prod.yml exec -T redis redis-cli FLUSHALL || {
        log_warn "Failed to clear Redis cache"
    }
    
    # Warm up caches
    curl -s http://localhost/api/health/detailed > /dev/null
    
    # Create deployment record
    echo "$(date): Deployment completed - Version $(git rev-parse --short HEAD)" >> deployments.log
    
    log_info "Post-deployment tasks completed ✓"
}

# Main deployment flow
main() {
    log_info "Starting deployment to $DEPLOY_ENV environment"
    log_info "Deployment started at $(date)"
    
    # Run deployment steps
    pre_deploy_checks
    backup_database
    build_application
    build_docker_images
    run_migrations
    deploy_application
    post_deployment
    
    log_info "🎉 Deployment completed successfully!"
    log_info "Deployment finished at $(date)"
    
    # Show container status
    log_info "Container status:"
    docker-compose -f docker-compose.prod.yml ps
}

# Run main function
main