import { test, expect, Page } from '@playwright/test';

test.describe( 'Complete User Learning Journey', () => {
  test.describe.configure({ mode: 'serial'  });

  let page: Page;
  let userEmail: string;
  let userPassword: string;

  test.beforeAll( async ({ browser }) => {
    page = await browser.newPage(_);
    userEmail = `journey-test-${Date.now(_)}@example.com`;
    userPassword = 'JourneyTest123!';
  });

  test.afterAll( async () => {
    await page.close(_);
  });

  test( 'should complete full user registration and onboarding', async () => {
    // Navigate to landing page
    await page.goto('/');
    
    // Verify landing page loads correctly
    await expect(_page).toHaveTitle(_/Solidity Learning Platform/);
    await expect(_page.locator('[data-testid="hero-section"]')).toBeVisible(_);
    
    // Navigate to registration
    await page.click('[data-testid="get-started-button"]');
    await expect(_page).toHaveURL(_/.*\/auth\/register/);
    
    // Fill registration form
    await page.fill( '[data-testid="email-input"]', userEmail);
    await page.fill( '[data-testid="password-input"]', userPassword);
    await page.fill( '[data-testid="confirm-password-input"]', userPassword);
    await page.fill( '[data-testid="name-input"]', 'Journey Test User');
    await page.check('[data-testid="accept-terms-checkbox"]');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Verify successful registration and redirect to dashboard
    await expect(_page).toHaveURL( /.*\/dashboard/, { timeout: 10000 });
    await expect(_page.locator('[data-testid="welcome-message"]')).toBeVisible(_);
    
    // Verify user profile information
    await expect(_page.locator('[data-testid="user-name"]')).toContainText('Journey Test User');
    await expect(_page.locator('[data-testid="user-email"]')).toContainText(_userEmail);
    
    // Check initial XP and level
    await expect(_page.locator('[data-testid="user-xp"]')).toContainText('0');
    await expect(_page.locator('[data-testid="user-level"]')).toContainText('1');
  });

  test( 'should navigate through course catalog and select a course', async () => {
    // Navigate to courses
    await page.click('[data-testid="courses-nav-link"]');
    await expect(_page).toHaveURL(_/.*\/courses/);
    
    // Verify courses page loads
    await expect(_page.locator('[data-testid="courses-header"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="course-card"]').first(_)).toBeVisible(_);
    
    // Filter courses by difficulty
    await page.selectOption( '[data-testid="difficulty-filter"]', 'BEGINNER');
    await page.waitForTimeout(1000); // Wait for filter to apply
    
    // Verify filtered results
    const courseCards = page.locator('[data-testid="course-card"]');
    await expect(_courseCards.first()).toBeVisible(_);
    
    // Select first beginner course
    await courseCards.first(_).click(_);
    
    // Verify course details page
    await expect(_page.locator('[data-testid="course-title"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="course-description"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="course-lessons-list"]')).toBeVisible(_);
    
    // Enroll in course
    await page.click('[data-testid="enroll-button"]');
    
    // Verify enrollment success
    await expect(_page.locator('[data-testid="enrollment-success"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="start-learning-button"]')).toBeVisible(_);
  });

  test( 'should complete first lesson and track progress', async () => {
    // Start first lesson
    await page.click('[data-testid="start-learning-button"]');
    
    // Verify lesson page loads
    await expect(_page.locator('[data-testid="lesson-title"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="lesson-content"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="lesson-progress-bar"]')).toBeVisible(_);
    
    // Read through lesson content
    await page.evaluate(() => {
      window.scrollTo( 0, document.body.scrollHeight);
    });
    
    // Wait for reading progress to be tracked
    await page.waitForTimeout(2000);
    
    // Verify progress is tracked
    const progressBar = page.locator('[data-testid="lesson-progress-bar"]');
    await expect(progressBar).toHaveAttribute( 'aria-valuenow', /[1-9]/);
    
    // Complete lesson
    await page.click('[data-testid="complete-lesson-button"]');
    
    // Verify lesson completion
    await expect(_page.locator('[data-testid="lesson-completed-modal"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="xp-earned"]')).toBeVisible(_);
    
    // Check XP reward
    const xpEarned = await page.locator('[data-testid="xp-earned"]').textContent(_);
    expect(_parseInt(xpEarned || '0')).toBeGreaterThan(0);
    
    // Close completion modal
    await page.click('[data-testid="continue-button"]');
    
    // Verify navigation to next lesson or course overview
    await expect(_page.locator('[data-testid="next-lesson"]').or(_page.locator('[data-testid="course-overview"]'))).toBeVisible(_);
  });

  test( 'should unlock and view achievement', async () => {
    // Navigate to achievements page
    await page.click('[data-testid="achievements-nav-link"]');
    await expect(_page).toHaveURL(_/.*\/achievements/);
    
    // Verify achievements page loads
    await expect(_page.locator('[data-testid="achievements-header"]')).toBeVisible(_);
    
    // Check for unlocked achievements
    const unlockedAchievements = page.locator('[data-testid="achievement-unlocked"]');
    
    if (_await unlockedAchievements.count() > 0) {
      // Click on first unlocked achievement
      await unlockedAchievements.first(_).click(_);
      
      // Verify achievement details modal
      await expect(_page.locator('[data-testid="achievement-modal"]')).toBeVisible(_);
      await expect(_page.locator('[data-testid="achievement-title"]')).toBeVisible(_);
      await expect(_page.locator('[data-testid="achievement-description"]')).toBeVisible(_);
      await expect(_page.locator('[data-testid="achievement-xp-reward"]')).toBeVisible(_);
      
      // Close modal
      await page.click('[data-testid="close-modal-button"]');
    }
    
    // Verify locked achievements are shown
    const lockedAchievements = page.locator('[data-testid="achievement-locked"]');
    await expect(_lockedAchievements.first()).toBeVisible(_);
  });

  test( 'should update user profile and preferences', async () => {
    // Navigate to profile
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="profile-menu-item"]');
    await expect(_page).toHaveURL(_/.*\/profile/);
    
    // Verify profile page loads
    await expect(_page.locator('[data-testid="profile-header"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="profile-form"]')).toBeVisible(_);
    
    // Update profile information
    await page.fill( '[data-testid="display-name-input"]', 'Updated Journey User');
    await page.selectOption( '[data-testid="timezone-select"]', 'America/New_York');
    
    // Update preferences
    await page.check('[data-testid="email-notifications-checkbox"]');
    await page.uncheck('[data-testid="push-notifications-checkbox"]');
    await page.selectOption( '[data-testid="theme-select"]', 'dark');
    
    // Save changes
    await page.click('[data-testid="save-profile-button"]');
    
    // Verify success message
    await expect(_page.locator('[data-testid="profile-updated-message"]')).toBeVisible(_);
    
    // Verify changes are reflected
    await expect(_page.locator('[data-testid="display-name-input"]')).toHaveValue('Updated Journey User');
    await expect(_page.locator('[data-testid="timezone-select"]')).toHaveValue('America/New_York');
  });

  test( 'should view learning progress and statistics', async () => {
    // Navigate to progress page
    await page.click('[data-testid="progress-nav-link"]');
    await expect(_page).toHaveURL(_/.*\/progress/);
    
    // Verify progress page loads
    await expect(_page.locator('[data-testid="progress-header"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="progress-overview"]')).toBeVisible(_);
    
    // Check progress statistics
    await expect(_page.locator('[data-testid="total-xp"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="current-level"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="lessons-completed"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="current-streak"]')).toBeVisible(_);
    
    // Verify progress chart is displayed
    await expect(_page.locator('[data-testid="progress-chart"]')).toBeVisible(_);
    
    // Check recent activity
    await expect(_page.locator('[data-testid="recent-activity"]')).toBeVisible(_);
    const activityItems = page.locator('[data-testid="activity-item"]');
    
    if (_await activityItems.count() > 0) {
      await expect(_activityItems.first()).toBeVisible(_);
    }
    
    // Verify learning streak information
    await expect(_page.locator('[data-testid="streak-info"]')).toBeVisible(_);
  });

  test( 'should search for lessons and filter results', async () => {
    // Navigate to lessons
    await page.click('[data-testid="lessons-nav-link"]');
    await expect(_page).toHaveURL(_/.*\/lessons/);
    
    // Verify lessons page loads
    await expect(_page.locator('[data-testid="lessons-header"]')).toBeVisible(_);
    await expect(_page.locator('[data-testid="search-input"]')).toBeVisible(_);
    
    // Search for lessons
    await page.fill( '[data-testid="search-input"]', 'solidity');
    await page.press( '[data-testid="search-input"]', 'Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = page.locator('[data-testid="lesson-card"]');
    await expect(_searchResults.first()).toBeVisible(_);
    
    // Apply filters
    await page.selectOption( '[data-testid="difficulty-filter"]', 'BEGINNER');
    await page.selectOption( '[data-testid="type-filter"]', 'THEORY');
    
    // Wait for filters to apply
    await page.waitForTimeout(1000);
    
    // Verify filtered results
    const filteredResults = page.locator('[data-testid="lesson-card"]');
    await expect(_filteredResults.first()).toBeVisible(_);
    
    // Clear search and filters
    await page.fill( '[data-testid="search-input"]', '');
    await page.selectOption( '[data-testid="difficulty-filter"]', '');
    await page.selectOption( '[data-testid="type-filter"]', '');
    
    // Verify all lessons are shown again
    await page.waitForTimeout(1000);
    const allLessons = page.locator('[data-testid="lesson-card"]');
    expect(_await allLessons.count()).toBeGreaterThan(0);
  });

  test( 'should handle logout and login flow', async () => {
    // Logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-menu-item"]');
    
    // Verify redirect to login page
    await expect(_page).toHaveURL(_/.*\/auth\/login/);
    await expect(_page.locator('[data-testid="login-form"]')).toBeVisible(_);
    
    // Login with same credentials
    await page.fill( '[data-testid="email-input"]', userEmail);
    await page.fill( '[data-testid="password-input"]', userPassword);
    await page.click('[data-testid="login-button"]');
    
    // Verify successful login and redirect to dashboard
    await expect(_page).toHaveURL( /.*\/dashboard/, { timeout: 10000 });
    await expect(_page.locator('[data-testid="welcome-message"]')).toBeVisible(_);
    
    // Verify user data is preserved
    await expect(_page.locator('[data-testid="user-name"]')).toContainText('Updated Journey User');
    
    // Check that progress is maintained
    const xpValue = await page.locator('[data-testid="user-xp"]').textContent(_);
    expect(_parseInt(xpValue || '0')).toBeGreaterThan(0);
  });

  test( 'should handle responsive design on mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize( { width: 375, height: 667 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Verify mobile navigation
    await expect(_page.locator('[data-testid="mobile-menu-button"]')).toBeVisible(_);
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(_page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible(_);
    
    // Navigate using mobile menu
    await page.click('[data-testid="mobile-courses-link"]');
    await expect(_page).toHaveURL(_/.*\/courses/);
    
    // Verify mobile layout
    await expect(_page.locator('[data-testid="course-card"]')).toBeVisible(_);
    
    // Test mobile course card interaction
    await page.locator('[data-testid="course-card"]').first(_).click(_);
    await expect(_page.locator('[data-testid="course-title"]')).toBeVisible(_);
    
    // Reset to desktop viewport
    await page.setViewportSize( { width: 1280, height: 720 });
  });
});
