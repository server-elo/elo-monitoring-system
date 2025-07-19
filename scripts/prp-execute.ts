#!/usr/bin/env node

/**
 * Execute a PRP from command line
 * 
 * Usage:
 *   npm run prp:execute swipe-navigation-lessons.md
 *   npm run prp:execute feature.md --continue-on-failure
 */

import { executePRP } from '../lib/prp';
import { parseArgs } from 'util';

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'continue-on-failure': {
        type: 'boolean',
        default: false
      },
      'skip-gates': {
        type: 'string',
        multiple: true
      },
      'interactive': {
        type: 'boolean',
        default: false
      }
    },
    allowPositionals: true
  });

  if (positionals.length === 0) {
    console.error('Usage: npm run prp:execute <prp-file.md>');
    process.exit(1);
  }

  const prpFile = positionals[0];
  
  console.log(`Executing PRP: ${prpFile}`);
  
  try {
    const result = await executePRP(prpFile, {
      continueOnFailure: values['continue-on-failure'] as boolean,
      skipGates: (values['skip-gates'] as string[])?.map(Number),
      interactive: values.interactive as boolean
    });
    
    console.log('\n=== Execution Summary ===');
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${result.metadata.duration}ms`);
    console.log(`Files changed: ${result.filesChanged.length}`);
    
    if (result.validationResults.length > 0) {
      console.log('\n=== Validation Results ===');
      for (const validation of result.validationResults) {
        console.log(`${validation.passed ? '✅' : '❌'} ${validation.gate}`);
      }
    }
    
    if (result.status === 'success') {
      console.log('\n✅ PRP executed successfully!');
    } else {
      console.log('\n❌ PRP execution failed');
      if (result.metadata.errors.length > 0) {
        console.log('\nErrors:');
        result.metadata.errors.forEach(err => console.log(`  - ${err}`));
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to execute PRP:', error);
    process.exit(1);
  }
}

main().catch(console.error);