#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Final analytics.ts fix...');

const filePath = 'lib/monitoring/analytics.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix all remaining issues
const fixes = [
  // Fix !== comparisons that were broken
  { from: /if \(typeof window ! === 'undefined'\)/g, to: "if (typeof window !== 'undefined')" },
  { from: /if \(typeof window = 'undefined'/g, to: "if (typeof window === 'undefined'" },
  { from: /if \(entry\.entryType === 'navigation'/g, to: "if (entry.entryType === 'navigation'" },
  { from: /type: analytics\.action === 'complete'/g, to: "type: analytics.action === 'complete'" },
  { from: /if \(action === 'page_view'/g, to: "if (action === 'page_view'" },
  { from: /if \(this\.events\.length === 0/g, to: "if (this.events.length === 0" },
  
  // Fix reduce function parameters
  { from: /\.reduce\(acc, event\)/g, to: ".reduce((acc, event)" },
  { from: /\.reduce\(acc, metric\)/g, to: ".reduce((acc, metric)" },
  { from: /\.reduce\(acc, \[metric, data\]\)/g, to: ".reduce((acc, [metric, data])" },
  { from: /\.reduce\(sum: number, session\)/g, to: ".reduce((sum: number, session)" },
  
  // Fix map parameters
  { from: /\.map\(\[name, count\]\)/g, to: ".map(([name, count])" },
  
  // Fix indentation for fields
  { from: /^(\s*)name: string;$/gm, to: "$1  name: string;" },
  { from: /^(\s*)userId: string;$/gm, to: "$1  userId: string;" },
  { from: /^(\s*)sessionId: string;$/gm, to: "$1  sessionId: string;" },
  { from: /^(\s*)timestamp: number;$/gm, to: "$1  timestamp: number;" },
  { from: /^(\s*)action: /gm, to: "$1  action: " },
  { from: /^(\s*)progress: number;$/gm, to: "$1  progress: number;" },
  { from: /^(\s*)timeSpent: number;$/gm, to: "$1  timeSpent: number;" },
  { from: /^(\s*)participants: number;$/gm, to: "$1  participants: number;" },
  { from: /^(\s*)metric: /gm, to: "$1  metric: " },
  { from: /^(\s*)value: number;$/gm, to: "$1  value: number;" },
  { from: /^(\s*)success: boolean;$/gm, to: "$1  success: boolean;" },
  { from: /^(\s*)sessionDuration: number;$/gm, to: "$1  sessionDuration: number;" },
  { from: /^(\s*)pageViews: number;$/gm, to: "$1  pageViews: number;" },
  { from: /^(\s*)interactions: number;$/gm, to: "$1  interactions: number;" },
  { from: /^(\s*)features: string\[\];$/gm, to: "$1  features: string[];" },
  
  // Fix timestamp fields properly
  { from: /(\s+)timestamp: Date\.now\(\),?$/gm, to: "$1timestamp: Date.now()," },
  { from: /(\s+)timestamp: Date\.now\(\)\s*\n(\s*)\};/g, to: "$1timestamp: Date.now()\n$2};" },
  
  // Fix closing brace
  { from: /}\s*}\s*\);\s*}\s*$/gm, to: "      }\n    });\n  }" }
];

fixes.forEach(fix => {
  content = content.replace(fix.from, fix.to);
});

// Fix interface indentation
content = content.replace(/interface (\w+) \{([^}]+)\}/gs, (match, name, body) => {
  const lines = body.trim().split('\n');
  const fixedLines = lines.map(line => {
    if (line.trim() && !line.trim().startsWith('//')) {
      return '  ' + line.trim();
    }
    return line;
  });
  return `interface ${name} {\n${fixedLines.join('\n')}\n}`;
});

fs.writeFileSync(filePath, content);
console.log('✅ Fixed analytics.ts');