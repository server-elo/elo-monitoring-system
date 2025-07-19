// Comprehensive error type definitions and utilities

export type ErrorSeverity = 'critical' | 'warning' | 'info';
export type ErrorCategory = 'api' | 'form' | 'navigation' | 'auth' | 'upload' | 'network' | 'validation' | 'system';
export type ErrorContext = 'toast' | 'inline' | 'modal' | 'page' | 'banner';

export interface BaseError {
  id: string;
  code: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  timestamp: Date;
  userMessage: string;
  technicalMessage?: string;
  actionable: boolean;
  retryable: boolean;
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
  actions?: ErrorAction[];
  metadata?: Record<string, any>;
}

export interface ErrorAction {
  label: string;
  action: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

// Specific error types
export interface ApiError extends BaseError {
  category: 'api';
  statusCode?: number;
  endpoint?: string;
  method?: string;
  requestId?: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface FormError extends BaseError {
  category: 'form';
  field?: string;
  validationRule?: string;
  currentValue?: any;
  expectedFormat?: string;
}

export interface NavigationError extends BaseError {
  category: 'navigation';
  path?: string;
  statusCode?: 404 | 403 | 500;
  suggestedPaths?: string[];
}

export interface AuthError extends BaseError {
  category: 'auth';
  authType?: 'login' | 'register' | 'logout' | 'refresh' | 'permission';
  redirectUrl?: string;
  requiredRole?: string;
}

export interface UploadError extends BaseError {
  category: 'upload';
  fileName?: string;
  fileSize?: number;
  maxSize?: number;
  allowedTypes?: string[];
  actualType?: string;
}

export interface NetworkError extends BaseError {
  category: 'network';
  isOffline?: boolean;
  connectionType?: string;
  retryAfter?: number;
}

export type AppError = ApiError | FormError | NavigationError | AuthError | UploadError | NetworkError;

// Error factory functions
export class ErrorFactory {
  private static generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createApiError(options: {
    message: string;
    statusCode?: number;
    endpoint?: string;
    method?: string;
    severity?: ErrorSeverity;
    retryable?: boolean;
    userMessage?: string;
  }): ApiError {
    const { message, statusCode, endpoint, method, severity = 'critical', retryable = true, userMessage } = options;
    
    return {
      id: this.generateId(),
      code: `API_${statusCode || 'UNKNOWN'}`,
      message,
      userMessage: userMessage || this.getApiUserMessage(statusCode, message),
      severity,
      category: 'api',
      context: 'toast',
      timestamp: new Date(),
      actionable: true,
      retryable,
      autoHide: severity !== 'critical',
      hideAfter: severity === 'info' ? 3000 : 5000,
      statusCode,
      endpoint,
      method,
      retryCount: 0,
      maxRetries: retryable ? 3 : 0,
      actions: retryable ? [{
        label: 'Try Again',
        action: () => {}, // Will be overridden by caller
        variant: 'primary'
      }] : []
    };
  }

  static createFormError(options: {
    message: string;
    field?: string;
    validationRule?: string;
    currentValue?: unknown;
    expectedFormat?: string;
    userMessage?: string;
  }): FormError {
    const { message, field, validationRule, currentValue, expectedFormat, userMessage } = options;
    
    return {
      id: this.generateId(),
      code: `FORM_${validationRule?.toUpperCase() || 'VALIDATION'}`,
      message,
      userMessage: userMessage || this.getFormUserMessage(validationRule, field, expectedFormat),
      severity: 'warning',
      category: 'form',
      context: 'inline',
      timestamp: new Date(),
      actionable: true,
      retryable: false,
      autoHide: false,
      field,
      validationRule,
      currentValue,
      expectedFormat
    };
  }

  static createNavigationError(options: {
    message: string;
    statusCode?: 404 | 403 | 500;
    path?: string;
    suggestedPaths?: string[];
    userMessage?: string;
  }): NavigationError {
    const { message, statusCode = 404, path, suggestedPaths, userMessage } = options;
    
    return {
      id: this.generateId(),
      code: `NAV_${statusCode}`,
      message,
      userMessage: userMessage || this.getNavigationUserMessage(statusCode, path),
      severity: statusCode === 500 ? 'critical' : 'warning',
      category: 'navigation',
      context: 'page',
      timestamp: new Date(),
      actionable: true,
      retryable: statusCode === 500,
      autoHide: false,
      statusCode,
      path,
      suggestedPaths,
      actions: this.getNavigationActions(statusCode, suggestedPaths)
    };
  }

  static createAuthError(options: {
    message: string;
    authType?: 'login' | 'register' | 'logout' | 'refresh' | 'permission';
    redirectUrl?: string;
    requiredRole?: string;
    userMessage?: string;
  }): AuthError {
    const { message, authType = 'login', redirectUrl, requiredRole, userMessage } = options;
    
    return {
      id: this.generateId(),
      code: `AUTH_${authType.toUpperCase()}`,
      message,
      userMessage: userMessage || this.getAuthUserMessage(authType, requiredRole),
      severity: authType === 'permission' ? 'warning' : 'critical',
      category: 'auth',
      context: 'modal',
      timestamp: new Date(),
      actionable: true,
      retryable: false,
      autoHide: false,
      authType,
      redirectUrl,
      requiredRole,
      actions: this.getAuthActions(authType, redirectUrl)
    };
  }

  static createUploadError(options: {
    message: string;
    fileName?: string;
    fileSize?: number;
    maxSize?: number;
    allowedTypes?: string[];
    actualType?: string;
    userMessage?: string;
  }): UploadError {
    const { message, fileName, fileSize, maxSize, allowedTypes, actualType, userMessage } = options;
    
    return {
      id: this.generateId(),
      code: 'UPLOAD_ERROR',
      message,
      userMessage: userMessage || this.getUploadUserMessage(fileName, fileSize, maxSize, allowedTypes, actualType),
      severity: 'warning',
      category: 'upload',
      context: 'inline',
      timestamp: new Date(),
      actionable: true,
      retryable: true,
      autoHide: false,
      fileName,
      fileSize,
      maxSize,
      allowedTypes,
      actualType,
      actions: [{
        label: 'Choose Different File',
        action: () => {}, // Will be overridden by caller
        variant: 'primary'
      }]
    };
  }

  static createNetworkError(options: {
    message: string;
    isOffline?: boolean;
    connectionType?: string;
    retryAfter?: number;
    userMessage?: string;
  }): NetworkError {
    const { message, isOffline = false, connectionType, retryAfter, userMessage } = options;
    
    return {
      id: this.generateId(),
      code: isOffline ? 'NETWORK_OFFLINE' : 'NETWORK_ERROR',
      message,
      userMessage: userMessage || this.getNetworkUserMessage(isOffline, connectionType),
      severity: isOffline ? 'critical' : 'warning',
      category: 'network',
      context: 'banner',
      timestamp: new Date(),
      actionable: true,
      retryable: true,
      autoHide: !isOffline,
      hideAfter: 5000,
      isOffline,
      connectionType,
      retryAfter,
      actions: [{
        label: isOffline ? 'Check Connection' : 'Retry',
        action: () => {}, // Will be overridden by caller
        variant: 'primary'
      }]
    };
  }

  // Helper methods for generating user-friendly messages
  private static getApiUserMessage(statusCode?: number, message?: string): string {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in to continue.';
      case 403:
        return 'Access denied. You don\'t have permission for this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Our team has been notified. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again in a few minutes.';
      default:
        return message || 'An unexpected error occurred. Please try again.';
    }
  }

  private static getFormUserMessage(rule?: string, field?: string, expectedFormat?: string): string {
    const fieldName = field ? field.charAt(0).toUpperCase() + field.slice(1) : 'This field';
    
    switch (rule) {
      case 'required':
        return `${fieldName} is required.`;
      case 'email':
        return `Please enter a valid email address.`;
      case 'minLength':
        return `${fieldName} must be at least ${expectedFormat} characters long.`;
      case 'maxLength':
        return `${fieldName} must be no more than ${expectedFormat} characters long.`;
      case 'pattern':
        return `${fieldName} format is invalid. ${expectedFormat ? `Expected format: ${expectedFormat}` : ''}`;
      default:
        return `${fieldName} is invalid. Please check your input.`;
    }
  }

  private static getNavigationUserMessage(statusCode: number, path?: string): string {
    switch (statusCode) {
      case 404:
        return `Page not found${path ? ` at ${path}` : ''}. The page you're looking for doesn't exist or has been moved.`;
      case 403:
        return 'Access forbidden. You don\'t have permission to view this page.';
      case 500:
        return 'Server error. We\'re experiencing technical difficulties. Please try again later.';
      default:
        return 'Navigation error occurred. Please try again.';
    }
  }

  private static getAuthUserMessage(authType: string, requiredRole?: string): string {
    switch (authType) {
      case 'login':
        return 'Please log in to access this feature.';
      case 'register':
        return 'Account creation failed. Please check your information and try again.';
      case 'permission':
        return `Access denied. ${requiredRole ? `This feature requires ${requiredRole} privileges.` : 'You don\'t have permission for this action.'}`;
      case 'refresh':
        return 'Your session has expired. Please log in again.';
      default:
        return 'Authentication error. Please try logging in again.';
    }
  }

  private static getUploadUserMessage(
    fileName?: string, 
    fileSize?: number, 
    maxSize?: number, 
    allowedTypes?: string[], 
    actualType?: string
  ): string {
    if (fileSize && maxSize && fileSize > maxSize) {
      return `File "${fileName}" is too large (${this.formatFileSize(fileSize)}). Maximum size allowed is ${this.formatFileSize(maxSize)}.`;
    }
    
    if (allowedTypes && actualType && !allowedTypes.includes(actualType)) {
      return `File type "${actualType}" is not supported. Allowed types: ${allowedTypes.join(', ')}.`;
    }
    
    return `Upload failed for "${fileName}". Please check the file and try again.`;
  }

  private static getNetworkUserMessage(isOffline: boolean, connectionType?: string): string {
    if (isOffline) {
      return 'You\'re currently offline. Please check your internet connection.';
    }
    
    return `Network error occurred${connectionType ? ` (${connectionType})` : ''}. Please check your connection and try again.`;
  }

  private static getNavigationActions(statusCode: number, suggestedPaths?: string[]): ErrorAction[] {
    const actions: ErrorAction[] = [{
      label: 'Go Home',
      action: () => window.location.href = '/',
      variant: 'primary'
    }];

    if (statusCode === 404 && suggestedPaths?.length) {
      actions.unshift({
        label: 'Search',
        action: () => {}, // Will be overridden
        variant: 'secondary'
      });
    }

    if (statusCode === 500) {
      actions.unshift({
        label: 'Retry',
        action: () => window.location.reload(),
        variant: 'primary'
      });
    }

    return actions;
  }

  private static getAuthActions(authType: string, _redirectUrl?: string): ErrorAction[] {
    const actions: ErrorAction[] = [];

    if (authType === 'login' || authType === 'refresh') {
      actions.push({
        label: 'Log In',
        action: () => {}, // Will be overridden
        variant: 'primary'
      });
    }

    if (authType === 'permission') {
      actions.push({
        label: 'Contact Support',
        action: () => {}, // Will be overridden
        variant: 'secondary'
      });
    }

    return actions;
  }

  private static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
