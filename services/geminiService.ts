/**
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

        const enhancedError = `Image generation not supported with current model (${processedConfig.model}). ` +
          `Requested: ${processedConfig.numberOfImages} image(s) in ${processedConfig.outputMimeType} format. ` +
          `Consider using a dedicated image generation service.`;

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

// Export missing functions needed by other modules
export const initializeChatForModule = async (moduleId: string): Promise<string> => {
  return `chat-${moduleId}`;
};

export const sendMessageToGeminiChat = async (message: string): Promise<string> => {
  if (ai) {
    try {
      const models = ai.getModels();
      const result = await models.generateContent(message);
      return result.text;
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      return `Error processing message: ${message}`;
    }
  }
  return `Mock response to: ${message}`;
};

// Export a default service object
export const geminiService = {
  ai,
  initializationError,
  isInitialized: !!ai && !initializationError,
  initializeChatForModule,
  sendMessageToGeminiChat
};
