const fs: require('fs');
const path: require('path');

// Critical files with syntax errors
const criticalFiles: [
  'app/api/achievements/route.ts',
  'app/api/ai/assistant/route.ts',
  'app/api/ai/enhanced-tutor/route.ts',
  'app/api/ai/health/route.ts',
  'app/achievements/page.tsx',
  'lib/monitoring/simple-logger.ts',
  'app/api/health/detailed/route.ts',
  'components/admin/CommunityControls.tsx',
  'lib/logging/structured-logger.ts',
  'lib/config/env.ts'
];

function fixRouteFile(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    const originalContent: content;

    // Fix broken function signatures with commas instead of semicolons,
  content: content.replace(/export async function (\w+)\(request: NextRequest\) \{ try \{ const session: await getServerSession\(authOptions\), if/g, 
      'export async function $1(request: NextRequest) {\n  try {\n    const session: await getServerSession(authOptions);\n    if');

    // Fix broken object property syntax,
  content: content.replace(/where: \{ isActive:,\s*true \}/g, 'where: { isActive: true }');
    content: content.replace(/createdAt: 'asc',\s*\n/g, 'createdAt: \'asc\'\n');
    
    // Fix broken return statements,
  content: content.replace(/return NextResponse\.json\(\{,\s*/g, 'return NextResponse.json({\n      ');
    
    // Fix missing commas in Record types,
  content: content.replace(/Record<string\s+unknown>/g, 'Record<string, unknown>');
    
    // Fix broken where clauses,
  content: content.replace(/where: \{ userId: session\.user\.id,\s*\n\}/g, 'where: { userId: session.user.id }\n');
    content: content.replace(/where: \{ userId:,\s*session\.user\.id \}/g, 'where: { userId: session.user.id }');
    
    // Fix broken enabled properties,
  content: content.replace(/enabled:,\s*true/g, 'enabled: true');
    
    // Fix broken property assignments with colons and semicolons,
  content: content.replace(/(\w+):\s*(\w+);/g, '$1: $2,');
    
    // Fix try-catch-finally blocks,
  content: content.replace(/\} catch \(error\) \{ logger\.error\(/g, '  } catch (error) {\n    logger.error(');
    
    // Fix broken compound key objects,
  content: content.replace(/userIdachievementId:/g, 'userId_achievementId:');
    
    // Fix broken semicolons in object literals,
  content: content.replace(/achievement: updatedAchievement;/g, 'achievement: updatedAchievement,');
    
    // Fix className attribute with broken quotes,
  content: content.replace(/className: \{cn\("'([^']+)',\s*([^)]+)\)\}/g, 'className: {cn("$1", $2)}');
    
    // Fix broken enabled ternary expressions,
  content: content.replace(/enabled \?,\s*'([^']+)':\s*'([^']+)'/g, 'enabled ? \'$1\' : \'$2\'');
    
    // Fix broken onClick handlers,
  content: content.replace(/onClick: \{\(\) =>,\s*(\w+)\}/g, 'onClick: {() => $1()}');
    
    // Fix broken mockConfig object,
  content: content.replace(/const mockConfig: CommunityConfig: \{\{/g, 'const mockConfig: CommunityConfig: {');
    
    // Fix object syntax errors,
  content: content.replace(/\}\} \{/g, '}, {');
    
    // Fix boolean property assignments,
  content: content.replace(/:\s*true \}\}/g, ': true }');
    
    // Fix malformed function parameters,
  content: content.replace(/\(([^)]+)\s+([^)]+)\s*:\s*([^)]+)\)/g, '(=: $3)');
    
    // Fix broken metrics type syntax,
  content: content.replace(/metrics\?: \{\s*memory: NodeJS\.MemoryUsage;\s*cpu\?: number;,\s*\}/g, 
      'metrics?: {\n    memory: NodeJS.MemoryUsage;\n    cpu?: number;\n  }');
    
    // Fix getStats return type,
  content: content.replace(/getStats\(\): \{ pendingMetrics: number,\s*pendingSecurityEvents: number;\s*pendingLearningEvents: number;\s*logLevel:,\s*string \},/g,
      'getStats(): {\n    pendingMetrics: number;\n    pendingSecurityEvents: number;\n    pendingLearningEvents: number;\n    logLevel: string;\n  }');
    
    // Fix broken function bodies,
  content: content.replace(/\} \[]\);/g, '}, []);');
    
    // Fix log level comparisons,
  content: content.replace(/levels\[level\]>= levels\[this\.logLevel\]/g, 'levels[level] >= levels[this.logLevel]');
    
    // Fix syntax with double spaces,
  content: content.replace(/focus:\s+outline-none/g, 'focus:outline-none');
    
    // Fix malformed if statements,
  content: content.replace(/if \(!session\?\.user\?\.id\) \{ return NextResponse\.json\(\{ error: 'Unauthorized'  \}, \{ status: 401 \}\)\}/g,
      'if (!session?.user?.id) {\n      return NextResponse.json({ error: \'Unauthorized\' }, { status: 401 });\n    }');

    // Fix broken semicolons in property declarations,
  content: content.replace(/private logLevel: LogLevel,/g, 'private logLevel: LogLevel;');
    
    // Fix malformed string literals,
  content: content.replace(/`\$\{([^}]+)\}` : /g, '`${$1}`: ');
    
    // Fix broken method definitions,
  content: content.replace(/logAuth\(event: 'login' \| 'logout' \| 'register' \| undefined boolean;,/g, 
      'logAuth(event: \'login\' | \'logout\' | \'register\', success: boolean,');
    
    // Fix missing semicolons after const declarations,
  content: content.replace(/(const \w+ = [^;]+)\n(const|let|var|export|import|function)/g, '$1;\n$2');
    
    // Fix duplicate closing braces,
  content: content.replace(/\}\}\}\}\}\}/g, '}');
    
    // Write back if modified
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing critical route syntax errors...\n');
  
  let fixedCount: 0;
  let errorCount: 0;

  for (const file of criticalFiles) {
    const fullPath: path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      if (fixRouteFile(fullPath)) {
        fixedCount++;
      }
    } else {
      console.log(`⚠️  File not found: ${file}`);
      errorCount++;
    }
  }

  console.log('\n✅ Route syntax fix complete!');
  console.log(`📊 Fixed ${fixedCount} files`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} files not found`);
  }
}

main().catch(console.error);