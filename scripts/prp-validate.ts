#!/usr/bin/env node

/**
 * Run validation commands from command line
 * 
 * Usage:
 *   npm run prp:validate                    # Run common validations
 *   npm run prp:validate --commands "npm test" "npm run lint"
 */

import { runProjectValidation, PRPValidator } from '../lib/prp';
import { parseArgs } from 'util';

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'commands': {
        type: 'string',
        multiple: true
      },
      'continue-on-failure': {
        type: 'boolean',
        default: false
      }
    },
    allowPositionals: true
  });

  const validator = new PRPValidator();
  
  try {
    if (values.commands && (values.commands as string[]).length > 0) {
      // Run specific commands
      console.log('Running custom validation commands...\n');
      
      const results = await validator.runValidationCommands(values.commands as string[]);
      
      for (const result of results) {
        console.log(`${result.passed ? '✅' : '❌'} ${result.command}`);
        if (!result.passed && result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
      
      const allPassed = results.every(r => r.passed);
      
      if (allPassed) {
        console.log('\n✅ All validations passed!');
      } else {
        console.log('\n❌ Some validations failed');
        process.exit(1);
      }
    } else {
      // Run common project validations
      console.log('Running common project validations...\n');
      
      const summary = await runProjectValidation();
      
      console.log(validator.formatResults(summary));
      
      if (!summary.overallSuccess) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Validation error:', error);
    process.exit(1);
  }
}

main().catch(console.error);