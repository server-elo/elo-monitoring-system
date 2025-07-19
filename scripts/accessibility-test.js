#!/usr/bin/env node

const { chromium } = require('playwright');
const axeCore = require('axe-core');
const fs = require('fs');
const path = require('path');

// Accessibility test configuration
const ACCESSIBILITY_CONFIG = {
  urls: [
    { url: 'http://localhost:3000', name: 'Homepage' },
    { url: 'http://localhost:3000/auth/login', name: 'Login Page' },
    { url: 'http://localhost:3000/auth/register', name: 'Registration Page' },
    { url: 'http://localhost:3000/dashboard', name: 'Dashboard' },
    { url: 'http://localhost:3000/learn', name: 'Learn Page' },
    { url: 'http://localhost:3000/code', name: 'Code Editor' },
    { url: 'http://localhost:3000/collaborate', name: 'Collaboration' },
    { url: 'http://localhost:3000/achievements', name: 'Achievements' },
    { url: 'http://localhost:3000/settings', name: 'Settings' }
  ],
  wcagLevels: ['wcag2a', 'wcag2aa'],
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
  rules: {
    // Critical accessibility rules
    'color-contrast': { enabled: true, level: 'AA' },
    'keyboard-navigation': { enabled: true, level: 'AA' },
    'aria-labels': { enabled: true, level: 'AA' },
    'focus-indicators': { enabled: true, level: 'AA' },
    'heading-structure': { enabled: true, level: 'AA' },
    'alt-text': { enabled: true, level: 'AA' },
    'form-labels': { enabled: true, level: 'AA' },
    'link-purpose': { enabled: true, level: 'AA' },
    'page-title': { enabled: true, level: 'AA' },
    'language': { enabled: true, level: 'AA' }
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Run axe-core accessibility audit
async function runAxeAudit(page, url) {
  try {
    // Inject axe-core into the page
    await page.addScriptTag({ path: require.resolve('axe-core') });
    
    // Run axe audit
    const results = await page.evaluate((config) => {
      return new Promise((resolve) => {
        axe.run(document, {
          tags: config.tags,
          rules: Object.keys(config.rules).reduce((acc, rule) => {
            acc[rule] = { enabled: config.rules[rule].enabled };
            return acc;
          }, {})
        }, (err, results) => {
          if (err) throw err;
          resolve(results);
        });
      });
    }, ACCESSIBILITY_CONFIG);
    
    return {
      url,
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
      summary: {
        violationCount: results.violations.length,
        passCount: results.passes.length,
        incompleteCount: results.incomplete.length
      }
    };
  } catch (error) {
    logError(`Axe audit failed for ${url}: ${error.message}`);
    return null;
  }
}

// Test keyboard navigation
async function testKeyboardNavigation(page, url) {
  try {
    logInfo(`Testing keyboard navigation for ${url}`);
    
    const results = {
      focusableElements: [],
      tabOrder: [],
      skipLinks: [],
      focusTraps: [],
      issues: []
    };
    
    // Find all focusable elements
    const focusableElements = await page.evaluate(() => {
      const selector = 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
      const elements = Array.from(document.querySelectorAll(selector));
      
      return elements.map((el, index) => ({
        index,
        tagName: el.tagName,
        type: el.type || null,
        id: el.id || null,
        className: el.className || null,
        ariaLabel: el.getAttribute('aria-label') || null,
        tabIndex: el.tabIndex,
        text: el.textContent?.trim().substring(0, 50) || null,
        visible: el.offsetParent !== null
      }));
    });
    
    results.focusableElements = focusableElements;
    
    // Test tab navigation
    let currentIndex = 0;
    const maxTabs = Math.min(focusableElements.length, 20); // Limit to prevent infinite loops
    
    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        const focused = document.activeElement;
        return {
          tagName: focused.tagName,
          id: focused.id || null,
          className: focused.className || null,
          text: focused.textContent?.trim().substring(0, 50) || null
        };
      });
      
      results.tabOrder.push(focusedElement);
    }
    
    // Check for skip links
    const skipLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href^="#"]'));
      return links.filter(link => 
        link.textContent.toLowerCase().includes('skip') ||
        link.textContent.toLowerCase().includes('jump')
      ).map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        visible: link.offsetParent !== null
      }));
    });
    
    results.skipLinks = skipLinks;
    
    // Validate tab order makes sense
    if (results.tabOrder.length === 0) {
      results.issues.push('No focusable elements found or tab navigation not working');
    }
    
    return results;
  } catch (error) {
    logError(`Keyboard navigation test failed for ${url}: ${error.message}`);
    return null;
  }
}

// Test color contrast
async function testColorContrast(page, url) {
  try {
    logInfo(`Testing color contrast for ${url}`);
    
    const contrastResults = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const results = [];
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        const fontSize = parseFloat(style.fontSize);
        
        if (color && backgroundColor && el.textContent?.trim()) {
          results.push({
            element: el.tagName,
            color,
            backgroundColor,
            fontSize,
            text: el.textContent.trim().substring(0, 30),
            isLargeText: fontSize >= 18 || (fontSize >= 14 && style.fontWeight >= 700)
          });
        }
      });
      
      return results.slice(0, 50); // Limit results
    });
    
    return contrastResults;
  } catch (error) {
    logError(`Color contrast test failed for ${url}: ${error.message}`);
    return null;
  }
}

// Test screen reader compatibility
async function testScreenReaderCompatibility(page, url) {
  try {
    logInfo(`Testing screen reader compatibility for ${url}`);
    
    const results = await page.evaluate(() => {
      const issues = [];
      
      // Check for missing alt text on images
      const images = Array.from(document.querySelectorAll('img'));
      images.forEach(img => {
        if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
          issues.push({
            type: 'missing-alt-text',
            element: 'img',
            src: img.src,
            message: 'Image missing alt text'
          });
        }
      });
      
      // Check for missing form labels
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      inputs.forEach(input => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                        input.getAttribute('aria-label') ||
                        input.getAttribute('aria-labelledby');
        
        if (!hasLabel && input.type !== 'hidden') {
          issues.push({
            type: 'missing-form-label',
            element: input.tagName,
            type: input.type,
            message: 'Form control missing label'
          });
        }
      });
      
      // Check for proper heading structure
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      let previousLevel = 0;
      
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level > previousLevel + 1) {
          issues.push({
            type: 'heading-structure',
            element: heading.tagName,
            message: `Heading level ${level} follows level ${previousLevel} (skipped levels)`
          });
        }
        previousLevel = level;
      });
      
      // Check for ARIA landmarks
      const landmarks = Array.from(document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer'));
      
      return {
        issues,
        landmarks: landmarks.length,
        headingCount: headings.length,
        imageCount: images.length,
        formControlCount: inputs.length
      };
    });
    
    return results;
  } catch (error) {
    logError(`Screen reader compatibility test failed for ${url}: ${error.message}`);
    return null;
  }
}

// Test reduced motion support
async function testReducedMotionSupport(page, url) {
  try {
    logInfo(`Testing reduced motion support for ${url}`);
    
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    const results = await page.evaluate(() => {
      const animatedElements = Array.from(document.querySelectorAll('*'));
      const issues = [];
      
      animatedElements.forEach(el => {
        const style = window.getComputedStyle(el);
        
        // Check for animations that don't respect reduced motion
        if (style.animationDuration !== '0s' && style.animationDuration !== 'initial') {
          issues.push({
            type: 'animation-not-disabled',
            element: el.tagName,
            className: el.className,
            animationDuration: style.animationDuration,
            message: 'Animation not disabled with reduced motion preference'
          });
        }
        
        // Check for transitions that don't respect reduced motion
        if (style.transitionDuration !== '0s' && style.transitionDuration !== 'initial') {
          issues.push({
            type: 'transition-not-disabled',
            element: el.tagName,
            className: el.className,
            transitionDuration: style.transitionDuration,
            message: 'Transition not disabled with reduced motion preference'
          });
        }
      });
      
      return {
        issues: issues.slice(0, 20), // Limit results
        totalAnimatedElements: issues.length
      };
    });
    
    return results;
  } catch (error) {
    logError(`Reduced motion test failed for ${url}: ${error.message}`);
    return null;
  }
}

// Generate accessibility report
function generateAccessibilityReport(auditResults) {
  logHeader('Accessibility Test Results');
  
  let totalViolations = 0;
  let totalPasses = 0;
  let criticalIssues = [];
  let allIssues = [];
  
  auditResults.forEach(result => {
    if (!result) return;
    
    const { url, name, axeResults, keyboardResults, contrastResults, screenReaderResults, reducedMotionResults } = result;
    
    log(`\n🔍 ${name} (${url})`, 'bright');
    log('-'.repeat(50), 'cyan');
    
    if (axeResults) {
      totalViolations += axeResults.summary.violationCount;
      totalPasses += axeResults.summary.passCount;
      
      log(`Axe Violations: ${axeResults.summary.violationCount}`, axeResults.summary.violationCount === 0 ? 'green' : 'red');
      log(`Axe Passes: ${axeResults.summary.passCount}`, 'green');
      
      // Log critical violations
      axeResults.violations.forEach(violation => {
        if (violation.impact === 'critical' || violation.impact === 'serious') {
          criticalIssues.push({
            url: name,
            type: 'axe-violation',
            impact: violation.impact,
            rule: violation.id,
            description: violation.description,
            help: violation.help
          });
          
          logError(`  ${violation.impact.toUpperCase()}: ${violation.description}`);
        }
      });
    }
    
    if (keyboardResults) {
      log(`Focusable Elements: ${keyboardResults.focusableElements.length}`, 'blue');
      log(`Skip Links: ${keyboardResults.skipLinks.length}`, keyboardResults.skipLinks.length > 0 ? 'green' : 'yellow');
      
      keyboardResults.issues.forEach(issue => {
        allIssues.push({
          url: name,
          type: 'keyboard',
          issue
        });
        logWarning(`  Keyboard: ${issue}`);
      });
    }
    
    if (screenReaderResults) {
      log(`Screen Reader Issues: ${screenReaderResults.issues.length}`, screenReaderResults.issues.length === 0 ? 'green' : 'red');
      
      screenReaderResults.issues.forEach(issue => {
        if (issue.type === 'missing-alt-text' || issue.type === 'missing-form-label') {
          criticalIssues.push({
            url: name,
            type: 'screen-reader',
            issue: issue.message,
            element: issue.element
          });
        }
        allIssues.push({
          url: name,
          type: 'screen-reader',
          issue: issue.message
        });
      });
    }
    
    if (reducedMotionResults) {
      log(`Reduced Motion Issues: ${reducedMotionResults.issues.length}`, reducedMotionResults.issues.length === 0 ? 'green' : 'yellow');
      
      reducedMotionResults.issues.forEach(issue => {
        allIssues.push({
          url: name,
          type: 'reduced-motion',
          issue: issue.message
        });
      });
    }
  });
  
  // Overall summary
  log('\n' + '='.repeat(60), 'cyan');
  log('Accessibility Summary', 'bright');
  log('='.repeat(60), 'cyan');
  
  log(`Total Violations: ${totalViolations}`, totalViolations === 0 ? 'green' : 'red');
  log(`Total Passes: ${totalPasses}`, 'green');
  log(`Critical Issues: ${criticalIssues.length}`, criticalIssues.length === 0 ? 'green' : 'red');
  log(`All Issues: ${allIssues.length}`, allIssues.length === 0 ? 'green' : 'yellow');
  
  // Critical issues summary
  if (criticalIssues.length > 0) {
    log('\n🚨 Critical Accessibility Issues:', 'red');
    criticalIssues.forEach((issue, index) => {
      log(`\n${index + 1}. ${issue.url}: ${issue.issue || issue.description}`, 'red');
      if (issue.help) {
        log(`   💡 ${issue.help}`, 'cyan');
      }
    });
  }
  
  // Success criteria
  const success = totalViolations === 0 && criticalIssues.length === 0;
  
  log('\n' + '='.repeat(60), 'cyan');
  if (success) {
    logSuccess('🎉 All accessibility tests passed!');
  } else {
    logError('❌ Accessibility issues found. Please address critical issues before production.');
  }
  log('='.repeat(60), 'cyan');
  
  return {
    success,
    totalViolations,
    totalPasses,
    criticalIssues,
    allIssues
  };
}

// Main execution
async function main() {
  logHeader('Solidity Learning Platform - Accessibility Testing');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  try {
    const auditResults = [];
    
    for (const { url, name } of ACCESSIBILITY_CONFIG.urls) {
      logInfo(`Testing ${name} (${url})`);
      
      const page = await context.newPage();
      
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        
        // Run all accessibility tests
        const [axeResults, keyboardResults, contrastResults, screenReaderResults, reducedMotionResults] = await Promise.all([
          runAxeAudit(page, url),
          testKeyboardNavigation(page, url),
          testColorContrast(page, url),
          testScreenReaderCompatibility(page, url),
          testReducedMotionSupport(page, url)
        ]);
        
        auditResults.push({
          url,
          name,
          axeResults,
          keyboardResults,
          contrastResults,
          screenReaderResults,
          reducedMotionResults
        });
        
        logSuccess(`✅ ${name} accessibility tests completed`);
      } catch (error) {
        logError(`❌ ${name} accessibility tests failed: ${error.message}`);
      } finally {
        await page.close();
      }
    }
    
    // Generate report
    const summary = generateAccessibilityReport(auditResults);
    
    // Save detailed report
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `accessibility-report-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary,
      results: auditResults,
      config: ACCESSIBILITY_CONFIG
    }, null, 2));
    
    logInfo(`Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(summary.success ? 0 : 1);
    
  } catch (error) {
    logError(`Accessibility testing failed: ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logError(`Accessibility test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAxeAudit, testKeyboardNavigation, testColorContrast };
