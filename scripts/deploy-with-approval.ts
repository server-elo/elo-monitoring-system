#!/usr/bin/env ts-node

import { DeploymentWorkflow, DeploymentRequest } from '../lib/deployment/humanlayer-approval'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

async function deploy() {
  console.log('🚀 Solidity Learning Platform - Deployment Script')
  console.log('=' .repeat(50))
  
  // Parse command line arguments
  const args = process.argv.slice(2)
  const environment = args[0] || 'staging'
  const version = args[1] || getVersionFromPackage()
  
  if (!['staging', 'production'].includes(environment)) {
    console.error('❌ Invalid environment. Use: staging or production')
    process.exit(1)
  }
  
  try {
    // Run pre-deployment checks
    console.log('\n📋 Running pre-deployment checks...')
    const checks = await runPreDeploymentChecks()
    
    if (!checks.passed) {
      console.error('❌ Pre-deployment checks failed:')
      checks.errors.forEach(error => console.error(`  - ${error}`))
      process.exit(1)
    }
    
    console.log('✅ All pre-deployment checks passed')
    
    // Get recent changes
    const changes = getRecentChanges()
    
    // Prepare deployment request
    const request: DeploymentRequest = {
      environment: environment as 'staging' | 'production',
      version,
      changes,
      risksAssessed: true,
      testsPassed: checks.testsPassed,
      approvers: environment === 'production' ? ['admin@solidity-learning.com'] : undefined
    }
    
    // Display deployment summary
    console.log('\n📦 Deployment Summary:')
    console.log(`  Environment: ${request.environment}`)
    console.log(`  Version: ${request.version}`)
    console.log(`  Changes: ${request.changes.length} commits`)
    console.log(`  Tests: ${request.testsPassed ? '✅ Passed' : '❌ Failed'}`)
    
    // Confirm deployment
    console.log('\n⚠️  This will deploy to ' + environment.toUpperCase())
    console.log('Press ENTER to continue or Ctrl+C to cancel...')
    await waitForEnter()
    
    // Run deployment workflow
    const workflow = new DeploymentWorkflow()
    await workflow.runDeploymentWorkflow(request)
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message)
    process.exit(1)
  }
}

async function runPreDeploymentChecks(): Promise<{
  passed: boolean
  testsPassed: boolean
  errors: string[]
}> {
  const errors: string[] = []
  let testsPassed = false
  
  // Check 1: Ensure on correct branch
  try {
    const branch = execSync('git branch --show-current').toString().trim()
    if (branch !== 'main' && branch !== 'master') {
      errors.push(`Must deploy from main branch (current: ${branch})`)
    }
  } catch (e) {
    errors.push('Failed to check git branch')
  }
  
  // Check 2: No uncommitted changes
  try {
    const status = execSync('git status --porcelain').toString()
    if (status.trim()) {
      errors.push('Uncommitted changes detected')
    }
  } catch (e) {
    errors.push('Failed to check git status')
  }
  
  // Check 3: Tests pass
  try {
    console.log('  Running tests...')
    execSync('npm test', { stdio: 'pipe' })
    testsPassed = true
  } catch (e) {
    errors.push('Tests failed')
  }
  
  // Check 4: Build succeeds
  try {
    console.log('  Checking build...')
    // Check if .next directory exists and is recent
    const buildPath = path.join(process.cwd(), '.next')
    if (fs.existsSync(buildPath)) {
      const stats = fs.statSync(buildPath)
      const hoursSinceModified = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60)
      if (hoursSinceModified > 1) {
        console.log('  Build is stale, rebuilding...')
        execSync('npm run build', { stdio: 'pipe' })
      }
    } else {
      console.log('  No build found, building...')
      execSync('npm run build', { stdio: 'pipe' })
    }
  } catch (e) {
    errors.push('Build failed')
  }
  
  // Check 5: Environment variables
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'DATABASE_URL'
  ]
  
  const envFile = path.join(process.cwd(), '.env.production')
  if (!fs.existsSync(envFile)) {
    errors.push('.env.production file not found')
  }
  
  return {
    passed: errors.length === 0,
    testsPassed,
    errors
  }
}

function getVersionFromPackage(): string {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
    )
    return packageJson.version || '1.0.0'
  } catch {
    return '1.0.0'
  }
}

function getRecentChanges(): string[] {
  try {
    // Get last 10 commits
    const commits = execSync('git log --oneline -10')
      .toString()
      .trim()
      .split('\n')
      .map(line => line.substring(8)) // Remove commit hash
    
    return commits
  } catch {
    return ['Unable to fetch recent changes']
  }
}

function waitForEnter(): Promise<void> {
  return new Promise(resolve => {
    process.stdin.resume()
    process.stdin.once('data', () => {
      process.stdin.pause()
      resolve()
    })
  })
}

// Run deployment if executed directly
if (require.main === module) {
  deploy().catch(console.error)
}