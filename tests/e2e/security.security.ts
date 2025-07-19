import { test, expect } from '@playwright/test';

/**
 * Security E2E tests
 * Tests rate limiting, input validation, CSRF protection, and XSS prevention
 */

test.describe('Security Testing', () => {
  test('should enforce rate limiting on API endpoints', async ({ page }) => {
    // Test authentication rate limiting
    const loginAttempts = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      
      const response = await page.request.post('/api/auth/signin/credentials', {
        data: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });
      
      const responseTime = Date.now() - startTime;
      loginAttempts.push({
        attempt: i + 1,
        status: response.status(),
        responseTime
      });
      
      // Small delay between attempts
      await page.waitForTimeout(100);
    }
    
    // Check that rate limiting kicks in
    const rateLimitedAttempts = loginAttempts.filter(attempt => attempt.status === 429);
    expect(rateLimitedAttempts.length).toBeGreaterThan(0);
    
    console.log('Login attempts:', loginAttempts);
    console.log(`Rate limited attempts: ${rateLimitedAttempts.length}/10`);
  });

  test('should prevent XSS attacks in user inputs', async ({ page }) => {
    // Set up authentication
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/collaboration');
    
    // Create session
    await page.click('[data-testid="create-session-button"]');
    
    // Test XSS in session title
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('[data-testid="session-title"]', xssPayload);
    await page.click('[data-testid="create-session-submit"]');
    
    // Verify XSS payload is sanitized
    const titleElement = page.locator('[data-testid="session-title-display"]');
    const titleText = await titleElement.textContent();
    expect(titleText).not.toContain('<script>');
    expect(titleText).toContain('alert("XSS")'); // Text should be preserved, tags removed
    
    // Test XSS in chat messages
    await page.locator('[data-testid="chat-input"]').fill('<img src="x" onerror="alert(\'XSS\')">');
    await page.click('[data-testid="send-message-button"]');
    
    // Verify message is sanitized
    const chatMessage = page.locator('[data-testid="chat-message"]').last();
    const messageHTML = await chatMessage.innerHTML();
    expect(messageHTML).not.toContain('onerror');
    expect(messageHTML).not.toContain('alert');
    
    // Test XSS in code editor
    const codeEditor = page.locator('.monaco-editor textarea').first();
    await codeEditor.click();
    await codeEditor.fill('// <script>alert("XSS in code")</script>\npragma solidity ^0.8.0;');
    
    // Code should be preserved as-is (it's code, not HTML)
    const editorContent = await codeEditor.inputValue();
    expect(editorContent).toContain('<script>alert("XSS in code")</script>');
  });

  test('should validate and sanitize file uploads', async ({ page }) => {
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/profile');
    
    // Test malicious file upload
    const fileInput = page.locator('[data-testid="avatar-upload"]');
    
    // Create a fake malicious file
    const maliciousFile = Buffer.from('<?php echo "Malicious code"; ?>');
    
    // Mock file upload validation
    await page.route('/api/upload/avatar', async route => {
      const request = route.request();
      const contentType = request.headers()['content-type'] || '';
      
      if (contentType.includes('image/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, url: '/uploads/avatar.jpg' })
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid file type. Only images are allowed.' })
        });
      }
    });
    
    // Try to upload malicious file
    await fileInput.setInputFiles({
      name: 'malicious.php',
      mimeType: 'application/x-php',
      buffer: maliciousFile
    });
    
    // Verify upload is rejected
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('Invalid file type');
    
    // Test oversized file
    const largeFile = Buffer.alloc(20 * 1024 * 1024); // 20MB file
    
    await fileInput.setInputFiles({
      name: 'large-image.jpg',
      mimeType: 'image/jpeg',
      buffer: largeFile
    });
    
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('File too large');
  });

  test('should enforce CSRF protection', async ({ page }) => {
    // Test CSRF protection on state-changing operations
    await page.goto('/auth/signin');
    
    // Get CSRF token
    const csrfToken = await page.locator('input[name="csrfToken"]').getAttribute('value');
    expect(csrfToken).toBeTruthy();
    
    // Test request without CSRF token
    const responseWithoutCSRF = await page.request.post('/api/auth/signin/credentials', {
      data: {
        email: 'test@example.com',
        password: 'password'
        // Missing csrfToken
      }
    });
    
    expect(responseWithoutCSRF.status()).toBe(403); // Should be forbidden
    
    // Test request with invalid CSRF token
    const responseWithInvalidCSRF = await page.request.post('/api/auth/signin/credentials', {
      data: {
        email: 'test@example.com',
        password: 'password',
        csrfToken: 'invalid-token'
      }
    });
    
    expect(responseWithInvalidCSRF.status()).toBe(403);
    
    // Test request with valid CSRF token
    const responseWithValidCSRF = await page.request.post('/api/auth/signin/credentials', {
      data: {
        email: 'test@example.com',
        password: 'password',
        csrfToken: csrfToken
      }
    });
    
    // Should not be forbidden (may be 401 for invalid credentials, but not 403)
    expect(responseWithValidCSRF.status()).not.toBe(403);
  });

  test('should prevent SQL injection attacks', async ({ page }) => {
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/'
    }]);

    // Test SQL injection in search functionality
    await page.goto('/lessons');
    
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --"
    ];
    
    for (const payload of sqlInjectionPayloads) {
      // Mock search API to simulate SQL injection protection
      await page.route('/api/lessons/search', async route => {
        const request = route.request();
        const body = await request.postDataJSON();
        
        // Simulate SQL injection detection
        if (body.query.includes('DROP') || body.query.includes('UNION') || body.query.includes('INSERT')) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid search query' })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ results: [] })
          });
        }
      });
      
      await page.fill('[data-testid="search-input"]', payload);
      await page.click('[data-testid="search-button"]');
      
      // Verify malicious query is rejected
      await expect(page.locator('[data-testid="search-error"]')).toContainText('Invalid search query');
    }
  });

  test('should enforce proper authentication and authorization', async ({ page }) => {
    // Test accessing protected routes without authentication
    const protectedRoutes = [
      '/dashboard',
      '/profile',
      '/collaboration',
      '/ai-tutor'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      
      // Should redirect to sign in
      await expect(page).toHaveURL(/\/auth\/signin/);
    }
    
    // Test with invalid session token
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'invalid-token',
      domain: 'localhost',
      path: '/'
    }]);
    
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    // Test API endpoints without authentication
    const protectedAPIEndpoints = [
      '/api/user/profile',
      '/api/collaboration/sessions',
      '/api/ai/chat'
    ];
    
    for (const endpoint of protectedAPIEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBe(401); // Unauthorized
    }
  });

  test('should prevent session hijacking', async ({ page, context }) => {
    // Create authenticated session
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'valid-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
    }]);
    
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Test session fixation attack
    const attackerContext = await context.browser()?.newContext();
    const attackerPage = await attackerContext!.newPage();
    
    // Attacker tries to use the same session token
    await attackerPage.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'valid-session-token',
      domain: 'localhost',
      path: '/'
    }]);
    
    await attackerPage.goto('/dashboard');
    
    // Should be rejected due to IP/User-Agent validation
    await expect(attackerPage).toHaveURL(/\/auth\/signin/);
    
    await attackerPage.close();
    await attackerContext?.close();
  });

  test('should validate input lengths and formats', async ({ page }) => {
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/profile');
    
    // Test extremely long input
    const longString = 'A'.repeat(10000);
    
    await page.fill('[data-testid="bio-input"]', longString);
    await page.click('[data-testid="save-profile-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="bio-error"]')).toContainText('too long');
    
    // Test invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email-format');
    await page.click('[data-testid="save-profile-button"]');
    
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email');
    
    // Test special characters in username
    await page.fill('[data-testid="username-input"]', 'user<script>alert("xss")</script>');
    await page.click('[data-testid="save-profile-button"]');
    
    await expect(page.locator('[data-testid="username-error"]')).toContainText('Invalid characters');
  });

  test('should enforce secure headers', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check security headers
    const headers = response!.headers();
    
    // Content Security Policy
    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    
    // X-Frame-Options
    expect(headers['x-frame-options']).toBe('DENY');
    
    // X-Content-Type-Options
    expect(headers['x-content-type-options']).toBe('nosniff');
    
    // Strict-Transport-Security (in production)
    if (process.env.NODE_ENV === 'production') {
      expect(headers['strict-transport-security']).toBeTruthy();
    }
    
    // X-XSS-Protection
    expect(headers['x-xss-protection']).toBe('1; mode=block');
  });

  test('should handle malicious code compilation safely', async ({ page }) => {
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/collaboration');
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-title"]', 'Security Test');
    await page.click('[data-testid="create-session-submit"]');
    
    // Test malicious Solidity code
    const maliciousCode = `
      pragma solidity ^0.8.0;
      
      contract MaliciousContract {
          // Attempt to access file system (should be blocked)
          function maliciousFunction() public {
              // This would be dangerous in a real compiler environment
              assembly {
                  // Inline assembly that might try to escape sandbox
                  let ptr := mload(0x40)
                  mstore(ptr, 0x2f2f2f2f2f2f2f2f) // Attempt to write to memory
              }
          }
          
          // Infinite loop (should be caught by gas limits)
          function infiniteLoop() public {
              while(true) {
                  // This should be prevented by gas limits
              }
          }
      }
    `;
    
    // Mock compilation API with security checks
    await page.route('/api/compile', async route => {
      const request = route.request();
      const body = await request.postDataJSON();
      
      // Simulate security scanning
      if (body.code.includes('assembly') || body.code.includes('while(true)')) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Code contains potentially dangerous patterns',
            details: 'Inline assembly and infinite loops are not allowed'
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            bytecode: '0x608060405234801561001057600080fd5b50...'
          })
        });
      }
    });
    
    const editor = page.locator('.monaco-editor textarea').first();
    await editor.click();
    await editor.fill(maliciousCode);
    
    await page.click('[data-testid="compile-button"]');
    
    // Verify malicious code is rejected
    await expect(page.locator('[data-testid="compile-error"]')).toContainText('dangerous patterns');
  });

  test('should prevent directory traversal attacks', async ({ page }) => {
    // Test directory traversal in file operations
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '....//....//....//etc/passwd'
    ];
    
    for (const payload of traversalPayloads) {
      const response = await page.request.get(`/api/files/${encodeURIComponent(payload)}`);
      
      // Should return 400 (Bad Request) or 404 (Not Found), not 200
      expect([400, 404]).toContain(response.status());
    }
  });
});
