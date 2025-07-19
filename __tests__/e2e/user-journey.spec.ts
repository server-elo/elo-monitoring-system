import { test, expect, Page } from '@playwright/test';

test.describe('Complete User Learning Journey', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let userEmail: string;
  let userPassword: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    userEmail = `journey-test-${Date.now()}@example.com`;
    userPassword = 'JourneyTest123!';
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should complete full user registration and onboarding', async () => {
    // Navigate to landing page
    await page.goto('/');
    
    // Verify landing page loads correctly
    await expect(page).toHaveTitle(/Solidity Learning Platform/);
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    
    // Navigate to registration
    await page.click('[data-testid="get-started-button"]');
    await expect(page).toHaveURL(/.*\/auth\/register/);
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', userEmail);
    await page.fill('[data-testid="password-input"]', userPassword);
    await page.fill('[data-testid="confirm-password-input"]', userPassword);
    await page.fill('[data-testid="name-input"]', 'Journey Test User');
    await page.check('[data-testid="accept-terms-checkbox"]');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Verify successful registration and redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    
    // Verify user profile information
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Journey Test User');
    await expect(page.locator('[data-testid="user-email"]')).toContainText(userEmail);
    
    // Check initial XP and level
    await expect(page.locator('[data-testid="user-xp"]')).toContainText('0');
    await expect(page.locator('[data-testid="user-level"]')).toContainText('1');
  });

  test('should navigate through course catalog and select a course', async () => {
    // Navigate to courses
    await page.click('[data-testid="courses-nav-link"]');
    await expect(page).toHaveURL(/.*\/courses/);
    
    // Verify courses page loads
    await expect(page.locator('[data-testid="courses-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="course-card"]').first()).toBeVisible();
    
    // Filter courses by difficulty
    await page.selectOption('[data-testid="difficulty-filter"]', 'BEGINNER');
    await page.waitForTimeout(1000); // Wait for filter to apply
    
    // Verify filtered results
    const courseCards = page.locator('[data-testid="course-card"]');
    await expect(courseCards.first()).toBeVisible();
    
    // Select first beginner course
    await courseCards.first().click();
    
    // Verify course details page
    await expect(page.locator('[data-testid="course-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="course-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="course-lessons-list"]')).toBeVisible();
    
    // Enroll in course
    await page.click('[data-testid="enroll-button"]');
    
    // Verify enrollment success
    await expect(page.locator('[data-testid="enrollment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-learning-button"]')).toBeVisible();
  });

  test('should complete first lesson and track progress', async () => {
    // Start first lesson
    await page.click('[data-testid="start-learning-button"]');
    
    // Verify lesson page loads
    await expect(page.locator('[data-testid="lesson-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-progress-bar"]')).toBeVisible();
    
    // Read through lesson content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for reading progress to be tracked
    await page.waitForTimeout(2000);
    
    // Verify progress is tracked
    const progressBar = page.locator('[data-testid="lesson-progress-bar"]');
    await expect(progressBar).toHaveAttribute('aria-valuenow', /[1-9]/);
    
    // Complete lesson
    await page.click('[data-testid="complete-lesson-button"]');
    
    // Verify lesson completion
    await expect(page.locator('[data-testid="lesson-completed-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="xp-earned"]')).toBeVisible();
    
    // Check XP reward
    const xpEarned = await page.locator('[data-testid="xp-earned"]').textContent();
    expect(parseInt(xpEarned || '0')).toBeGreaterThan(0);
    
    // Close completion modal
    await page.click('[data-testid="continue-button"]');
    
    // Verify navigation to next lesson or course overview
    await expect(page.locator('[data-testid="next-lesson"]').or(page.locator('[data-testid="course-overview"]'))).toBeVisible();
  });

  test('should unlock and view achievement', async () => {
    // Navigate to achievements page
    await page.click('[data-testid="achievements-nav-link"]');
    await expect(page).toHaveURL(/.*\/achievements/);
    
    // Verify achievements page loads
    await expect(page.locator('[data-testid="achievements-header"]')).toBeVisible();
    
    // Check for unlocked achievements
    const unlockedAchievements = page.locator('[data-testid="achievement-unlocked"]');
    
    if (await unlockedAchievements.count() > 0) {
      // Click on first unlocked achievement
      await unlockedAchievements.first().click();
      
      // Verify achievement details modal
      await expect(page.locator('[data-testid="achievement-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="achievement-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="achievement-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="achievement-xp-reward"]')).toBeVisible();
      
      // Close modal
      await page.click('[data-testid="close-modal-button"]');
    }
    
    // Verify locked achievements are shown
    const lockedAchievements = page.locator('[data-testid="achievement-locked"]');
    await expect(lockedAchievements.first()).toBeVisible();
  });

  test('should update user profile and preferences', async () => {
    // Navigate to profile
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="profile-menu-item"]');
    await expect(page).toHaveURL(/.*\/profile/);
    
    // Verify profile page loads
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();
    
    // Update profile information
    await page.fill('[data-testid="display-name-input"]', 'Updated Journey User');
    await page.selectOption('[data-testid="timezone-select"]', 'America/New_York');
    
    // Update preferences
    await page.check('[data-testid="email-notifications-checkbox"]');
    await page.uncheck('[data-testid="push-notifications-checkbox"]');
    await page.selectOption('[data-testid="theme-select"]', 'dark');
    
    // Save changes
    await page.click('[data-testid="save-profile-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="profile-updated-message"]')).toBeVisible();
    
    // Verify changes are reflected
    await expect(page.locator('[data-testid="display-name-input"]')).toHaveValue('Updated Journey User');
    await expect(page.locator('[data-testid="timezone-select"]')).toHaveValue('America/New_York');
  });

  test('should view learning progress and statistics', async () => {
    // Navigate to progress page
    await page.click('[data-testid="progress-nav-link"]');
    await expect(page).toHaveURL(/.*\/progress/);
    
    // Verify progress page loads
    await expect(page.locator('[data-testid="progress-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-overview"]')).toBeVisible();
    
    // Check progress statistics
    await expect(page.locator('[data-testid="total-xp"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-level"]')).toBeVisible();
    await expect(page.locator('[data-testid="lessons-completed"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-streak"]')).toBeVisible();
    
    // Verify progress chart is displayed
    await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
    
    // Check recent activity
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    const activityItems = page.locator('[data-testid="activity-item"]');
    
    if (await activityItems.count() > 0) {
      await expect(activityItems.first()).toBeVisible();
    }
    
    // Verify learning streak information
    await expect(page.locator('[data-testid="streak-info"]')).toBeVisible();
  });

  test('should search for lessons and filter results', async () => {
    // Navigate to lessons
    await page.click('[data-testid="lessons-nav-link"]');
    await expect(page).toHaveURL(/.*\/lessons/);
    
    // Verify lessons page loads
    await expect(page.locator('[data-testid="lessons-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    
    // Search for lessons
    await page.fill('[data-testid="search-input"]', 'solidity');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = page.locator('[data-testid="lesson-card"]');
    await expect(searchResults.first()).toBeVisible();
    
    // Apply filters
    await page.selectOption('[data-testid="difficulty-filter"]', 'BEGINNER');
    await page.selectOption('[data-testid="type-filter"]', 'THEORY');
    
    // Wait for filters to apply
    await page.waitForTimeout(1000);
    
    // Verify filtered results
    const filteredResults = page.locator('[data-testid="lesson-card"]');
    await expect(filteredResults.first()).toBeVisible();
    
    // Clear search and filters
    await page.fill('[data-testid="search-input"]', '');
    await page.selectOption('[data-testid="difficulty-filter"]', '');
    await page.selectOption('[data-testid="type-filter"]', '');
    
    // Verify all lessons are shown again
    await page.waitForTimeout(1000);
    const allLessons = page.locator('[data-testid="lesson-card"]');
    expect(await allLessons.count()).toBeGreaterThan(0);
  });

  test('should handle logout and login flow', async () => {
    // Logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-menu-item"]');
    
    // Verify redirect to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Login with same credentials
    await page.fill('[data-testid="email-input"]', userEmail);
    await page.fill('[data-testid="password-input"]', userPassword);
    await page.click('[data-testid="login-button"]');
    
    // Verify successful login and redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    
    // Verify user data is preserved
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Updated Journey User');
    
    // Check that progress is maintained
    const xpValue = await page.locator('[data-testid="user-xp"]').textContent();
    expect(parseInt(xpValue || '0')).toBeGreaterThan(0);
  });

  test('should handle responsive design on mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
    
    // Navigate using mobile menu
    await page.click('[data-testid="mobile-courses-link"]');
    await expect(page).toHaveURL(/.*\/courses/);
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="course-card"]')).toBeVisible();
    
    // Test mobile course card interaction
    await page.locator('[data-testid="course-card"]').first().click();
    await expect(page.locator('[data-testid="course-title"]')).toBeVisible();
    
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
