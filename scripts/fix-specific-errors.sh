#!/bin/bash

echo "🔧 Fixing specific TypeScript errors..."

# Fix common underscore patterns that were missed
find . -name "*.ts" -o -name "*.tsx" | while read file; do
  if [[ "$file" == *node_modules* ]] || [[ "$file" == *.next* ]]; then
    continue
  fi
  
  # Fix _rememberMe pattern
  sed -i 's/_rememberMe/rememberMe/g' "$file" 2>/dev/null || true
  
  # Fix _userAgent pattern
  sed -i 's/_userAgent/userAgent/g' "$file" 2>/dev/null || true
  
  # Fix crypto.randomUUID(_) pattern
  sed -i 's/crypto\.randomUUID(_)/crypto.randomUUID()/g' "$file" 2>/dev/null || true
  
  # Fix _startTime pattern
  sed -i 's/_startTime/startTime/g' "$file" 2>/dev/null || true
  
  # Fix .includes pattern with underscores
  sed -i 's/\.includes(_searchLower)/\.includes(searchLower)/g' "$file" 2>/dev/null || true
  
  # Fix conditional patterns with underscores
  sed -i 's/if (_published/if (published/g' "$file" 2>/dev/null || true
  sed -i 's/if (_difficulty/if (difficulty/g' "$file" 2>/dev/null || true
  sed -i 's/if (_status/if (status/g' "$file" 2>/dev/null || true
  sed -i 's/if (_verified/if (verified/g' "$file" 2>/dev/null || true
  sed -i 's/if (_service/if (service/g' "$file" 2>/dev/null || true
  sed -i 's/if (_preferredTimes/if (preferredTimes/g' "$file" 2>/dev/null || true
  sed -i 's/if (_historicalActivity/if (historicalActivity/g' "$file" 2>/dev/null || true
  
  # Fix _new pattern
  sed -i 's/_new Date/new Date/g' "$file" 2>/dev/null || true
  
  # Fix clearEvents pattern
  sed -i 's/errorTracker\.clearEvents(_)/errorTracker.clearEvents()/g' "$file" 2>/dev/null || true
  
  # Fix getRateLimitStats pattern
  sed -i 's/getRateLimitStats(_)/getRateLimitStats()/g' "$file" 2>/dev/null || true
  sed -i 's/sessionSecurity\.getSessionStats(_)/sessionSecurity.getSessionStats()/g' "$file" 2>/dev/null || true
  
  # Fix process.cpuUsage pattern
  sed -i 's/process\.cpuUsage(_)/process.cpuUsage()/g' "$file" 2>/dev/null || true
  
  # Fix checkPageExists pattern
  sed -i 's/checkPageExists(_path/checkPageExists(path/g' "$file" 2>/dev/null || true
  sed -i 's/\(return existingPages.includes\)(path)/\1(path)/g' "$file" 2>/dev/null || true
  
  # Fix getTime pattern
  sed -i 's/now\.getTime(_)/now.getTime()/g' "$file" 2>/dev/null || true
  sed -i 's/timestamp\.getTime(_)/timestamp.getTime()/g' "$file" 2>/dev/null || true
  
  # Fix AbortSignal.timeout pattern
  sed -i 's/AbortSignal\.timeout(_/AbortSignal.timeout(/g' "$file" 2>/dev/null || true
  
  # Fix determinePriority pattern
  sed -i 's/determinePriority(_sanitizedFeedback)/determinePriority(sanitizedFeedback)/g' "$file" 2>/dev/null || true
  
  # Fix mock function parameters
  sed -i 's/getPaginatedContracts(_userId/getPaginatedContracts(userId/g' "$file" 2>/dev/null || true
  sed -i 's/generateMockContracts(_userId/generateMockContracts(userId/g' "$file" 2>/dev/null || true
  
  # Fix HealthChecker instantiation
  sed -i 's/new HealthChecker(_)/new HealthChecker()/g' "$file" 2>/dev/null || true
  
  # Fix disconnnect pattern
  sed -i 's/\$disconnect(_)/\$disconnect()/g' "$file" 2>/dev/null || true
  
  # Fix _e pattern in catch blocks
  sed -i 's/} catch (_e) {/} catch (e) {/g' "$file" 2>/dev/null || true
  
  # Fix logger.info patterns with underscore
  sed -i 's/logger\.warn( /logger.warn(/g' "$file" 2>/dev/null || true
  
  # Fix .toString pattern
  sed -i 's/\.toString(_)/\.toString()/g' "$file" 2>/dev/null || true
  
  # Fix validation patterns
  sed -i 's/_tag => tag\.toLowerCase/tag => tag.toLowerCase/g' "$file" 2>/dev/null || true
  
  # Fix updateUATSession pattern
  sed -i 's/updateUATSession(_feedback)/updateUATSession(feedback)/g' "$file" 2>/dev/null || true
  
  # Fix checkDatabase pattern
  sed -i 's/checkDatabase(_)/checkDatabase()/g' "$file" 2>/dev/null || true
  sed -i 's/checkRedis(_)/checkRedis()/g' "$file" 2>/dev/null || true
  sed -i 's/checkAI(_)/checkAI()/g' "$file" 2>/dev/null || true
  sed -i 's/checkMonitoring(_)/checkMonitoring()/g' "$file" 2>/dev/null || true
  sed -i 's/checkSecurity(_)/checkSecurity()/g' "$file" 2>/dev/null || true
  sed -i 's/checkPerformance(_)/checkPerformance()/g' "$file" 2>/dev/null || true
  sed -i 's/collectMetrics(_)/collectMetrics()/g' "$file" 2>/dev/null || true
  
  # Fix logger.getStats pattern
  sed -i 's/logger\.getStats(_)/logger.getStats()/g' "$file" 2>/dev/null || true
  sed -i 's/analytics\.getStats(_)/analytics.getStats()/g' "$file" 2>/dev/null || true
  
  # Fix calculateOverallStatus pattern
  sed -i 's/calculateOverallStatus(_checks)/calculateOverallStatus(checks)/g' "$file" 2>/dev/null || true
  
  # Fix getResultValue pattern
  sed -i 's/getResultValue(_\([a-zA-Z]*\))/getResultValue(\1)/g' "$file" 2>/dev/null || true
  
  # Fix testNavigationLinks pattern
  sed -i 's/testNavigationLinks(_)/testNavigationLinks()/g' "$file" 2>/dev/null || true
  
  # Fix testComponentIntegration pattern
  sed -i 's/testComponentIntegration(_pages/testComponentIntegration(pages/g' "$file" 2>/dev/null || true
  
  # Fix _let pattern
  sed -i 's/_let i/let i/g' "$file" 2>/dev/null || true
  
  # Fix _async pattern inside function calls
  sed -i 's/servers\.map( async/servers.map(async/g' "$file" 2>/dev/null || true
  
  # Fix _userId pattern in conditionals
  sed -i 's/if (_userId/if (userId/g' "$file" 2>/dev/null || true
  
  # Fix _duration pattern
  sed -i 's/duration: _duration/duration: duration/g' "$file" 2>/dev/null || true
done

echo "✅ Specific error fixes completed!"