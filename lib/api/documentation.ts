/**
 * OpenAPI/Swagger documentation generator for the API
 */

import { z } from 'zod';
import { SchemaRegistry } from './schema-types';
;

// OpenAPI specification types
interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
      url: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, any>>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
    responses: Record<string, any>;
    parameters: Record<string, any>;
  };
  security: Array<Record<string, string[]>>;
  tags: Array<{
    name: string;
    description: string;
  }>;
}

// API endpoint documentation
interface ApiEndpointDoc {
  path: string;
  method: string;
  summary: string;
  description: string;
  tags: string[];
  operationId: string;
  parameters?: Array<{
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required: boolean;
    schema: any;
    description: string;
  }>;
  requestBody?: {
    required: boolean;
    content: Record<string, {
      schema: any;
      examples?: Record<string, any>;
    }>;
  };
  responses: Record<string, {
    description: string;
    content?: Record<string, {
      schema: any;
      examples?: Record<string, any>;
    }>;
    headers?: Record<string, any>;
  }>;
  security?: Array<Record<string, string[]>>;
}

// Documentation generator class
export class ApiDocumentationGenerator {
  private spec: OpenAPISpec;

  constructor() {
    this.spec = {
      openapi: '3.0.3',
      info: {
        title: 'Solidity Learning Platform API',
        version: '1.0.0',
        description: 'Comprehensive API for the Solidity Learning Platform with production-ready endpoints, security measures, and validation.',
        contact: {
          name: 'API Support',
          email: 'api-support@soliditylearning.com',
          url: 'https://soliditylearning.com/support'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'https://api.soliditylearning.com/v1',
          description: 'Production server'
        },
        {
          url: 'https://staging-api.soliditylearning.com/v1',
          description: 'Staging server'
        },
        {
          url: 'http://localhost:3000/api',
          description: 'Development server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        },
        responses: {
          UnauthorizedError: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          ForbiddenError: {
            description: 'Insufficient permissions',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          NotFoundError: {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          ValidationError: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationErrorResponse'
                }
              }
            }
          },
          RateLimitError: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            },
            headers: {
              'Retry-After': {
                description: 'Number of seconds to wait before retrying',
                schema: {
                  type: 'integer'
                }
              },
              'RateLimit-Limit': {
                description: 'Request limit per time window',
                schema: {
                  type: 'integer'
                }
              },
              'RateLimit-Remaining': {
                description: 'Remaining requests in current window',
                schema: {
                  type: 'integer'
                }
              },
              'RateLimit-Reset': {
                description: 'Time when the rate limit resets',
                schema: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            }
          }
        },
        parameters: {
          PageParam: {
            name: 'page',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1
            },
            description: 'Page number for pagination'
          },
          LimitParam: {
            name: 'limit',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20
            },
            description: 'Number of items per page'
          },
          SortByParam: {
            name: 'sortBy',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              default: 'createdAt'
            },
            description: 'Field to sort by'
          },
          SortOrderParam: {
            name: 'sortOrder',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc'
            },
            description: 'Sort order'
          },
          SearchParam: {
            name: 'search',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              maxLength: 200
            },
            description: 'Search query'
          }
        }
      },
      security: [
        { BearerAuth: [] }
      ],
      tags: [
        { name: 'Authentication', description: 'User authentication and session management' },
        { name: 'Users', description: 'User management and profiles' },
        { name: 'Courses', description: 'Course management and enrollment' },
        { name: 'Lessons', description: 'Lesson content and progress' },
        { name: 'Progress', description: 'Learning progress tracking' },
        { name: 'Achievements', description: 'Achievement and gamification system' },
        { name: 'Settings', description: 'User settings and preferences' },
        { name: 'Search', description: 'Search functionality' },
        { name: 'Upload', description: 'File upload endpoints' },
        { name: 'Errors', description: 'Error reporting and monitoring' },
        { name: 'Metrics', description: 'API metrics and analytics' },
        { name: 'Features', description: 'Feature flag management' }
      ]
    };

    this.generateCommonSchemas();
  }

  private generateCommonSchemas(): void {
    // Common response schemas
    this.spec.components.schemas.SuccessResponse = {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        meta: {
          type: 'object',
          properties: {
            pagination: {
              $ref: '#/components/schemas/PaginationMeta'
            }
          }
        },
        timestamp: { type: 'string', format: 'date-time' },
        requestId: { type: 'string', format: 'uuid' }
      },
      required: ['success', 'timestamp', 'requestId']
    };

    this.spec.components.schemas.ErrorResponse = {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' }
          },
          required: ['code', 'message']
        },
        timestamp: { type: 'string', format: 'date-time' },
        requestId: { type: 'string', format: 'uuid' }
      },
      required: ['success', 'error', 'timestamp', 'requestId']
    };

    this.spec.components.schemas.ValidationErrorResponse = {
      allOf: [
        { $ref: '#/components/schemas/ErrorResponse' },
        {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Validation failed' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                      code: { type: 'string' }
                    },
                    required: ['field', 'message', 'code']
                  }
                }
              }
            }
          }
        }
      ]
    };

    this.spec.components.schemas.PaginationMeta = {
      type: 'object',
      properties: {
        currentPage: { type: 'integer', minimum: 1 },
        totalPages: { type: 'integer', minimum: 0 },
        totalItems: { type: 'integer', minimum: 0 },
        itemsPerPage: { type: 'integer', minimum: 1 },
        hasNextPage: { type: 'boolean' },
        hasPreviousPage: { type: 'boolean' }
      },
      required: ['currentPage', 'totalPages', 'totalItems', 'itemsPerPage', 'hasNextPage', 'hasPreviousPage']
    };

    // Generate schemas from Zod schemas
    this.generateSchemasFromZod();
  }

  private generateSchemasFromZod(): void {
    // Convert Zod schemas to OpenAPI schemas
    Object.entries(SchemaRegistry).forEach(([name, schema]) => {
      try {
        this.spec.components.schemas[this.capitalize(name)] = this.zodToOpenApi(schema);
      } catch (error) {
        console.warn(`Failed to convert schema ${name}:`, error);
      }
    });
  }

  private zodToOpenApi(schema: z.ZodSchema<any>): any {
    // Basic Zod to OpenAPI conversion
    // In a real implementation, you'd use a library like zod-to-openapi
    if (schema instanceof z.ZodString) {
      return { type: 'string' };
    }
    if (schema instanceof z.ZodNumber) {
      return { type: 'number' };
    }
    if (schema instanceof z.ZodBoolean) {
      return { type: 'boolean' };
    }
    if (schema instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.zodToOpenApi(schema.element)
      };
    }
    if (schema instanceof z.ZodObject) {
      const properties: Record<string, any> = {};
      const required: string[] = [];
      
      Object.entries(schema.shape).forEach(([key, value]) => {
        properties[key] = this.zodToOpenApi(value as z.ZodSchema<any>);
        if (!(value as any).isOptional()) {
          required.push(key);
        }
      });
      
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined
      };
    }
    
    return { type: 'object' };
  }

  addEndpoint(endpoint: ApiEndpointDoc): void {
    if (!this.spec.paths[endpoint.path]) {
      this.spec.paths[endpoint.path] = {};
    }
    
    this.spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      operationId: endpoint.operationId,
      parameters: endpoint.parameters,
      requestBody: endpoint.requestBody,
      responses: endpoint.responses,
      security: endpoint.security
    };
  }

  generateSpec(): OpenAPISpec {
    // Add all documented endpoints
    this.addAuthenticationEndpoints();
    this.addUserEndpoints();
    this.addCourseEndpoints();
    this.addSettingsEndpoints();
    this.addSearchEndpoints();
    this.addErrorEndpoints();
    this.addMetricsEndpoints();
    
    return this.spec;
  }

  private addAuthenticationEndpoints(): void {
    this.addEndpoint({
      path: '/auth/login',
      method: 'POST',
      summary: 'User login',
      description: 'Authenticate user with email and password',
      tags: ['Authentication'],
      operationId: 'loginUser',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Login' },
            examples: {
              student: {
                summary: 'Student login',
                value: {
                  email: 'student@example.com',
                  password: 'password123',
                  rememberMe: false
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' },
                          refreshToken: { type: 'string' },
                          expiresAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': { 
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '422': { 
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
            }
          }
        },
        '429': { 
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RateLimitErrorResponse' }
            }
          }
        }
      },
      security: []
    });

    this.addEndpoint({
      path: '/auth/register',
      method: 'POST',
      summary: 'User registration',
      description: 'Register a new user account',
      tags: ['Authentication'],
      operationId: 'registerUser',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Register' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Registration successful',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/User' }
                    }
                  }
                ]
              }
            }
          }
        },
        '409': {
          description: 'User already exists',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '422': { 
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
            }
          }
        },
        '429': { 
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RateLimitErrorResponse' }
            }
          }
        }
      },
      security: []
    });
  }

  private addUserEndpoints(): void {
    // Add user-related endpoints
  }

  private addCourseEndpoints(): void {
    // Add course-related endpoints
  }

  private addSettingsEndpoints(): void {
    // Add settings-related endpoints
  }

  private addSearchEndpoints(): void {
    // Add search-related endpoints
  }

  private addErrorEndpoints(): void {
    // Add error reporting endpoints
  }

  private addMetricsEndpoints(): void {
    // Add metrics endpoints
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  exportToJson(): string {
    return JSON.stringify(this.generateSpec(), null, 2);
  }

  exportToYaml(): string {
    // In a real implementation, you'd use a YAML library
    return JSON.stringify(this.generateSpec(), null, 2);
  }
}

// Create and export the documentation generator
export const apiDocumentation = new ApiDocumentationGenerator();

// Generate the complete OpenAPI specification
export function generateApiDocumentation(): OpenAPISpec {
  return apiDocumentation.generateSpec();
}
