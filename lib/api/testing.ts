/**
 * API testing utilities and integration test helpers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ApiErrorCode, HttpStatus } from './types';
import { createApiResponse, createApiError } from './utils';

// Test request builder
export class TestRequestBuilder {
  private method: string = 'GET';
  private url: string = 'http://localhost:3000/api/test';
  private headers: Record<string, string> = {};
  private body: any = null;

  setMethod(method: string): this {
    this.method = method;
    return this;
  }

  setUrl(url: string): this {
    this.url = url;
    return this;
  }

  setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  setHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  setBody(body: any): this {
    this.body = body;
    if (typeof body === 'object') {
      this.setHeader('Content-Type', 'application/json');
    }
    return this;
  }

  setAuth(token: string): this {
    this.setHeader('Authorization', `Bearer ${token}`);
    return this;
  }

  setUser(userId: string, role: string = 'STUDENT'): this {
    this.setHeader('X-User-ID', userId);
    this.setHeader('X-User-Role', role);
    return this;
  }

  build(): NextRequest {
    const init: RequestInit = {
      method: this.method,
      headers: this.headers
    };

    if (this.body && ['POST', 'PUT', 'PATCH'].includes(this.method)) {
      init.body = typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }

    return new NextRequest(this.url, init);
  }
}

// Test response assertions
export class TestResponseAssertions {
  constructor(private response: NextResponse) {}

  async expectStatus(status: HttpStatus): Promise<this> {
    if (this.response.status !== status) {
      throw new Error(`Expected status ${status}, got ${this.response.status}`);
    }
    return this;
  }

  async expectSuccess(): Promise<this> {
    const data = await this.response.json();
    if (!data.success) {
      throw new Error(`Expected success response, got error: ${data.error?.message}`);
    }
    return this;
  }

  async expectError(code?: ApiErrorCode): Promise<this> {
    const data = await this.response.json();
    if (data.success) {
      throw new Error('Expected error response, got success');
    }
    if (code && data.error?.code !== code) {
      throw new Error(`Expected error code ${code}, got ${data.error?.code}`);
    }
    return this;
  }

  async expectData<T>(validator?: (data: T) => boolean): Promise<T> {
    const response = await this.response.json();
    if (!response.success) {
      throw new Error(`Expected data, got error: ${response.error?.message}`);
    }
    if (validator && !validator(response.data)) {
      throw new Error('Data validation failed');
    }
    return response.data;
  }

  async expectValidationError(field?: string): Promise<this> {
    await this.expectStatus(HttpStatus.UNPROCESSABLE_ENTITY);
    await this.expectError(ApiErrorCode.VALIDATION_ERROR);
    
    if (field) {
      const data = await this.response.json();
      const hasFieldError = data.error?.details?.some((err: any) => err.field === field);
      if (!hasFieldError) {
        throw new Error(`Expected validation error for field '${field}'`);
      }
    }
    
    return this;
  }

  expectHeader(key: string, value?: string): this {
    const headerValue = this.response.headers.get(key);
    if (!headerValue) {
      throw new Error(`Expected header '${key}' to be present`);
    }
    if (value && headerValue !== value) {
      throw new Error(`Expected header '${key}' to be '${value}', got '${headerValue}'`);
    }
    return this;
  }

  expectCorsHeaders(): this {
    this.expectHeader('Access-Control-Allow-Origin');
    this.expectHeader('Access-Control-Allow-Methods');
    this.expectHeader('Access-Control-Allow-Headers');
    return this;
  }

  expectSecurityHeaders(): this {
    this.expectHeader('X-Frame-Options');
    this.expectHeader('X-Content-Type-Options');
    this.expectHeader('Referrer-Policy');
    return this;
  }

  expectRateLimitHeaders(): this {
    this.expectHeader('RateLimit-Limit');
    this.expectHeader('RateLimit-Remaining');
    this.expectHeader('RateLimit-Reset');
    return this;
  }
}

// Test API client
export class TestApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  setAuth(token: string): this {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    return this;
  }

  setUser(userId: string, role: string = 'STUDENT'): this {
    this.defaultHeaders['X-User-ID'] = userId;
    this.defaultHeaders['X-User-Role'] = role;
    return this;
  }

  request(method: string, path: string): TestRequestBuilder {
    return new TestRequestBuilder()
      .setMethod(method)
      .setUrl(`${this.baseUrl}${path}`)
      .setHeaders(this.defaultHeaders);
  }

  get(path: string): TestRequestBuilder {
    return this.request('GET', path);
  }

  post(path: string): TestRequestBuilder {
    return this.request('POST', path);
  }

  put(path: string): TestRequestBuilder {
    return this.request('PUT', path);
  }

  patch(path: string): TestRequestBuilder {
    return this.request('PATCH', path);
  }

  delete(path: string): TestRequestBuilder {
    return this.request('DELETE', path);
  }

  options(path: string): TestRequestBuilder {
    return this.request('OPTIONS', path);
  }
}

// Mock data generators
export class MockDataGenerator {
  static user(overrides: Partial<any> = {}) {
    return {
      id: this.uuid(),
      email: this.email(),
      name: this.name(),
      role: 'STUDENT',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  static course(overrides: Partial<any> = {}) {
    return {
      id: this.uuid(),
      title: 'Test Course',
      description: 'A test course for learning Solidity',
      shortDescription: 'Learn Solidity basics',
      category: 'Programming',
      difficulty: 'BEGINNER',
      estimatedDuration: 240,
      totalLessons: 10,
      totalXp: 500,
      prerequisites: [],
      learningObjectives: ['Learn Solidity syntax', 'Build smart contracts'],
      instructorId: this.uuid(),
      status: 'PUBLISHED',
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enrollmentCount: 0,
      completionCount: 0,
      averageRating: 0,
      ratingCount: 0,
      price: 0,
      currency: 'USD',
      tags: ['solidity', 'blockchain'],
      ...overrides
    };
  }

  static lesson(overrides: Partial<any> = {}) {
    return {
      id: this.uuid(),
      courseId: this.uuid(),
      title: 'Test Lesson',
      description: 'A test lesson',
      content: 'This is test lesson content',
      type: 'text',
      duration: 30,
      order: 1,
      isPreview: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  static progress(overrides: Partial<any> = {}) {
    return {
      id: this.uuid(),
      userId: this.uuid(),
      courseId: this.uuid(),
      lessonId: this.uuid(),
      progressPercentage: 50,
      completedLessons: [],
      timeSpent: 30,
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static email(): string {
    return `test${Math.random().toString(36).substr(2, 9)}@example.com`;
  }

  static name(): string {
    const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  }

  static randomString(length: number = 10): string {
    return Math.random().toString(36).substr(2, length);
  }

  static randomInt(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Test database utilities
export class TestDatabase {
  private static data: Map<string, Map<string, any>> = new Map();

  static clear(): void {
    this.data.clear();
  }

  static getCollection(name: string): Map<string, any> {
    if (!this.data.has(name)) {
      this.data.set(name, new Map());
    }
    return this.data.get(name)!;
  }

  static insert(collection: string, id: string, data: any): void {
    const coll = this.getCollection(collection);
    coll.set(id, { ...data, id });
  }

  static find(collection: string, id: string): any | null {
    const coll = this.getCollection(collection);
    return coll.get(id) || null;
  }

  static findAll(collection: string): any[] {
    const coll = this.getCollection(collection);
    return Array.from(coll.values());
  }

  static update(collection: string, id: string, data: Partial<any>): boolean {
    const coll = this.getCollection(collection);
    const existing = coll.get(id);
    if (!existing) return false;
    
    coll.set(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return true;
  }

  static delete(collection: string, id: string): boolean {
    const coll = this.getCollection(collection);
    return coll.delete(id);
  }

  static count(collection: string): number {
    const coll = this.getCollection(collection);
    return coll.size;
  }

  static seed(): void {
    // Seed with test data
    const users = [
      MockDataGenerator.user({ id: 'user-1', email: 'student@test.com', role: 'STUDENT' }),
      MockDataGenerator.user({ id: 'user-2', email: 'instructor@test.com', role: 'INSTRUCTOR' }),
      MockDataGenerator.user({ id: 'user-3', email: 'admin@test.com', role: 'ADMIN' })
    ];

    const courses = [
      MockDataGenerator.course({ id: 'course-1', instructorId: 'user-2' }),
      MockDataGenerator.course({ id: 'course-2', instructorId: 'user-2', difficulty: 'INTERMEDIATE' })
    ];

    const lessons = [
      MockDataGenerator.lesson({ id: 'lesson-1', courseId: 'course-1', order: 1 }),
      MockDataGenerator.lesson({ id: 'lesson-2', courseId: 'course-1', order: 2 }),
      MockDataGenerator.lesson({ id: 'lesson-3', courseId: 'course-2', order: 1 })
    ];

    users.forEach(user => this.insert('users', user.id, user));
    courses.forEach(course => this.insert('courses', course.id, course));
    lessons.forEach(lesson => this.insert('lessons', lesson.id, lesson));
  }
}

// Test utilities
export function createTestResponse(data: any, status: HttpStatus = HttpStatus.OK): NextResponse {
  return NextResponse.json(data, { status });
}

export function createTestApiResponse<T>(data?: T, success: boolean = true): ApiResponse<T> {
  if (success) {
    return createApiResponse(data);
  } else {
    return createApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Test error');
  }
}

export async function executeApiTest(
  handler: (request: NextRequest) => Promise<NextResponse>,
  request: NextRequest
): Promise<TestResponseAssertions> {
  const response = await handler(request);
  return new TestResponseAssertions(response);
}

// Test suite helpers
export function describeApiEndpoint(name: string, tests: () => void): void {
  describe(`API Endpoint: ${name}`, () => {
    beforeEach(() => {
      TestDatabase.clear();
      TestDatabase.seed();
    });

    tests();
  });
}

export function itShouldRequireAuth(
  handler: (request: NextRequest) => Promise<NextResponse>,
  requestBuilder: () => NextRequest
): void {
  it('should require authentication', async () => {
    const request = requestBuilder();
    const assertions = await executeApiTest(handler, request);
    await assertions.expectStatus(HttpStatus.UNAUTHORIZED);
  });
}

export function itShouldValidateInput<T>(
  handler: (request: NextRequest) => Promise<NextResponse>,
  requestBuilder: (data: T) => NextRequest,
  invalidData: T,
  expectedField?: string
): void {
  it('should validate input', async () => {
    const request = requestBuilder(invalidData);
    const assertions = await executeApiTest(handler, request);
    await assertions.expectValidationError(expectedField);
  });
}

export function itShouldRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  requestBuilder: () => NextRequest,
  limit: number
): void {
  it('should enforce rate limiting', async () => {
    const request = requestBuilder();
    
    // Make requests up to the limit
    for (let i = 0; i < limit; i++) {
      const assertions = await executeApiTest(handler, request);
      await assertions.expectStatus(HttpStatus.OK);
    }
    
    // Next request should be rate limited
    const assertions = await executeApiTest(handler, request);
    await assertions.expectStatus(HttpStatus.TOO_MANY_REQUESTS);
    await assertions.expectRateLimitHeaders();
  });
}
