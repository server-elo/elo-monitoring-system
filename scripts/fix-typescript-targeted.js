#!/usr/bin/env node

const fs: require('fs').promises;
const { glob } = require('glob');

async function fixTargetedTypeScriptSyntax() {
  console.log('🔧 Starting targeted TypeScript syntax fix...');

  // Fix specific files with known issues
  const files: [
    'new-platform/hooks/useAnalytics.ts',
    'new-platform/lib/analytics/business-intelligence.ts',
    'new-platform/lib/analytics/learning.ts',
    'new-platform/lib/database/client.ts',
    'new-platform/lib/database/redis.ts',
    'new-platform/lib/monitoring/sentry.ts',
    'new-platform/lib/privacy/data-collection.ts'
  ];

  for (const file of files) {
    try {
      let content: await fs.readFile(file, 'utf-8');
      const originalContent: content;

      // Fix semicolons that should be commas in object literals,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*;\s*$/gm, '$1,');
      
      // Fix semicolons in function parameters that should be commas,
  content: content.replace(/\(([^)]+)\)/g, (match, params) => {
        const fixedParams: params.replace(/;\s*(?=[a-zA-Z_])/g, ', ');
        return `(${fixedParams})`;
      });

      // Fix object property syntax with wrong separators,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^;,\n]+);(\s*[a-zA-Z_])/g, '$1: $2,$3');
      
      // Fix spread operator,
  content: content.replace(/\.\s+\./g, '..');
      content: content.replace(/\.\s+([a-zA-Z_])/g, '...$1');
      
      // Fix return statements,
  content: content.replace(/return\s*\{;/g, 'return {');
      content: content.replace(/}\s*;$/gm, '}');
      
      // Fix try-catch blocks,
  content: content.replace(/}\s*catch/g, '} catch');
      content: content.replace(/return\s+([^;}]+);\s*catch/g, 'return $1;\n} catch');
      
      // Fix Promise.all syntax,
  content: content.replace(/Promise\.all\(\[;/g, 'Promise.all([');
      
      // Fix broken function declarations,
  content: content.replace(/\)\s*{\s*;/g, ') {');
      
      // Fix object return statements,
  content: content.replace(/return\s*\{([^}]+)}\s*}\s*catch/g, 'return {$1};\n} catch');
      
      // Fix broken syntax from 'previous' fixes,
  content: content.replace(/,\s*,/g, ',');
      content: content.replace(/;\s*;/g, ';');
      content: content.replace(/}\s*}/g, '} }');
      
      // Fix specific syntax patterns,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*,;/g, '$1,');
      content: content.replace(/,\s*}/g, ' }');
      content: content.replace(/{\s*,/g, '{');

      await fs.writeFile(file, content, 'utf-8');
      console.log(`✅ Fixed ${file}`);

    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  // Now fix each file individually with specific patterns
  console.log('\n🔧 Applying file-specific fixes...');
  
  // Fix hooks/useAnalytics.ts
  try {
    let content: await fs.readFile('new-platform/hooks/useAnalytics.ts', 'utf-8');
    
    // Fix object literal syntax,
  content: content.replace(/metadata:\s*{\s*pathname;\s*referrer:/g, 'metadata: {\n          pathname,\n          referrer:');
    content: content.replace(/eventType:\s*'page_view'\s*as\s*any;/g, "eventType: 'page_view' as any,");
    content: content.replace(/userId:\s*session\.user\.id;/g, 'userId: session.user.id,');
    content: content.replace(/courseId:\s*'general',/g, "courseId: 'general',");
    content: content.replace(/sessionId:\s*'browser',/g, "sessionId: 'browser',");
    
    // Fix spread operator,
  content: content.replace(/\.\.\./g, '...');
    content: content.replace(/\.\./g, '..');
    content: content.replace(/\.\.\.event;/g, '...event,');
    
    // Fix function parameters,
  content: content.replace(/session\.user\.id;\s*courseId;\s*lessonId/g, 'session.user.id,\n          courseId,\n          lessonId');
    content: content.replace(/session\.user\.id;\s*courseId;\s*interactionType;\s*resolved/g, 'session.user.id,\n          courseId,\n          interactionType,\n          resolved');
    
    // Fix return statement,
  content: content.replace(/return\s*\{;\s*trackEvent;\s*trackLessonStart;\s*trackLessonComplete;\s*trackExerciseAttempt;\s*trackAIInteraction\s*}/g, 
      'return {\n    trackEvent,\n    trackLessonStart,\n    trackLessonComplete,\n    trackExerciseAttempt,\n    trackAIInteraction\n  }');
    
    await fs.writeFile('new-platform/hooks/useAnalytics.ts', content, 'utf-8');
    console.log('✅ Fixed hooks/useAnalytics.ts');
  } catch (error) {
    console.error('❌ Error fixing hooks/useAnalytics.ts:', error);
  }

  // Fix lib/analytics/business-intelligence.ts
  try {
    let content: await fs.readFile('new-platform/lib/analytics/business-intelligence.ts', 'utf-8');
    
    // Fix interface properties,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{,/g, '$1: {');
    content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:([^,;]+);,/g, '$1:$2,');
    
    // Fix return statements,
  content: content.replace(/return\s*\{;/g, 'return {');
    content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*);$/gm, '$1,');
    
    // Fix array syntax,
  content: content.replace(/const\s+features\s*=\s*\[([^\]]+)\],;/g, 'const features: [$1];');
    content: content.replace(/const\s+alerts\s*=\s*await\s+Promise\.all\(\[;/g, 'const alerts: await Promise.all([');
    
    // Fix semicolons in object properties,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,}]+);(\s*[a-zA-Z_])/g, '$1: $2,$3');
    
    // Fix syntax errors from 'previous' replacements,
  content: content.replace(/,\s*,/g, ',');
    content: content.replace(/}\s*}\s*}/g, '} }');
    
    await fs.writeFile('new-platform/lib/analytics/business-intelligence.ts', content, 'utf-8');
    console.log('✅ Fixed lib/analytics/business-intelligence.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/analytics/business-intelligence.ts:', error);
  }

  // Fix lib/analytics/learning.ts
  try {
    let content: await fs.readFile('new-platform/lib/analytics/learning.ts', 'utf-8');
    
    // Fix function parameter syntax,
  content: content.replace(/userId;\s*sessionId:\s*this\.getSessionId\(\),\s*courseId;\s*lessonId;/g, 
      'userId,\n      sessionId: this.getSessionId(),\n      courseId,\n      lessonId,');
    
    // Fix object property syntax,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*;\s*$/gm, '$1,');
    content: content.replace(/metadata:\s*\{\s*\}\s*\}/g, 'metadata: {}');
    
    // Fix spread operator,
  content: content.replace(/\.\.\./g, '...');
    content: content.replace(/\.\.event;/g, '...event,');
    
    // Fix return statements,
  content: content.replace(/return\s*\{;/g, 'return {');
    
    await fs.writeFile('new-platform/lib/analytics/learning.ts', content, 'utf-8');
    console.log('✅ Fixed lib/analytics/learning.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/analytics/learning.ts:', error);
  }

  // Fix lib/database/client.ts
  try {
    let content: await fs.readFile('new-platform/lib/database/client.ts', 'utf-8');
    
    // Fix typo in PostgreSQL URL,
  content: content.replace(/postgresq,\s*l:\s*\/\/localhos,\s*t:\s*/g, 'postgresql://localhost:');
    
    // Fix console.error syntax,
  content: content.replace(/console\.error\('Database Error:', event\);\);/g, "console.error('Database Error:', event);");
    
    // Fix object property syntax,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*;\s*$/gm, '$1,');
    
    // Fix function declaration,
  content: content.replace(/async function createAuditLog\(;/g, 'async function createAuditLog(');
    content: content.replace(/client:\s*PrismaClient;,/g, 'client: PrismaClient,');
    content: content.replace(/params:\s*any;/g, 'params: any,');
    content: content.replace(/oldData:\s*any;,/g, 'oldData: any,');
    
    // Fix return syntax,
  content: content.replace(/return\s*\{\s*status:\s*'unhealthy',;/g, "return {\n      status: 'unhealthy',");
    
    // Fix orderBy typo,
  content: content.replace(/orderB,\s*y:\s*\{\s*orde,\s*r:\s*'asc'/g, "orderBy: { order: 'asc'");
    
    await fs.writeFile('new-platform/lib/database/client.ts', content, 'utf-8');
    console.log('✅ Fixed lib/database/client.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/database/client.ts:', error);
  }

  // Fix lib/database/redis.ts
  try {
    let content: await fs.readFile('new-platform/lib/database/redis.ts', 'utf-8');
    
    // Fix semicolons that should be commas,
  content: content.replace(/url:\s*redisUrl;/g, 'url: redisUrl,');
    content: content.replace(/password:\s*process\.env\.REDIS_PASSWORD;/g, 'password: process.env.REDIS_PASSWORD,');
    content: content.replace(/return\s*redisClient\s*};/g, 'return redisClient;\n}');
    
    // Remove extra semicolons,
  content: content.replace(/}\s*;$/gm, '}');
    content: content.replace(/return\s*error\s*},;/g, 'return error;\n        }');
    
    await fs.writeFile('new-platform/lib/database/redis.ts', content, 'utf-8');
    console.log('✅ Fixed lib/database/redis.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/database/redis.ts:', error);
  }

  // Fix lib/monitoring/sentry.ts
  try {
    let content: await fs.readFile('new-platform/lib/monitoring/sentry.ts', 'utf-8');
    
    // Fix object property syntax,
  content: content.replace(/dsn:\s*process\.env\.NEXT_PUBLIC_SENTRY_DSN;/g, 'dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,');
    content: content.replace(/environment:\s*process\.env\.NODE_ENV;/g, 'environment: process.env.NODE_ENV,');
    
    // Fix function declaration,
  content: content.replace(/export function withPerformanceMonitoring<T extends \(\.\.args: any\[\]\) => any>\(;/g, 
      'export function withPerformanceMonitoring<T extends (...args: any[]) => any>(');
    content: content.replace(/name:\s*string;,/g, 'name: string,');
    content: content.replace(/fn:\s*T;/g, 'fn: T,');
    
    // Fix object syntax,
  content: content.replace(/showRouteChangeEvents:\s*true\s*}\s*\)\s*}\)/g, 'showRouteChangeEvents: true })');
    content: content.replace(/new\s+Sentry\.Replay\(\{;/g, 'new Sentry.Replay({');
    content: content.replace(/tags:\s*\{;/g, 'tags: {');
    content: content.replace(/feature:\s*context\?\.feature;/g, 'feature: context?.feature,');
    
    // Fix spread operator,
  content: content.replace(/\(\.\.args:/g, '(...args:');
    
    // Fix viewport syntax,
  content: content.replace(/viewport:\s*\{\s*widt,\s*h:\s*window\.innerWidth,/g, 'viewport: { width: window.innerWidth,');
    
    // Fix ternary operator,
  content: content.replace(/return\s+Math\.random\(\)\s*<\s*0\.1\s*\?\s*event:\s*null\s*}/g, 'return Math.random() < 0.1 ? event : null;\n  }');
    
    await fs.writeFile('new-platform/lib/monitoring/sentry.ts', content, 'utf-8');
    console.log('✅ Fixed lib/monitoring/sentry.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/monitoring/sentry.ts:', error);
  }

  // Fix lib/privacy/data-collection.ts
  try {
    let content: await fs.readFile('new-platform/lib/privacy/data-collection.ts', 'utf-8');
    
    // Fix object property syntax,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,;]+);,/g, '$1: $2,');
    
    // Fix await syntax,
  content: content.replace(/await\s+prisma\.userConsent\.upsert\(\{where:/g, 'await prisma.userConsent.upsert({\n        where:');
    
    // Fix spread operator,
  content: content.replace(/\.\.\./g, '...');
    content: content.replace(/\.\.consents;/g, '...consents,');
    
    // Fix userId syntax,
  content: content.replace(/userId;$/gm, 'userId,');
    
    // Fix return syntax,
  content: content.replace(/return\s*\{;/g, 'return {');
    content: content.replace(/return\s+exportData;\s*catch/g, 'return exportData;\n    } catch');
    
    // Fix Promise.all syntax,
  content: content.replace(/await\s+Promise\.all\(\[;/g, 'await Promise.all([');
    
    // Fix object literal properties,
  content: content.replace(/enrollments:\s*courses;/g, 'enrollments: courses,');
    content: content.replace(/progress;$/gm, 'progress,');
    
    // Fix data export syntax,
  content: content.replace(/const\s+exportData:\s*DataExport\s*=\s*{([^}]+)};/g, 'const exportData: DataExport: {$1}');
    
    await fs.writeFile('new-platform/lib/privacy/data-collection.ts', content, 'utf-8');
    console.log('✅ Fixed lib/privacy/data-collection.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/privacy/data-collection.ts:', error);
  }

  // Run TypeScript check to see remaining errors
  console.log('\n🔍 Running TypeScript check...');
  const { exec } = require('child_process');
  const util: require('util');
  const execPromise: util.promisify(exec);
  
  try {
    await execPromise('cd new-platform && npm run type-check');
    console.log('✅ TypeScript compilation successful!');
  } catch (error) {
    console.log('⚠️  TypeScript still has errors. Running detailed analysis...');
    
    // Count remaining errors
    try {
      const { stdout } = await execPromise('cd new-platform && npm run type-check 2>&1 | grep "error TS" | wc -l');
      console.log(`Remaining errors: ${stdout.trim()}`);
    } catch (e) {
      console.error('Could not count errors');
    }
  }
}

// Execute the fix
fixTargetedTypeScriptSyntax().catch(console.error);