// Global type declarations

// Global Monaco namespaces (for files that reference them without imports)
declare namespace editor {
  export interface IStandaloneCodeEditor {
    getValue(): string;
    setValue(value: string): void;
    getModel(): ITextModel | null;
    setModel(model: ITextModel | null): void;
    focus(): void;
    dispose(): void;
    onDidChangeModelContent(listener: (e: any) => void): any;
    onDidChangeCursorPosition(listener: (e: any) => void): any;
    getAction(id: string): any;
    trigger(source: string, handlerId: string, payload?: any): void;
    addCommand(keybinding: number, handler: () => void, context?: string): string | null;
    createContextKey(key: string, defaultValue: boolean): any;
    getSelection(): Selection | null;
    setSelection(selection: any): void;
    getPosition(): any;
    setPosition(position: any): void;
    revealLine(lineNumber: number): void;
    deltaDecorations(oldDecorations: string[], newDecorations: any[]): string[];
    layout(dimension?: { width: number; height: number }): void;
    updateOptions(options: any): void;
  }
  
  export interface ITextModel {
    getValue(): string;
    setValue(value: string): void;
    getLineCount(): number;
    getLineContent(lineNumber: number): string;
    dispose(): void;
    onDidChangeContent(listener: (e: any) => void): any;
    pushEditOperations(beforeCursorState: any, editOperations: any[], cursorStateComputer?: any): any;
    applyEdits(operations: any[]): any;
    getVersionId(): number;
    getAlternativeVersionId(): number;
    getLinesContent(): string[];
    getLineMaxColumn(lineNumber: number): number;
    getLineFirstNonWhitespaceColumn(lineNumber: number): number;
    getLineLastNonWhitespaceColumn(lineNumber: number): number;
    validatePosition(position: any): any;
    validateRange(range: any): any;
    getValueInRange(range: any, eol?: any): string;
    getWordAtPosition(position: any): any;
    getWordUntilPosition(position: any): any;
  }

  export interface IEditorOptions {
    value?: string;
    language?: string;
    theme?: string;
    readOnly?: boolean;
    minimap?: { enabled: boolean };
    scrollBeyondLastLine?: boolean;
    fontSize?: number;
    lineNumbers?: string;
    renderWhitespace?: string;
    automaticLayout?: boolean;
    wordWrap?: string;
    folding?: boolean;
    lineDecorationsWidth?: number;
    lineNumbersMinChars?: number;
    glyphMargin?: boolean;
    [key: string]: any;
  }

  export interface IMarkerData {
    severity: number;
    message: string;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    source?: string;
    code?: string;
  }

  export const MarkerSeverity: {
    Hint: number;
    Info: number;
    Warning: number;
    Error: number;
  };

  export function create(domElement: HTMLElement, options?: IEditorOptions): IStandaloneCodeEditor;
  export function createModel(value: string, language?: string, uri?: any): ITextModel;
  export function setModelMarkers(model: ITextModel, owner: string, markers: IMarkerData[]): void;
}

declare namespace monaco {
  export const editor: typeof editor;
  export const languages: {
    register(language: { id: string; extensions?: string[]; aliases?: string[] }): void;
    setMonarchTokensProvider(languageId: string, languageDef: any): void;
    setLanguageConfiguration(languageId: string, configuration: any): void;
    registerCompletionItemProvider(languageId: string, provider: any): any;
    registerHoverProvider(languageId: string, provider: any): any;
    registerSignatureHelpProvider(languageId: string, provider: any): any;
  };
  export class Range {
    constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number);
  }
  export class Selection {
    constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number);
  }
  export class Position {
    constructor(lineNumber: number, column: number);
  }
}

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    isMetaMask?: boolean;
    chainId?: string;
    selectedAddress?: string;
  };

  monaco?: typeof import('monaco-editor').monaco;

  /**
   * Sentry error monitoring service
   */
  Sentry?: {
    captureException: (error: Error) => void;
    withScope: (callback: (scope: SentryScope) => void) => void;
    addBreadcrumb: (breadcrumb: SentryBreadcrumb) => void;
    setUser: (user: SentryUser) => void;
    setTag: (key: string, value: string) => void;
    setContext: (key: string, context: Record<string, unknown>) => void;
  };

  /**
   * Google Analytics 4 (gtag)
   */
  gtag?: (
    command: 'config' | 'event' | 'set',
    targetId: string | 'page_title' | 'page_location' | 'send_page_view',
    config?: Record<string, unknown>
  ) => void;

  /**
   * LogRocket session recording
   */
  LogRocket?: {
    identify: (uid: string, traits?: Record<string, unknown>) => void;
    track: (event: string, properties?: Record<string, unknown>) => void;
    captureException: (error: Error) => void;
  };

  /**
   * PostHog analytics
   */
  posthog?: {
    capture: (event: string, properties?: Record<string, unknown>) => void;
    identify: (uid: string, properties?: Record<string, unknown>) => void;
    reset: () => void;
  };

  /**
   * Mixpanel analytics
   */
  mixpanel?: {
    track: (event: string, properties?: Record<string, unknown>) => void;
    identify: (uid: string) => void;
    people: {
      set: (properties: Record<string, unknown>) => void;
    };
  };

  /**
   * Hotjar heatmaps and session recordings
   */
  hj?: (command: string, ...args: unknown[]) => void;

  /**
   * Intercom customer messaging
   */
  Intercom?: (command: string, data?: Record<string, unknown>) => void;
}

/**
 * Sentry scope interface
 */
interface SentryScope {
  setTag: (key: string, value: string | number) => void;
  setContext: (key: string, context: Record<string, unknown>) => void;
  setUser: (user: SentryUser) => void;
  setLevel: (level: 'fatal' | 'error' | 'warning' | 'info' | 'debug') => void;
}

/**
 * Sentry breadcrumb interface
 */
interface SentryBreadcrumb {
  message?: string;
  category?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, unknown>;
  timestamp?: number;
}

/**
 * Sentry user interface
 */
interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
  [key: string]: unknown;
}

// Google Generative AI types
declare module '@google/genai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(config: { model: string }): any;
  }
}

// Environment variables for Next.js
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    DATABASE_URL: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GEMINI_API_KEY: string;
    REDIS_URL: string;
    SOCKET_SERVER_URL: string;
    // Monitoring and Analytics
    NEXT_PUBLIC_APP_VERSION?: string;
    NEXT_PUBLIC_SENTRY_DSN?: string;
    NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
    NEXT_PUBLIC_POSTHOG_KEY?: string;
    NEXT_PUBLIC_MIXPANEL_TOKEN?: string;
    NEXT_PUBLIC_HOTJAR_ID?: string;
    NEXT_PUBLIC_INTERCOM_APP_ID?: string;
    NEXT_PUBLIC_LOGROCKET_ID?: string;
    BUILD_TIMESTAMP?: string;
    VERCEL_ENV?: 'development' | 'preview' | 'production';
    VERCEL_URL?: string;
    VERCEL_GIT_COMMIT_SHA?: string;
  }
}

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_MIXPANEL_TOKEN?: string;
  readonly VITE_HOTJAR_ID?: string;
  readonly VITE_INTERCOM_APP_ID?: string;
  readonly VITE_LOGROCKET_ID?: string;
  readonly VITE_NODE_ENV?: 'development' | 'test' | 'production';
  readonly VITE_VERCEL_ENV?: 'development' | 'preview' | 'production';
  readonly VITE_VERCEL_URL?: string;
  readonly VITE_VERCEL_GIT_COMMIT_SHA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// CSS and asset module declarations
declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// External module declarations for packages without types
declare module 'react-error-boundary' {
  export interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<any>;
    FallbackComponent?: React.ComponentType<any>;
    onError?: (error: Error, errorInfo: any) => void;
    onReset?: () => void;
    resetKeys?: Array<unknown>;
    resetOnPropsChange?: boolean;
    isolate?: boolean;
    level?: 'error' | 'warn';
  }
  export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {}
  export function withErrorBoundary<P extends Record<string, unknown>>(
    Component: React.ComponentType<P>,
    errorBoundaryProps: ErrorBoundaryProps
  ): React.ComponentType<P>;
  export function useErrorHandler(): (error: Error) => void;
}

declare module '@storybook/react' {
  export interface Meta<T = {}> {
    title: string;
    component?: React.ComponentType<T>;
    parameters?: Record<string, unknown>;
    argTypes?: Record<string, unknown>;
  }
  export interface StoryObj<T = {}> {
    args?: Partial<T>;
    parameters?: Record<string, unknown>;
    render?: (args: T) => React.ReactNode;
  }
  export type StoryFn<T = {}> = (args: T) => React.ReactNode;
}

declare module '@storybook/test' {
  export const expect: any;
  export const userEvent: any;
  export const within: any;
  export const fireEvent: any;
}

declare module 'class-variance-authority' {
  export type VariantProps<T> = any;
  export function cva(...args: any[]): any;
}

declare module 'monaco-editor' {
  export interface ShowLightbulbIconMode {
    Off: number;
    OnCode: number;
    Everywhere: number;
  }

  export namespace editor {
    export interface IStandaloneCodeEditor {
      getValue(): string;
      setValue(value: string): void;
      getModel(): ITextModel | null;
      setModel(model: ITextModel | null): void;
      focus(): void;
      dispose(): void;
      onDidChangeModelContent(listener: (e: any) => void): any;
      onDidChangeCursorPosition(listener: (e: any) => void): any;
      getAction(id: string): any;
      trigger(source: string, handlerId: string, payload?: any): void;
      addCommand(keybinding: number, handler: () => void, context?: string): string | null;
      createContextKey(key: string, defaultValue: boolean): any;
      getSelection(): Selection | null;
      setSelection(selection: any): void;
      getPosition(): any;
      setPosition(position: any): void;
      revealLine(lineNumber: number): void;
      deltaDecorations(oldDecorations: string[], newDecorations: any[]): string[];
      layout(dimension?: { width: number; height: number }): void;
      updateOptions(options: any): void;
    }
    
    export interface ITextModel {
      getValue(): string;
      setValue(value: string): void;
      getLineCount(): number;
      getLineContent(lineNumber: number): string;
      dispose(): void;
      onDidChangeContent(listener: (e: any) => void): any;
      pushEditOperations(beforeCursorState: any, editOperations: any[], cursorStateComputer?: any): any;
      applyEdits(operations: any[]): any;
      getVersionId(): number;
      getAlternativeVersionId(): number;
      getLinesContent(): string[];
      getLineMaxColumn(lineNumber: number): number;
      getLineFirstNonWhitespaceColumn(lineNumber: number): number;
      getLineLastNonWhitespaceColumn(lineNumber: number): number;
      validatePosition(position: any): any;
      validateRange(range: any): any;
      getValueInRange(range: any, eol?: any): string;
      getWordAtPosition(position: any): any;
      getWordUntilPosition(position: any): any;
    }

    export interface IEditorOptions {
      value?: string;
      language?: string;
      theme?: string;
      readOnly?: boolean;
      minimap?: { enabled: boolean };
      scrollBeyondLastLine?: boolean;
      fontSize?: number;
      lineNumbers?: string;
      renderWhitespace?: string;
      automaticLayout?: boolean;
      wordWrap?: string;
      folding?: boolean;
      lineDecorationsWidth?: number;
      lineNumbersMinChars?: number;
      glyphMargin?: boolean;
      [key: string]: any;
    }

    export interface IMarkerData {
      severity: number;
      message: string;
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
      source?: string;
      code?: string;
    }

    export const MarkerSeverity: {
      Hint: number;
      Info: number;
      Warning: number;
      Error: number;
    };

    export function create(domElement: HTMLElement, options?: IEditorOptions): IStandaloneCodeEditor;
    export function createModel(value: string, language?: string, uri?: any): ITextModel;
    export function setModelMarkers(model: ITextModel, owner: string, markers: IMarkerData[]): void;
  }

  export namespace languages {
    export function register(language: { id: string; extensions?: string[]; aliases?: string[] }): void;
    export function setMonarchTokensProvider(languageId: string, languageDef: any): void;
    export function setLanguageConfiguration(languageId: string, configuration: any): void;
    export function registerCompletionItemProvider(languageId: string, provider: any): any;
    export function registerHoverProvider(languageId: string, provider: any): any;
    export function registerSignatureHelpProvider(languageId: string, provider: any): any;
  }

  export namespace monaco {
    export const editor: typeof editor;
    export const languages: typeof languages;
    export class Range {
      constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number);
    }
    export class Selection {
      constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number);
    }
    export class Position {
      constructor(lineNumber: number, column: number);
    }
  }

  export const Range: typeof monaco.Range;
  export const Selection: typeof monaco.Selection;
  export const Position: typeof monaco.Position;
}

// Common missing types
interface AccessibilityTestResult {
  id: string;
  type: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  element?: HTMLElement;
  line?: number;
  column?: number;
}

interface UATSession {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  startTime?: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'in_progress';
  testCases: any[];
  testerInfo?: {
    id: string;
    name: string;
    email: string;
    experience: string;
    platform: string;
  };
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageCompletionTime: number;
    satisfaction: number;
    issues: any[];
  };
  assignedTasks?: any[];
  feedback?: string;
  screenshots?: string[];
  recordings?: string[];
}

// Check component type (likely from lucide-react)
declare const Check: React.ComponentType<any>;

// Animation function
declare function showSuccessAnimation(): void;

// Remove the @prisma/client declaration to allow the generated types to work
// The Prisma client types are automatically generated and should not be overridden
