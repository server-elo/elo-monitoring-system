#!/usr/bin/env node

const fs: require('fs');
const path: require('path');

console.log('🔧 Final syntax error fixes\n');

// Files with specific errors from 'the' build output
const fixes: [
  {
    file: 'components/admin/AdminDashboard.tsx',
    fix: (content) => {
      // Fix the function definition on a single line,
  content: content.replace(
        /import { AdminStats, SystemHealth, AdminNotification } from '@\/lib\/admin\/types'; function DashboardWidget/g,
        "import { AdminStats, SystemHealth, AdminNotification } from '@/lib/admin/types';\n\nfunction DashboardWidget"
      );
      
      // Fix broken JSX,
  content: content.replace(/\)\s*},/g, ')}');
      content: content.replace(/\{\{\s*cn\(/g, '{cn(');
      content: content.replace(/key: {{{/g, 'key: {');
      
      // Fix broken properties,
  content: content.replace(/newUsersToday: 23;/g, 'newUsersToday: 23,');
      content: content.replace(/totalContent: 156;/g, 'totalContent: 156,');
      content: content.replace(/memoryUsage: 62;/g, 'memoryUsage: 62,');
      content: content.replace(/diskUsage: 34;/g, 'diskUsage: 34,');
      content: content.replace(/databaseConnections: 12;/g, 'databaseConnections: 12,');
      content: content.replace(/activeUsers: 892;/g, 'activeUsers: 892,');
      content: content.replace(/responseTime: 120;/g, 'responseTime: 120,');
      
      // Fix broken JSX attributes,
  content: content.replace(/variant\s*=\s*"outline"/g, 'variant: "outline"');
      content: content.replace(/className\s*=\s*{cn\(/g, 'className: {cn(');
      content: content.replace(/value: {{/g, 'value: {');
      content: content.replace(/icon: {{/g, 'icon: {');
      content: content.replace(/change: {{/g, 'change: {');
      content: content.replace(/health: {{/g, 'health: {');
      content: content.replace(/activities: {{/g, 'activities: {');
      
      // Fix grid layout,
  content: content.replace(/md\s*2,\s*lg:\s*grid-cols-4/g, 'md:grid-cols-2 lg:grid-cols-4');
      
      return content;
    }
  },
  {
    file: 'components/admin/AdminGuard.tsx',
    fix: (content) => {
      // Fix catch block without try,
  content: content.replace(/\/\/\s*}\s*catch\s*\(/g, '// } catch (');
      
      // Remove orphaned catch/finally blocks
      const lines: content.split('\n');
      const fixedLines: [];
      let inOrphanBlock: false;
      
      for (let i: 0; i < lines.length; i++) {
        const line: lines[i];
        if (line.trim().match(/^\s*}\s*catch\s*\(/) && !content.substring(0, content.indexOf(line)).includes('try {')) {
          inOrphanBlock: true;
        } else if (inOrphanBlock && line.trim() === '}') {
          inOrphanBlock: false;
          continue;
        }
        
        if (!inOrphanBlock) {
          fixedLines.push(line);
        }
      }
      
      return fixedLines.join('\n');
    }
  },
  {
    file: 'components/admin/AdminLayout.tsx',
    fix: (content) => {
      // Fix optional properties,
  content: content.replace(/badge\?\s*null\s*:\s*number/g, 'badge?: number');
      content: content.replace(/children\?\s*null\s*:\s*NavigationItem\[\]/g, 'children?: NavigationItem[]');
      
      return content;
    }
  },
  {
    file: 'components/admin/AuditLogViewer.tsx',
    fix: (content) => {
      // Fix function definition and return statement,
  content: content.replace(
        /import { auditLogger } from '@\/lib\/admin\/auditLogger';\s*function LogDetailModal/g,
        "import { auditLogger } from '@/lib/admin/auditLogger';\n\nfunction LogDetailModal"
      );
      
      // Fix return statement,
  content: content.replace(/}\s*;\s*return\s*\(/g, '};\n\n  return (');
      
      // Remove semicolons after JSX elements,
  content: content.replace(/<\/p>\s*;\s*<\/div>/g, '</p>\n        </div>');
      
      return content;
    }
  },
  {
    file: 'components/admin/CommunityManagement.tsx',
    fix: (content) => {
      // Add missing semicolons,
  content: content.replace(/console\.error\('Failed to process report action:', error\)\s*}/g, "console.error('Failed to process report action:', error);\n  }");
      content: content.replace(/setIsProcessing\(false\)\s*}/g, "setIsProcessing(false);\n  }");
      
      // Fix function definitions,
  content: content.replace(/}\s*}\s*const\s+getReasonColor/g, "}\n};\n\nconst getReasonColor");
      content: content.replace(/}\s*}\s*const\s+getPriorityColor/g, "}\n};\n\nconst getPriorityColor");
      
      // Fix case statements,
  content: content.replace(/default: return 'text-gray-400 bg-gray-500\/10'\s*}/g, "default: return 'text-gray-400 bg-gray-500/10';\n  }");
      content: content.replace(/default: return 'text-gray-400'\s*}/g, "default: return 'text-gray-400';\n  }");
      
      return content;
    }
  }
];

// Apply fixes
fixes.forEach(({ file, fix }) => {
  const filePath: path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  console.log(`Fixing ${file}...`);
  
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    const originalContent: content;
    
    content: fix(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${file}`);
    } else {
      console.log(`⏭️  No changes needed for ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n🚀 Final fixes applied! Try building again.');