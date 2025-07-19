#!/usr/bin/env node

/**
 * 12-Factor Agent Script: Batch Console.log Cleanup
 * Following Factor 10: Small, Focused Tasks
 * Following Factor 12: Stateless Operations
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

const API_DIR = '/home/elo/learning_solidity/learning_sol/app/api';

interface FileUpdate {
  path: string;
  content: string;
  changes: number;
}

function processFile(filePath: string): FileUpdate | null {
  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let changes = 0;

  // Check if logger import exists
  const hasLoggerImport = content.includes("from '@/lib/monitoring/simple-logger'");
  
  // Add logger import if needed and file has console statements
  if (!hasLoggerImport && content.includes('console.')) {
    // Find the last import statement
    const importMatches = content.match(/^import.*$/gm);
    if (importMatches) {
      const lastImport = importMatches[importMatches.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      content = content.slice(0, insertPosition) + 
        "\nimport { logger } from '@/lib/monitoring/simple-logger';" + 
        content.slice(insertPosition);
      changes++;
    }
  }

  // Replace console.error
  content = content.replace(
    /console\.error\('([^']+)',\s*(.+?)\);/g,
    (match, message, error) => {
      changes++;
      return `logger.error('${message}', { error: ${error} });`;
    }
  );

  // Replace console.error with single argument
  content = content.replace(
    /console\.error\((.+?)\);/g,
    (match, error) => {
      changes++;
      return `logger.error('Error occurred', { error: ${error} });`;
    }
  );

  // Replace console.log
  content = content.replace(
    /console\.log\(`([^`]+)`\);/g,
    (match, message) => {
      changes++;
      return `logger.info('${message}');`;
    }
  );

  content = content.replace(
    /console\.log\('([^']+)',\s*(.+?)\);/g,
    (match, message, data) => {
      changes++;
      return `logger.info('${message}', { data: ${data} });`;
    }
  );

  content = content.replace(
    /console\.log\((.+?)\);/g,
    (match, message) => {
      changes++;
      return `logger.info(${message});`;
    }
  );

  // Replace console.warn
  content = content.replace(
    /console\.warn\('([^']+)',\s*(.+?)\);/g,
    (match, message, data) => {
      changes++;
      return `logger.warn('${message}', { data: ${data} });`;
    }
  );

  // Return update if changes were made
  if (content !== originalContent) {
    return { path: filePath, content, changes };
  }
  
  return null;
}

async function main() {
  console.log('🔧 Starting batch console.log cleanup...');
  
  const files = glob.sync(`${API_DIR}/**/*.ts`);
  const updates: FileUpdate[] = [];
  
  for (const file of files) {
    const update = processFile(file);
    if (update) {
      updates.push(update);
      writeFileSync(update.path, update.content, 'utf-8');
      console.log(`✅ Fixed ${path.basename(update.path)} (${update.changes} changes)`);
    }
  }
  
  console.log(`\n✨ Cleanup complete!`);
  console.log(`📊 Fixed ${updates.length} files`);
  console.log(`🔄 Total changes: ${updates.reduce((sum, u) => sum + u.changes, 0)}`);
}

main().catch(console.error);