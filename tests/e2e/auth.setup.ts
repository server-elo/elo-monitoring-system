import { test as setup, expect } from '@playwright/test';

/**
 * Authentication setup for E2E tests
 * Creates authenticated sessions for different user types
 */

const authFile = 'tests/auth/user.json';

setup('authenticate as test user', async ({ page }) => {
  console.log('🔐 Setting up authentication for test user...');

  // Navigate to the application
  await page.goto('/');

  // Check if already authenticated
  const isAuthenticated = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
  
  if (isAuthenticated) {
    console.log('✅ Already authenticated');
    await page.context().storageState({ path: authFile });
    return;
  }

  // Navigate to sign in page
  await page.goto('/auth/signin');

  // Wait for the page to load
  await expect(page).toHaveTitle(/Sign In/);

  // Mock authentication by setting session data
  await page.evaluate(() => {
    // Mock NextAuth session
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@soliditylearn.com',
        name: 'Test User',
        username: 'testuser',
        image: 'https://avatars.githubusercontent.com/u/1?v=4',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // Set session in localStorage
    localStorage.setItem('test-session', JSON.stringify(mockSession));
    
    // Mock authentication cookies
    document.cookie = `next-auth.session-token=test-session-token; path=/; secure; samesite=lax; max-age=86400`;
    document.cookie = `next-auth.csrf-token=test-csrf-token; path=/; secure; samesite=lax; max-age=86400`;
    
    // Trigger session update
    window.dispatchEvent(new Event('storage'));
  });

  // Navigate to dashboard to verify authentication
  await page.goto('/dashboard');

  // Verify authentication worked
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=Test User')).toBeVisible();

  console.log('✅ Authentication setup completed');

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup('setup test data', async ({ page }) => {
  console.log('📊 Setting up test data...');

  // Navigate to dashboard
  await page.goto('/dashboard');

  // Verify we're authenticated
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  // Create test collaboration session if it doesn't exist
  const hasCollabSession = await page.locator('[data-testid="collaboration-session"]').isVisible().catch(() => false);
  
  if (!hasCollabSession) {
    // Navigate to collaboration page
    await page.goto('/collaboration');
    
    // Create new session
    const createButton = page.locator('[data-testid="create-session-button"]');
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      
      // Fill session details
      await page.fill('[data-testid="session-title"]', 'Test Collaboration Session');
      await page.fill('[data-testid="session-description"]', 'E2E test collaboration session');
      
      // Create session
      await page.click('[data-testid="create-session-submit"]');
      
      // Wait for session to be created
      await expect(page.locator('[data-testid="collaboration-editor"]')).toBeVisible({ timeout: 10000 });
    }
  }

  console.log('✅ Test data setup completed');
});

setup('verify application health', async ({ page }) => {
  console.log('🏥 Verifying application health...');

  // Check health endpoint
  const response = await page.request.get('/api/health');
  expect(response.status()).toBe(200);
  
  const health = await response.json();
  expect(health.status).toBe('healthy');
  
  console.log('✅ Application health verified');

  // Check main pages load correctly
  const pages = [
    { path: '/', title: /Solidity Learning/ },
    { path: '/dashboard', title: /Dashboard/ },
    { path: '/lessons', title: /Lessons/ },
    { path: '/collaboration', title: /Collaboration/ },
  ];

  for (const { path, title } of pages) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    
    // Check for no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(1000);
    
    if (errors.length > 0) {
      console.warn(`⚠️ Console errors on ${path}:`, errors);
    }
  }

  console.log('✅ Page health verification completed');
});
