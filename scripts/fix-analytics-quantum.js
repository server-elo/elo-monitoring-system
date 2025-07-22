#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Fixing analytics.ts syntax errors...');

const filePath = 'lib/monitoring/analytics.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix interface property syntax (= to :)
content = content.replace(/^(\s*)(name|timestamp|userId|action|progress|timeSpent|sessionId|participants|metric|value|success|sessionDuration|pageViews|interactions|features)\s*=\s*(.+);;$/gm, '$1$2: $3;');

// Fix double semicolons
content = content.replace(/;;/g, ';');

// Fix private field syntax
content = content.replace(/^(\s*private initialized) = false;;$/m, '$1 = false;');

// Fix console.error commas
content = content.replace(/console\.error\('❌ Failed to initialize Google, Analytics:'/g, "console.error('❌ Failed to initialize Google Analytics:'");
content = content.replace(/console\.error\('❌ Failed to initialize, PostHog:'/g, "console.error('❌ Failed to initialize PostHog:'");
content = content.replace(/console\.error\('❌ Failed to initialize, Mixpanel:'/g, "console.error('❌ Failed to initialize Mixpanel:'");

// Fix comparison operators
content = content.replace(/if \(entry\.entryType == 'navigation'\)/g, "if (entry.entryType === 'navigation')");
content = content.replace(/if \(this\.events\.length == 0\)/g, "if (this.events.length === 0)");
content = content.replace(/if \(typeof window === 'undefined'\)/g, "if (typeof window === 'undefined')");

// Fix observer.observe spacing
content = content.replace(/observer\.observe\(\s*{\s*entryTypes/g, "observer.observe({ entryTypes");

// Fix value assignment in object
content = content.replace(/value = Math\.random\(\) \* 2500 \+ 1000,/g, "value: Math.random() * 2500 + 1000,");

// Fix function parameter spacing
content = content.replace(/this\.(sendToGA|sendToPostHog|sendToMixpanel|trackUserEngagement)\(\s*([^,]+),/g, "this.$1($2,");

// Fix logger.info call
content = content.replace(/logger\.info\(`Analytics event: \${name}`, { metadata: {\s*userId,\s*metadata: properties\s*}\);\s*}\}\);/g, `logger.info(\`Analytics event: \${name}\`, {
      userId,
      metadata: properties
    });
  }`);

// Fix type comparison operator
content = content.replace(/type: analytics\.action == 'complete'/g, "type: analytics.action === 'complete'");

// Fix engagement assignment
content = content.replace(/engagement\s*===\s*{/g, "engagement = {");

// Fix sessionDuration assignment
content = content.replace(/engagement\.sessionDuration\s*===\s*Date\.now\(\)/g, "engagement.sessionDuration = Date.now()");

// Fix sessionId assignment
content = content.replace(/sessionId\s*===\s*crypto\.randomUUID\(\)/g, "sessionId = crypto.randomUUID()");

// Fix closing brace and parenthesis
content = content.replace(/}\)\);\s*}\}\);/g, `    });
  }`);

// Fix getStats return type
content = content.replace(/pendingEvents\s*===\s*number;;\s*learningEvents = number;;\s*collaborationEvents = number;;\s*performanceMetrics = number;;\s*activeSessions = number;;/g, `    pendingEvents: number;
    learningEvents: number;
    collaborationEvents: number;
    performanceMetrics: number;
    activeSessions: number;`);

// Fix map spacing
content = content.replace(/\.map\(\s*\(/g, ".map(");

// Fix metric assignment
content = content.replace(/acc\[metric\.metric\]\s*===\s*{/g, "acc[metric.metric] = {");

// Fix console.log spacing
content = content.replace(/console\.log\('(PostHog|Mixpanel), event:'/g, "console.log('$1 event:'");

// Fix trackEvent, trackPageView, trackUserAction functions
content = content.replace(/(trackEvent|trackPageView|trackUserAction|trackUserEngagement|sendToGA|sendToPostHog|sendToMixpanel)\(\s*([^:]+):\s*string/g, "$1($2: string");

// Fix timestamp: Date.now() without comma
content = content.replace(/(\s+)timestamp: Date\.now\(\)\s*$/gm, "$1timestamp: Date.now()");

// Fix summary object closing
content = content.replace(/summary: {\s*totalEvents[^}]+}\s*},/g, `summary: { 
        totalEvents: this.events.length,
        learningEvents: this.learningEvents.length,
        collaborationEvents: this.collaborationEvents.length,
        performanceMetrics: this.performanceMetrics.length
      },`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed analytics.ts syntax errors');