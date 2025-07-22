#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function fixRemainingErrors() {
  console.log('🔧 Fixing remaining build errors...\n');

  // Fix SolidityVersionControl.ts
  const vcsPath = path.join(process.cwd(), 'lib/vcs/SolidityVersionControl.ts');
  try {
    console.log('📝 Fixing SolidityVersionControl.ts...');
    const cleanVCS = `/**
 * Solidity Version Control System
 * Provides version control functionality for Solidity contracts
 */

import { EventEmitter } from 'events';

export interface Commit {
  id: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  timestamp: Date;
  changes: Change[];
  parentId?: string;
}

export interface Change {
  type: 'add' | 'modify' | 'delete';
  path: string;
  content?: string;
  oldContent?: string;
}

export interface Branch {
  name: string;
  headCommitId: string;
}

export class SolidityVersionControl extends EventEmitter {
  private commits: Map<string, Commit> = new Map();
  private branches: Map<string, Branch> = new Map();
  private currentBranch: string = 'main';
  private workingChanges: Change[] = [];

  constructor() {
    super();
    // Initialize with main branch
    this.branches.set('main', {
      name: 'main',
      headCommitId: ''
    });
  }

  async commit(message: string, author: { name: string; email: string }): Promise<string> {
    const commitId = this.generateCommitId();
    const currentBranch = this.branches.get(this.currentBranch);
    
    const commit: Commit = {
      id: commitId,
      message,
      author,
      timestamp: new Date(),
      changes: [...this.workingChanges],
      parentId: currentBranch?.headCommitId
    };

    this.commits.set(commitId, commit);
    
    if (currentBranch) {
      currentBranch.headCommitId = commitId;
    }

    this.workingChanges = [];
    this.emit('commit', commit);
    
    return commitId;
  }

  async createBranch(name: string): Promise<void> {
    const currentBranch = this.branches.get(this.currentBranch);
    
    this.branches.set(name, {
      name,
      headCommitId: currentBranch?.headCommitId || ''
    });
    
    this.emit('branch-created', name);
  }

  async switchBranch(name: string): Promise<void> {
    if (!this.branches.has(name)) {
      throw new Error(\`Branch "\${name}" does not exist\`);
    }
    
    this.currentBranch = name;
    this.emit('branch-switched', name);
  }

  addChange(change: Change): void {
    this.workingChanges.push(change);
    this.emit('change-added', change);
  }

  getHistory(): Commit[] {
    const history: Commit[] = [];
    const currentBranch = this.branches.get(this.currentBranch);
    
    if (!currentBranch) return history;
    
    let commitId = currentBranch.headCommitId;
    
    while (commitId) {
      const commit = this.commits.get(commitId);
      if (!commit) break;
      
      history.push(commit);
      commitId = commit.parentId || '';
    }
    
    return history;
  }

  private generateCommitId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
`;
    await fs.writeFile(vcsPath, cleanVCS, 'utf8');
    console.log('✅ Fixed SolidityVersionControl.ts');
  } catch (error) {
    console.error('❌ Error fixing SolidityVersionControl.ts:', error.message);
  }

  // Fix geminiService.ts
  const geminiServicePath = path.join(process.cwd(), 'services/geminiService.ts');
  try {
    console.log('📝 Fixing geminiService.ts...');
    const cleanGeminiService = `/**
 * Gemini Service
 * Provides integration with Google's Gemini AI
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

interface ChatConfig {
  model?: string;
  systemInstruction?: string;
  safetySettings?: unknown[];
  history?: unknown[];
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

interface ContentConfig {
  contents?: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  safetySettings?: unknown[];
  [key: string]: unknown;
}

interface ImageConfig {
  prompt?: string;
  model?: string;
  numberOfImages?: number;
  outputMimeType?: string;
  aspectRatio?: string;
  safetySettings?: unknown[];
  [key: string]: unknown;
}

class RealGoogleGenAI {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(config: { apiKey: string }) {
    if (!config.apiKey) {
      throw new Error('Google Generative AI API key is required');
    }
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('Real GoogleGenAI initialized successfully');
  }

  chats = {
    create: (config: ChatConfig) => {
      const processedConfig = {
        model: config?.model || 'gemini-pro',
        systemInstruction: config?.systemInstruction || 'You are a helpful AI assistant.',
        safetySettings: config?.safetySettings || [],
        history: config?.history || [],
        temperature: config?.temperature || 0.7,
        maxTokens: config?.maxTokens || 2048,
        ...config
      };

      console.log('Chat created with config:', {
        model: processedConfig.model,
        hasSystemInstruction: !!processedConfig.systemInstruction,
        temperature: processedConfig.temperature,
        timestamp: Date.now()
      });

      return {
        sendMessage: async (message: string | { message?: string; content?: string; [key: string]: unknown }) => {
          try {
            const prompt = typeof message === 'string' 
              ? message 
              : (message.message || message.content || '');
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            
            return { text: response.text() };
          } catch (error) {
            console.error('Error in chat sendMessage:', error);
            return { 
              text: 'I apologize, but I encountered an error processing your request. Please try again.' 
            };
          }
        }
      };
    }
  };

  getModels() {
    return {
      generateContent: async (config: ContentConfig | string) => {
        try {
          const isString = typeof config === 'string';
          const prompt = isString ? config : (config.contents || config.prompt || '');
          
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          
          return {
            text: response.text(),
            candidates: response.candidates || [{ finishReason: 'STOP' }]
          };
        } catch (error) {
          console.error('Error in generateContent:', error);
          return {
            text: 'I apologize, but I encountered an error generating content. Please try again.',
            candidates: [{ finishReason: 'ERROR' }]
          };
        }
      },

      generateContentStream: async function* (
        config: ContentConfig | string
      ): AsyncGenerator<{ text: string; candidates: unknown[] }, void, unknown> {
        try {
          const isString = typeof config === 'string';
          const processedConfig = {
            prompt: isString ? config : (config.contents || config.prompt || ''),
            temperature: isString ? 0.7 : (config.temperature || 0.7),
            maxTokens: isString ? 2048 : (config.maxTokens || 2048),
            safetySettings: isString ? [] : (config.safetySettings || [])
          };

          console.log('Streaming content generation started:', {
            hasPrompt: !!processedConfig.prompt,
            temperature: processedConfig.temperature,
            timestamp: Date.now()
          });

          const result = await this.model.generateContentStream(processedConfig.prompt);
          let chunkCount = 0;

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            chunkCount++;
            
            if (chunkText) {
              yield {
                text: chunkText,
                candidates: chunk.candidates || [{ finishReason: 'CONTINUE' }]
              };
            }
          }

          console.log('Streaming completed:', { chunkCount, timestamp: Date.now() });
        } catch (error) {
          console.error('Error in generateContentStream:', error);
          yield {
            text: 'I apologize, but I encountered an error generating streaming content.',
            candidates: [{ finishReason: 'ERROR' }]
          };
        }
      },

      generateImages: async (config: ImageConfig | string) => {
        const isString = typeof config === 'string';
        const processedConfig = {
          prompt: isString ? config : (config.prompt || 'Generate a beautiful image'),
          model: isString ? 'imagen-3.0-generate-002' : (config.model || 'imagen-3.0-generate-002'),
          numberOfImages: isString ? 1 : (config.numberOfImages || 1),
          outputMimeType: isString ? 'image/png' : (config.outputMimeType || 'image/png'),
          aspectRatio: isString ? '1:1' : (config.aspectRatio || '1:1')
        };

        console.log('Image generation requested:', {
          hasPrompt: !!processedConfig.prompt,
          model: processedConfig.model,
          numberOfImages: processedConfig.numberOfImages,
          timestamp: Date.now()
        });

        const enhancedError = \`Image generation not supported with current model (\${processedConfig.model}). \` +
          \`Requested: \${processedConfig.numberOfImages} image(s) in \${processedConfig.outputMimeType} format. \` +
          \`Consider using a dedicated image generation service.\`;

        return {
          generatedImages: [],
          error: enhancedError,
          requestConfig: processedConfig
        };
      }
    };
  }
}

type Chat = unknown;
type GenerateContentResponse = unknown;

// Get API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log('🔧 Gemini Service - Real implementation');
console.log('- API Key configured:', !!GEMINI_API_KEY);

let ai: RealGoogleGenAI | null = null;
let initializationError: string | null = null;

// Wrap initialization in try-catch to prevent app crashes
try {
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY.trim() !== '') {
    ai = new RealGoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log("✅ Real Gemini AI initialized successfully");
  } else {
    console.warn("❌ Gemini API Key not found or invalid. AI features will be limited or unavailable.");
    initializationError = "Gemini API Key is not configured. AI features will be unavailable.";
  }
} catch (error) {
  console.error("Failed to initialize Gemini AI:", error);
  initializationError = error instanceof Error ? error.message : "Failed to initialize Gemini AI";
}

// Export the initialized AI instance
export { ai, initializationError };

// Export a default service object
export const geminiService = {
  ai,
  initializationError,
  isInitialized: !!ai && !initializationError
};
`;
    await fs.writeFile(geminiServicePath, cleanGeminiService, 'utf8');
    console.log('✅ Fixed geminiService.ts');
  } catch (error) {
    console.error('❌ Error fixing geminiService.ts:', error.message);
  }

  // Fix app/code/page.tsx
  const codePage = path.join(process.cwd(), 'app/code/page.tsx');
  try {
    const content = await fs.readFile(codePage, 'utf8');
    const lines = content.split('\n');
    
    // Find the line with just "();" and remove it
    const filteredLines = lines.filter(line => line.trim() !== '();');
    
    await fs.writeFile(codePage, filteredLines.join('\n'), 'utf8');
    console.log('✅ Fixed app/code/page.tsx');
  } catch (error) {
    console.error('❌ Error fixing app/code/page.tsx:', error.message);
  }

  console.log('\n✨ Remaining build fixes completed!');
}

// Run the fixes
fixRemainingErrors().catch(console.error);