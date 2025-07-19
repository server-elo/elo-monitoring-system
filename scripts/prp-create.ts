#!/usr/bin/env node

/**
 * Create a new PRP from command line
 * 
 * Usage:
 *   npm run prp:create "implement feature description"
 *   npm run prp:create "add push notifications" --deep-research --files "components/notifications"
 */

import { createPRP } from '../lib/prp';
import { parseArgs } from 'util';

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'deep-research': {
        type: 'boolean',
        default: true
      },
      'files': {
        type: 'string',
        multiple: true
      },
      'urls': {
        type: 'string',
        multiple: true
      },
      'context': {
        type: 'string'
      }
    },
    allowPositionals: true
  });

  if (positionals.length === 0) {
    console.error('Usage: npm run prp:create "feature description"');
    process.exit(1);
  }

  const feature = positionals.join(' ');
  
  console.log(`Creating PRP for: ${feature}`);
  
  try {
    const prpFile = await createPRP({
      feature,
      deepResearch: values['deep-research'] as boolean,
      filesToAnalyze: values.files as string[],
      urlsToResearch: values.urls as string[],
      additionalContext: values.context as string
    });
    
    console.log(`✅ PRP created successfully: ${prpFile}`);
    console.log(`\nTo execute: npm run prp:execute ${prpFile}`);
  } catch (error) {
    console.error('❌ Failed to create PRP:', error);
    process.exit(1);
  }
}

main().catch(console.error);