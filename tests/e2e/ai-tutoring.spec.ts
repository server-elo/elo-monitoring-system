import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for AI tutoring features
 * Tests OpenAI/Google AI chat responses, code analysis, and learning recommendations
 */

test.describe('AI Tutoring System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AI tutoring page
    await page.goto('/ai-tutor');
    await expect(page.locator('[data-testid="ai-tutor-interface"]')).toBeVisible();
  });

  test('should initialize AI chat interface', async ({ page }) => {
    // Verify AI chat components are present
    await expect(page.locator('[data-testid="ai-chat-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
    
    // Verify welcome message
    await expect(page.locator('[data-testid="ai-welcome-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-welcome-message"]')).toContainText('AI Tutor');
    
    // Verify suggested prompts
    await expect(page.locator('[data-testid="suggested-prompts"]')).toBeVisible();
    const prompts = page.locator('[data-testid="suggested-prompt"]');
    await expect(prompts).toHaveCount(4); // Should have 4 suggested prompts
  });

  test('should send message and receive AI response', async ({ page }) => {
    // Mock AI API response
    await page.route('/api/ai/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'Hello! I\'m your AI tutor. I can help you learn Solidity programming. What would you like to know?',
          suggestions: [
            'Explain smart contracts',
            'Show me a simple contract example',
            'What are gas fees?'
          ]
        })
      });
    });

    // Send a message
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Hello, can you help me learn Solidity?');
    await page.click('[data-testid="send-button"]');

    // Verify message appears in chat
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Hello, can you help me learn Solidity?');

    // Verify AI response appears
    await expect(page.locator('[data-testid="ai-response"]').last()).toContainText('Hello! I\'m your AI tutor');
    
    // Verify suggestions appear
    await expect(page.locator('[data-testid="ai-suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggestion-chip"]')).toHaveCount(3);
  });

  test('should analyze Solidity code and provide feedback', async ({ page }) => {
    // Navigate to code analysis section
    await page.click('[data-testid="code-analysis-tab"]');
    await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();

    // Mock code analysis API
    await page.route('/api/ai/analyze-code', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          analysis: {
            issues: [
              {
                type: 'warning',
                line: 5,
                message: 'Consider using SafeMath for arithmetic operations',
                severity: 'medium'
              }
            ],
            suggestions: [
              'Add input validation for the setValue function',
              'Consider adding access control modifiers',
              'Use events to log important state changes'
            ],
            gasOptimization: [
              'Use uint256 instead of uint for better gas efficiency',
              'Pack struct variables to save storage slots'
            ],
            security: {
              score: 7,
              vulnerabilities: []
            }
          }
        })
      });
    });

    // Enter Solidity code
    const codeEditor = page.locator('[data-testid="code-editor"] textarea');
    await codeEditor.fill(`pragma solidity ^0.8.0;

contract SimpleStorage {
    uint public storedData;
    
    function set(uint x) public {
        storedData = x;
    }
    
    function get() public view returns (uint) {
        return storedData;
    }
}`);

    // Trigger code analysis
    await page.click('[data-testid="analyze-code-button"]');

    // Verify analysis results
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    
    // Check issues section
    await expect(page.locator('[data-testid="code-issues"]')).toBeVisible();
    await expect(page.locator('[data-testid="issue-item"]')).toContainText('Consider using SafeMath');
    
    // Check suggestions section
    await expect(page.locator('[data-testid="code-suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggestion-item"]')).toContainText('Add input validation');
    
    // Check security score
    await expect(page.locator('[data-testid="security-score"]')).toContainText('7');
  });

  test('should provide learning recommendations', async ({ page }) => {
    // Navigate to learning recommendations
    await page.click('[data-testid="recommendations-tab"]');

    // Mock recommendations API
    await page.route('/api/ai/recommendations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recommendations: [
            {
              id: 'rec-1',
              type: 'lesson',
              title: 'Smart Contract Security',
              description: 'Learn about common security vulnerabilities and how to prevent them',
              difficulty: 'intermediate',
              estimatedTime: '45 minutes',
              reason: 'Based on your recent code analysis, you should learn about security best practices'
            },
            {
              id: 'rec-2',
              type: 'exercise',
              title: 'Build a Token Contract',
              description: 'Create your own ERC-20 token contract',
              difficulty: 'beginner',
              estimatedTime: '30 minutes',
              reason: 'Perfect next step after learning basic contract structure'
            }
          ],
          learningPath: {
            currentLevel: 'beginner',
            nextMilestone: 'intermediate',
            progress: 65,
            suggestedTopics: ['Events and Logging', 'Error Handling', 'Gas Optimization']
          }
        })
      });
    });

    // Load recommendations
    await page.click('[data-testid="load-recommendations-button"]');

    // Verify recommendations appear
    await expect(page.locator('[data-testid="recommendation-card"]')).toHaveCount(2);
    
    // Check first recommendation
    const firstRec = page.locator('[data-testid="recommendation-card"]').first();
    await expect(firstRec).toContainText('Smart Contract Security');
    await expect(firstRec).toContainText('intermediate');
    await expect(firstRec).toContainText('45 minutes');
    
    // Check learning path
    await expect(page.locator('[data-testid="learning-path"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-level"]')).toContainText('beginner');
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('value', '65');
    
    // Test recommendation interaction
    await firstRec.click();
    await expect(page.locator('[data-testid="recommendation-details"]')).toBeVisible();
  });

  test('should handle code debugging assistance', async ({ page }) => {
    // Navigate to debugging section
    await page.click('[data-testid="debugging-tab"]');

    // Mock debugging API
    await page.route('/api/ai/debug', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          debugInfo: {
            errors: [
              {
                line: 8,
                column: 25,
                message: 'TypeError: Member "push" not found or not visible after argument-dependent lookup in uint256[]',
                suggestion: 'Arrays in Solidity need to be declared as dynamic. Try: uint256[] public numbers;'
              }
            ],
            fixes: [
              {
                line: 3,
                original: 'uint256[5] public numbers;',
                fixed: 'uint256[] public numbers;',
                explanation: 'Changed to dynamic array to allow push operations'
              }
            ],
            explanation: 'The error occurs because you\'re trying to use push() on a fixed-size array. In Solidity, only dynamic arrays support the push() method.'
          }
        })
      });
    });

    // Enter buggy code
    const debugEditor = page.locator('[data-testid="debug-editor"] textarea');
    await debugEditor.fill(`pragma solidity ^0.8.0;

contract BuggyContract {
    uint256[5] public numbers;
    
    function addNumber(uint256 _number) public {
        numbers.push(_number);
    }
}`);

    // Trigger debugging
    await page.click('[data-testid="debug-code-button"]');

    // Verify debug results
    await expect(page.locator('[data-testid="debug-results"]')).toBeVisible();
    
    // Check error explanation
    await expect(page.locator('[data-testid="error-explanation"]')).toContainText('push() on a fixed-size array');
    
    // Check suggested fix
    await expect(page.locator('[data-testid="suggested-fix"]')).toContainText('uint256[] public numbers');
    
    // Test applying fix
    await page.click('[data-testid="apply-fix-button"]');
    await expect(debugEditor).toHaveValue(/uint256\[\] public numbers/);
  });

  test('should provide interactive learning exercises', async ({ page }) => {
    // Navigate to exercises section
    await page.click('[data-testid="exercises-tab"]');

    // Mock exercises API
    await page.route('/api/ai/exercises', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exercise: {
            id: 'ex-1',
            title: 'Create a Simple Voting Contract',
            description: 'Build a contract that allows users to vote on proposals',
            instructions: [
              'Create a struct for Proposal with name and vote count',
              'Add a mapping to track if an address has voted',
              'Implement a vote function',
              'Add a function to get the winning proposal'
            ],
            starterCode: 'pragma solidity ^0.8.0;\n\ncontract Voting {\n    // Your code here\n}',
            tests: [
              'Should allow users to vote',
              'Should prevent double voting',
              'Should return correct winner'
            ]
          }
        })
      });
    });

    // Load exercise
    await page.click('[data-testid="load-exercise-button"]');

    // Verify exercise interface
    await expect(page.locator('[data-testid="exercise-title"]')).toContainText('Create a Simple Voting Contract');
    await expect(page.locator('[data-testid="exercise-instructions"]')).toBeVisible();
    await expect(page.locator('[data-testid="exercise-editor"]')).toBeVisible();
    
    // Check starter code
    const exerciseEditor = page.locator('[data-testid="exercise-editor"] textarea');
    await expect(exerciseEditor).toHaveValue(/contract Voting/);
    
    // Test hint system
    await page.click('[data-testid="get-hint-button"]');
    await expect(page.locator('[data-testid="hint-modal"]')).toBeVisible();
    
    // Test solution check
    await page.click('[data-testid="check-solution-button"]');
    await expect(page.locator('[data-testid="test-results"]')).toBeVisible();
  });

  test('should handle AI service errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/ai/chat', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'AI service temporarily unavailable'
        })
      });
    });

    // Try to send message
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Test message');
    await page.click('[data-testid="send-button"]');

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('temporarily unavailable');
    
    // Verify retry button appears
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Test retry functionality
    await page.route('/api/ai/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'Service restored! How can I help you?'
        })
      });
    });

    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="ai-response"]').last()).toContainText('Service restored!');
  });

  test('should track learning progress and analytics', async ({ page }) => {
    // Navigate to progress section
    await page.click('[data-testid="progress-tab"]');

    // Mock progress API
    await page.route('/api/ai/progress', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          progress: {
            totalInteractions: 25,
            questionsAsked: 15,
            codeAnalyzed: 8,
            exercisesCompleted: 3,
            learningStreak: 5,
            topicsLearned: ['Variables', 'Functions', 'Modifiers'],
            weakAreas: ['Security', 'Gas Optimization'],
            achievements: ['First Contract', 'Code Analyzer', 'Question Master']
          }
        })
      });
    });

    // Load progress data
    await page.click('[data-testid="load-progress-button"]');

    // Verify progress display
    await expect(page.locator('[data-testid="total-interactions"]')).toContainText('25');
    await expect(page.locator('[data-testid="learning-streak"]')).toContainText('5');
    
    // Check achievements
    await expect(page.locator('[data-testid="achievement-badge"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="achievement-badge"]').first()).toContainText('First Contract');
    
    // Check weak areas
    await expect(page.locator('[data-testid="weak-areas"]')).toContainText('Security');
    await expect(page.locator('[data-testid="weak-areas"]')).toContainText('Gas Optimization');
  });
});
