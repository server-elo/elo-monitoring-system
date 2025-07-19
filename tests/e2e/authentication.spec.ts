import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for authentication flows
 * Tests GitHub/Google OAuth, session management, and user registration/login
 */

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean session
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should display sign in page correctly', async ({ page }) => {
    // Navigate to sign in
    await page.goto('/auth/signin');
    
    // Verify page elements
    await expect(page).toHaveTitle(/Sign In/);
    await expect(page.locator('[data-testid="signin-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="github-signin-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="google-signin-button"]')).toBeVisible();
    
    // Verify branding and messaging
    await expect(page.locator('[data-testid="app-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="signin-title"]')).toContainText('Sign in to Solidity Learning Platform');
    
    // Verify links
    await expect(page.locator('[data-testid="signup-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="forgot-password-link"]')).toBeVisible();
  });

  test('should handle GitHub OAuth flow', async ({ page }) => {
    // Mock GitHub OAuth
    await page.route('**/api/auth/signin/github', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://github.com/login/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/auth/callback/github'
        }
      });
    });

    await page.route('**/api/auth/callback/github**', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard',
          'Set-Cookie': 'next-auth.session-token=mock-session-token; Path=/; HttpOnly; SameSite=Lax'
        }
      });
    });

    // Navigate to sign in
    await page.goto('/auth/signin');
    
    // Click GitHub sign in
    await page.click('[data-testid="github-signin-button"]');
    
    // Should redirect to GitHub (mocked)
    await expect(page).toHaveURL(/github\.com\/login\/oauth\/authorize/);
    
    // Simulate successful OAuth callback
    await page.goto('/api/auth/callback/github?code=mock-auth-code');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle Google OAuth flow', async ({ page }) => {
    // Mock Google OAuth
    await page.route('**/api/auth/signin/google', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/auth/callback/google'
        }
      });
    });

    await page.route('**/api/auth/callback/google**', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard',
          'Set-Cookie': 'next-auth.session-token=mock-session-token; Path=/; HttpOnly; SameSite=Lax'
        }
      });
    });

    // Navigate to sign in
    await page.goto('/auth/signin');
    
    // Click Google sign in
    await page.click('[data-testid="google-signin-button"]');
    
    // Should redirect to Google (mocked)
    await expect(page).toHaveURL(/accounts\.google\.com\/oauth\/authorize/);
    
    // Simulate successful OAuth callback
    await page.goto('/api/auth/callback/google?code=mock-auth-code');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle email/password registration', async ({ page }) => {
    // Mock registration API
    await page.route('/api/auth/register', async route => {
      const request = route.request();
      const body = await request.postDataJSON();
      
      if (body.email === 'newuser@test.com') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'new-user-id',
              email: 'newuser@test.com',
              name: 'New User'
            }
          })
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Email already exists'
          })
        });
      }
    });

    // Navigate to registration
    await page.goto('/auth/register');
    
    // Fill registration form
    await page.fill('[data-testid="name-input"]', 'New User');
    await page.fill('[data-testid="email-input"]', 'newuser@test.com');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePassword123!');
    
    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Registration successful');
    
    // Should redirect to email verification page
    await expect(page).toHaveURL('/auth/verify-email');
  });

  test('should validate registration form inputs', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Test empty form submission
    await page.click('[data-testid="register-button"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
    
    // Test invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    
    // Test weak password
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters');
    
    // Test password mismatch
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('Passwords do not match');
  });

  test('should handle email/password login', async ({ page }) => {
    // Mock login API
    await page.route('/api/auth/signin/credentials', async route => {
      const request = route.request();
      const body = await request.postDataJSON();
      
      if (body.email === 'test@example.com' && body.password === 'correctpassword') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User'
            }
          }),
          headers: {
            'Set-Cookie': 'next-auth.session-token=mock-session-token; Path=/; HttpOnly; SameSite=Lax'
          }
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid credentials'
          })
        });
      }
    });

    await page.goto('/auth/signin');
    
    // Test invalid credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="signin-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    
    // Test valid credentials
    await page.fill('[data-testid="password-input"]', 'correctpassword');
    await page.click('[data-testid="signin-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle password reset flow', async ({ page }) => {
    // Mock password reset API
    await page.route('/api/auth/forgot-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password reset email sent'
        })
      });
    });

    await page.goto('/auth/forgot-password');
    
    // Fill email
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.click('[data-testid="reset-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent');
    
    // Test reset token validation
    await page.goto('/auth/reset-password?token=valid-token');
    await expect(page.locator('[data-testid="reset-form"]')).toBeVisible();
    
    // Test invalid token
    await page.goto('/auth/reset-password?token=invalid-token');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid or expired token');
  });

  test('should handle session management', async ({ page }) => {
    // Mock session API
    await page.route('/api/auth/session', async route => {
      const cookies = route.request().headers()['cookie'] || '';
      
      if (cookies.includes('next-auth.session-token=valid-token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User',
              image: 'https://example.com/avatar.jpg'
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No session' })
        });
      }
    });

    // Set valid session cookie
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'valid-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/dashboard');
    
    // Verify authenticated state
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Test User');
    
    // Test logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/auth/signin');
    await expect(page.locator('[data-testid="signin-form"]')).toBeVisible();
    
    // Test with expired session
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'expired-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should handle concurrent sessions', async ({ page, context }) => {
    // Mock session API for multiple sessions
    await page.route('/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });

    // Set up first session
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'session-1',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Create second browser context (different session)
    const context2 = await context.browser()?.newContext();
    const page2 = await context2!.newPage();
    
    await page2.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'session-2',
      domain: 'localhost',
      path: '/'
    }]);

    await page2.goto('/dashboard');
    await expect(page2.locator('[data-testid="user-menu"]')).toBeVisible();

    // Both sessions should work independently
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Test User');
    await expect(page2.locator('[data-testid="user-name"]')).toContainText('Test User');

    await page2.close();
    await context2?.close();
  });

  test('should handle CSRF protection', async ({ page }) => {
    // Mock CSRF token endpoint
    await page.route('/api/auth/csrf', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          csrfToken: 'mock-csrf-token'
        })
      });
    });

    await page.goto('/auth/signin');
    
    // Verify CSRF token is included in forms
    const csrfInput = page.locator('input[name="csrfToken"]');
    await expect(csrfInput).toBeHidden(); // Should be hidden input
    await expect(csrfInput).toHaveValue('mock-csrf-token');
    
    // Test form submission includes CSRF token
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    
    // Intercept form submission to verify CSRF token
    let csrfTokenSent = '';
    await page.route('/api/auth/signin/credentials', async route => {
      const formData = await route.request().postData();
      csrfTokenSent = new URLSearchParams(formData!).get('csrfToken') || '';
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.click('[data-testid="signin-button"]');
    expect(csrfTokenSent).toBe('mock-csrf-token');
  });
});
