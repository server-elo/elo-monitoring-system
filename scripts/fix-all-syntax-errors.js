#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function fixAllSyntaxErrors() {
  console.log('🔧 Fixing all remaining syntax errors comprehensively...\n');

  // Fix AICodeAssistant.tsx getSeverityColor function
  const aiAssistantPath = path.join(process.cwd(), 'components/ai/AICodeAssistant.tsx');
  try {
    console.log('📝 Fixing AICodeAssistant.tsx getSeverityColor...');
    let content = await fs.readFile(aiAssistantPath, 'utf8');
    
    // Fix getSeverityColor switch statement
    content = content.replace(
      /const getSeverityColor = \(severity: string\) => \{[\s\S]*?switch \(severity\) \{[\s\S]*?case critical":([\s\S]*?)case error":([\s\S]*?)case high":([\s\S]*?)case medium":([\s\S]*?)case warning":([\s\S]*?)case low":([\s\S]*?)case info":([\s\S]*?)default:([\s\S]*?)\}\s*\}/,
      `const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
      case "error":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "medium":
      case "warning":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "low":
      case "info":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  }`
    );
    
    await fs.writeFile(aiAssistantPath, content, 'utf8');
    console.log('✅ Fixed AICodeAssistant.tsx');
  } catch (error) {
    console.error('❌ Error fixing AICodeAssistant.tsx:', error.message);
  }

  // Fix InteractiveExercise.tsx
  const exercisePath = path.join(process.cwd(), 'components/learning/InteractiveExercise.tsx');
  try {
    console.log('📝 Fixing InteractiveExercise.tsx...');
    let content = await fs.readFile(exercisePath, 'utf8');
    
    // Fix array declaration syntax
    content = content.replace(
      /const results = TestResult\[\] = \[\];/g,
      'const results: TestResult[] = [];'
    );
    
    await fs.writeFile(exercisePath, content, 'utf8');
    console.log('✅ Fixed InteractiveExercise.tsx');
  } catch (error) {
    console.error('❌ Error fixing InteractiveExercise.tsx:', error.message);
  }

  // Fix LearningPathVisualization.tsx
  const pathVisualizationPath = path.join(process.cwd(), 'components/learning/LearningPathVisualization.tsx');
  try {
    console.log('📝 Fixing LearningPathVisualization.tsx...');
    let content = await fs.readFile(pathVisualizationPath, 'utf8');
    
    // Fix the JSX syntax issue with arrow function in map
    content = content.replace(
      /style=\{\{ zIndex: 0 \}\}>\{pathModules\.slice\(0, -1\)\.map\(_, index\) => \{/g,
      'style={{ zIndex: 0 }}>{pathModules.slice(0, -1).map((_, index) => {'
    );
    
    await fs.writeFile(pathVisualizationPath, content, 'utf8');
    console.log('✅ Fixed LearningPathVisualization.tsx');
  } catch (error) {
    console.error('❌ Error fixing LearningPathVisualization.tsx:', error.message);
  }

  // Fix LessonViewer.tsx
  const lessonViewerPath = path.join(process.cwd(), 'components/learning/LessonViewer.tsx');
  try {
    console.log('📝 Fixing LessonViewer.tsx...');
    let content = await fs.readFile(lessonViewerPath, 'utf8');
    
    // Fix destructuring assignment syntax
    content = content.replace(
      /hasNextLesson: false,/g,
      'hasNextLesson = false,'
    );
    content = content.replace(
      /hasPreviousLesson: false,/g,
      'hasPreviousLesson = false,'
    );
    
    await fs.writeFile(lessonViewerPath, content, 'utf8');
    console.log('✅ Fixed LessonViewer.tsx');
  } catch (error) {
    console.error('❌ Error fixing LessonViewer.tsx:', error.message);
  }

  // Fix ModuleCard.tsx
  const moduleCardPath = path.join(process.cwd(), 'components/learning/ModuleCard.tsx');
  try {
    console.log('📝 Fixing ModuleCard.tsx...');
    let content = await fs.readFile(moduleCardPath, 'utf8');
    
    // Fix destructuring assignment syntax
    content = content.replace(
      /isSelected: false,/g,
      'isSelected = false,'
    );
    content = content.replace(
      /detailed: false,/g,
      'detailed = false,'
    );
    
    await fs.writeFile(moduleCardPath, content, 'utf8');
    console.log('✅ Fixed ModuleCard.tsx');
  } catch (error) {
    console.error('❌ Error fixing ModuleCard.tsx:', error.message);
  }

  console.log('\n✨ All syntax fixes completed!');
  console.log('\n📋 Summary of fixes:');
  console.log('   - Fixed switch statement case syntax in AICodeAssistant.tsx');
  console.log('   - Fixed array type declaration in InteractiveExercise.tsx');
  console.log('   - Fixed JSX arrow function syntax in LearningPathVisualization.tsx');
  console.log('   - Fixed destructuring default values in LessonViewer.tsx');
  console.log('   - Fixed destructuring default values in ModuleCard.tsx');
}

// Run the fixes
fixAllSyntaxErrors().catch(console.error);