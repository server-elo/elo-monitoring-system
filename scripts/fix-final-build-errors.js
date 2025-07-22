#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function fixFinalErrors() {
  console.log('🔧 Fixing final build errors...\n');

  // Fix AICodeAssistant.tsx
  const aiAssistantPath = path.join(process.cwd(), 'components/ai/AICodeAssistant.tsx');
  try {
    console.log('📝 Fixing AICodeAssistant.tsx...');
    const content = await fs.readFile(aiAssistantPath, 'utf8');
    
    // Fix the unterminated string constant around line 308
    const fixedContent = content.replace(
      /"struct User \{\\n  uint256 balance;\\n  uint32 lastActive;\\n  address wallet;\\n\}},/g,
      '"struct User {\\n  uint256 balance;\\n  uint32 lastActive;\\n  address wallet;\\n}",'
    );
    
    await fs.writeFile(aiAssistantPath, fixedContent, 'utf8');
    console.log('✅ Fixed AICodeAssistant.tsx');
  } catch (error) {
    console.error('❌ Error fixing AICodeAssistant.tsx:', error.message);
  }

  // Fix app/learn/page.tsx
  const learnPagePath = path.join(process.cwd(), 'app/learn/page.tsx');
  try {
    console.log('📝 Fixing app/learn/page.tsx...');
    const content = await fs.readFile(learnPagePath, 'utf8');
    const lines = content.split('\n');
    
    // Remove the line with just "();"
    const filteredLines = lines.filter(line => line.trim() !== '();');
    
    await fs.writeFile(learnPagePath, filteredLines.join('\n'), 'utf8');
    console.log('✅ Fixed app/learn/page.tsx');
  } catch (error) {
    console.error('❌ Error fixing app/learn/page.tsx:', error.message);
  }

  // Fix app/performance-dashboard/page.tsx
  const perfDashPath = path.join(process.cwd(), 'app/performance-dashboard/page.tsx');
  try {
    console.log('📝 Fixing app/performance-dashboard/page.tsx...');
    const content = await fs.readFile(perfDashPath, 'utf8');
    
    // Replace ("use client") with "use client" and move to top
    let cleanContent = content.replace(/\("use client"\);?\s*/g, '');
    cleanContent = '"use client";\n\n' + cleanContent.trim();
    
    await fs.writeFile(perfDashPath, cleanContent, 'utf8');
    console.log('✅ Fixed app/performance-dashboard/page.tsx');
  } catch (error) {
    console.error('❌ Error fixing app/performance-dashboard/page.tsx:', error.message);
  }

  console.log('\n✨ Final build fixes completed!');
}

// Run the fixes
fixFinalErrors().catch(console.error);