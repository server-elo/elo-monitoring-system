import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for real-time collaboration features
 * Tests Monaco Editor synchronization, live chat, and user presence
 */

test.describe('Real-time Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to collaboration page
    await page.goto('/collaboration');
    await expect(page.locator('[data-testid="collaboration-hub"]')).toBeVisible();
  });

  test('should create and join collaboration session', async ({ page }) => {
    // Create new collaboration session
    await page.click('[data-testid="create-session-button"]');
    
    // Fill session details
    await page.fill('[data-testid="session-title"]', 'E2E Test Session');
    await page.fill('[data-testid="session-description"]', 'Test session for E2E testing');
    await page.selectOption('[data-testid="session-language"]', 'solidity');
    await page.fill('[data-testid="session-max-participants"]', '5');
    
    // Create session
    await page.click('[data-testid="create-session-submit"]');
    
    // Verify session creation
    await expect(page.locator('[data-testid="collaboration-editor"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="session-title"]')).toContainText('E2E Test Session');
    
    // Verify user appears in participants list
    await expect(page.locator('[data-testid="participants-list"]')).toContainText('Test User');
    
    // Verify Monaco editor is loaded
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('should synchronize code changes in real-time', async ({ page, context }) => {
    // Create session
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Code Sync Test');
    await page.click('[data-testid="create-session-submit"]');
    
    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // Open second browser context (simulate second user)
    const page2 = await context.newPage();
    await page2.goto('/collaboration');
    
    // Join the same session
    await page2.click('[data-testid="join-session-button"]');
    await expect(page2.locator('.monaco-editor')).toBeVisible();
    
    // Type code in first editor
    const editor1 = page.locator('.monaco-editor textarea').first();
    await editor1.click();
    await editor1.type('pragma solidity ^0.8.0;\n\ncontract TestContract {\n');
    
    // Verify code appears in second editor
    await expect(page2.locator('.monaco-editor')).toContainText('pragma solidity ^0.8.0');
    await expect(page2.locator('.monaco-editor')).toContainText('contract TestContract');
    
    // Type in second editor
    const editor2 = page2.locator('.monaco-editor textarea').first();
    await editor2.click();
    await editor2.press('End');
    await editor2.type('\n    uint256 public value;\n}');
    
    // Verify changes appear in first editor
    await expect(page.locator('.monaco-editor')).toContainText('uint256 public value');
    
    await page2.close();
  });

  test('should show user cursors and selections', async ({ page, context }) => {
    // Create and join session with two users
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Cursor Test');
    await page.click('[data-testid="create-session-submit"]');
    
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    const page2 = await context.newPage();
    await page2.goto('/collaboration');
    await page2.click('[data-testid="join-session-button"]');
    await expect(page2.locator('.monaco-editor')).toBeVisible();
    
    // Click in editor to position cursor
    await page.locator('.monaco-editor textarea').first().click();
    
    // Verify cursor indicators appear
    await expect(page2.locator('[data-testid="user-cursor"]')).toBeVisible({ timeout: 5000 });
    
    // Select text in first editor
    await page.locator('.monaco-editor textarea').first().selectText();
    
    // Verify selection indicators appear in second editor
    await expect(page2.locator('[data-testid="user-selection"]')).toBeVisible({ timeout: 5000 });
    
    await page2.close();
  });

  test('should handle live chat functionality', async ({ page }) => {
    // Create session
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Chat Test');
    await page.click('[data-testid="create-session-submit"]');
    
    // Verify chat component is visible
    await expect(page.locator('[data-testid="live-chat"]')).toBeVisible();
    
    // Send a message
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Hello from E2E test!');
    await page.click('[data-testid="send-message-button"]');
    
    // Verify message appears in chat
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Hello from E2E test!');
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Test User');
    
    // Test message reactions
    const message = page.locator('[data-testid="chat-message"]').first();
    await message.hover();
    await page.click('[data-testid="add-reaction-button"]');
    await page.click('[data-testid="emoji-👍"]');
    
    // Verify reaction appears
    await expect(message.locator('[data-testid="message-reactions"]')).toContainText('👍');
  });

  test('should display user presence and activity', async ({ page, context }) => {
    // Create session
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Presence Test');
    await page.click('[data-testid="create-session-submit"]');
    
    // Verify presence component
    await expect(page.locator('[data-testid="user-presence"]')).toBeVisible();
    await expect(page.locator('[data-testid="online-users-count"]')).toContainText('1');
    
    // Add second user
    const page2 = await context.newPage();
    await page2.goto('/collaboration');
    await page2.click('[data-testid="join-session-button"]');
    
    // Verify user count updates
    await expect(page.locator('[data-testid="online-users-count"]')).toContainText('2');
    
    // Verify user appears in presence list
    await expect(page.locator('[data-testid="presence-list"]')).toContainText('Test User');
    
    // Test typing indicators
    await page2.locator('.monaco-editor textarea').first().type('typing...');
    
    // Verify typing indicator appears
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="typing-indicator"]')).toContainText('typing');
    
    await page2.close();
    
    // Verify user count decreases
    await expect(page.locator('[data-testid="online-users-count"]')).toContainText('1', { timeout: 10000 });
  });

  test('should handle session permissions and moderation', async ({ page }) => {
    // Create session as owner
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Moderation Test');
    await page.click('[data-testid="create-session-submit"]');
    
    // Verify owner controls are visible
    await expect(page.locator('[data-testid="session-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="manage-participants"]')).toBeVisible();
    
    // Test session settings
    await page.click('[data-testid="session-settings"]');
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();
    
    // Update session settings
    await page.fill('[data-testid="max-participants-input"]', '10');
    await page.check('[data-testid="allow-anonymous-checkbox"]');
    await page.click('[data-testid="save-settings-button"]');
    
    // Verify settings saved
    await expect(page.locator('[data-testid="settings-modal"]')).not.toBeVisible();
    
    // Test participant management
    await page.click('[data-testid="manage-participants"]');
    await expect(page.locator('[data-testid="participants-modal"]')).toBeVisible();
  });

  test('should save and restore session state', async ({ page }) => {
    // Create session with code
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Persistence Test');
    await page.click('[data-testid="create-session-submit"]');
    
    // Add code to editor
    const editor = page.locator('.monaco-editor textarea').first();
    await editor.click();
    await editor.type('pragma solidity ^0.8.0;\n\ncontract PersistenceTest {\n    uint256 public testValue = 42;\n}');
    
    // Save session
    await page.click('[data-testid="save-session-button"]');
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Verify session and code are restored
    await expect(page.locator('.monaco-editor')).toContainText('pragma solidity ^0.8.0');
    await expect(page.locator('.monaco-editor')).toContainText('contract PersistenceTest');
    await expect(page.locator('.monaco-editor')).toContainText('testValue = 42');
  });

  test('should handle network disconnection gracefully', async ({ page }) => {
    // Create session
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Network Test');
    await page.click('[data-testid="create-session-submit"]');
    
    // Verify connected state
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
    
    // Simulate network disconnection
    await page.context().setOffline(true);
    
    // Verify disconnected state
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Disconnected', { timeout: 10000 });
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Try to type while offline
    const editor = page.locator('.monaco-editor textarea').first();
    await editor.click();
    await editor.type('// Offline edit');
    
    // Verify offline changes are queued
    await expect(page.locator('[data-testid="pending-changes"]')).toBeVisible();
    
    // Restore network connection
    await page.context().setOffline(false);
    
    // Verify reconnection
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected', { timeout: 15000 });
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    
    // Verify pending changes are synced
    await expect(page.locator('[data-testid="pending-changes"]')).not.toBeVisible({ timeout: 5000 });
  });
});
