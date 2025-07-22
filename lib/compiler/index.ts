'use client';

/**
 * Unified Solidity Compiler interface
 * Automatically uses browser or server implementation based on environment
 */

import { CompilationResult } from './SolidityCompiler';

// Dynamic imports to avoid server-side modules in browser
let BrowserCompiler: any = null;
let ServerCompiler: any = null;

const isServer = typeof window === 'undefined';

export async function getCompiler() {
  if (isServer) {
    // Server-side: use full Solidity compiler
    if (!ServerCompiler) {
      const { SolidityCompiler } = await import('./SolidityCompiler');
      ServerCompiler = SolidityCompiler;
    }
    return ServerCompiler.getInstance();
  } else {
    // Browser-side: use browser-compatible compiler
    if (!BrowserCompiler) {
      const { BrowserSolidityCompiler } = await import('./BrowserSolidityCompiler');
      BrowserCompiler = BrowserSolidityCompiler;
    }
    return BrowserCompiler.getInstance();
  }
}

export interface UnifiedCompiler {
  compile(
    sourceCode: string,
    contractName?: string,
    version?: string,
    optimize?: boolean
  ): Promise<CompilationResult>;
}

// Re-export types
export type { CompilationResult };