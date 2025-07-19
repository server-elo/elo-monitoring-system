
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Real Google Generative AI implementation
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
    create: (config: { model?: string; systemInstruction?: string; safetySettings?: any[]; history?: any[]; temperature?: number; maxTokens?: number; [key: string]: any }) => {
      // Enhanced config processing with logging and validation
      const processedConfig = {
        model: config?.model || 'gemini-pro',
        systemInstruction: config?.systemInstruction || 'You are a helpful AI assistant.',
        safetySettings: config?.safetySettings || [],
        history: config?.history || [],
        temperature: config?.temperature || 0.7,
        maxTokens: config?.maxTokens || 2048,
        ...config
      };

      // Log configuration for analytics
      console.log('Chat created with config:', {
        model: processedConfig.model,
        hasSystemInstruction: !!processedConfig.systemInstruction,
        safetySettingsCount: processedConfig.safetySettings.length,
        historyLength: processedConfig.history.length,
        temperature: processedConfig.temperature,
        timestamp: Date.now()
      });

      // Store config analytics
      if (typeof localStorage !== 'undefined') {
        const configAnalytics = JSON.parse(localStorage.getItem('gemini-config-analytics') || '[]');
        configAnalytics.push({
          type: 'chat-create',
          config: processedConfig,
          timestamp: Date.now()
        });
        localStorage.setItem('gemini-config-analytics', JSON.stringify(configAnalytics.slice(-50)));
      }

      return {
        sendMessage: async (message: string | { message?: string; content?: string; [key: string]: any }) => {
          try {
            const prompt = typeof message === 'string' ? message : message.message || message.content;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return {
              text: response.text()
            };
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

  models = {
    generateContent: async (config: { contents?: string; prompt?: string; [key: string]: any } | string) => {
      try {
        const prompt = config.contents || config.prompt || config;
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
    generateContentStream: async function* (config: { contents?: string; prompt?: string; temperature?: number; maxTokens?: number; safetySettings?: any[]; [key: string]: any } | string): AsyncGenerator<{ text: string; candidates: any[] }, void, unknown> {
      try {
        // Enhanced config processing with validation and analytics
        const processedConfig = {
          prompt: config.contents || config.prompt || config,
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 2048,
          safetySettings: config.safetySettings || [],
          ...config
        };

        // Log streaming request for analytics
        console.log('Streaming content generation started:', {
          hasPrompt: !!processedConfig.prompt,
          temperature: processedConfig.temperature,
          maxTokens: processedConfig.maxTokens,
          timestamp: Date.now()
        });

        // Store streaming analytics
        if (typeof localStorage !== 'undefined') {
          const streamAnalytics = JSON.parse(localStorage.getItem('gemini-stream-analytics') || '[]');
          streamAnalytics.push({
            type: 'stream-start',
            config: processedConfig,
            timestamp: Date.now()
          });
          localStorage.setItem('gemini-stream-analytics', JSON.stringify(streamAnalytics.slice(-30)));
        }

        const result = await this.model.generateContentStream(processedConfig.prompt);
        let chunkCount = 0;

        for await (const chunk of result.stream) {
          const chunkText: string = chunk.text();
          chunkCount++;

          if (chunkText) {
            yield {
              text: chunkText,
              candidates: chunk.candidates || [{ finishReason: 'CONTINUE' }]
            };
          }
        }

        // Log completion analytics
        console.log('Streaming completed:', { chunkCount, timestamp: Date.now() });

      } catch (error) {
        console.error('Error in generateContentStream:', error);
        yield {
          text: 'I apologize, but I encountered an error generating streaming content.',
          candidates: [{ finishReason: 'ERROR' }]
        };
      }
    },
    generateImages: async (config: { prompt?: string; model?: string; numberOfImages?: number; outputMimeType?: string; aspectRatio?: string; [key: string]: any } | string) => {
      // Enhanced config processing for image generation
      const processedConfig = {
        prompt: config.prompt || config,
        model: config.model || 'imagen-3.0-generate-002',
        numberOfImages: config.numberOfImages || 1,
        outputMimeType: config.outputMimeType || 'image/png',
        aspectRatio: config.aspectRatio || '1:1',
        safetySettings: config.safetySettings || [],
        ...config
      };

      // Log image generation request for analytics
      console.log('Image generation requested:', {
        hasPrompt: !!processedConfig.prompt,
        model: processedConfig.model,
        numberOfImages: processedConfig.numberOfImages,
        outputMimeType: processedConfig.outputMimeType,
        aspectRatio: processedConfig.aspectRatio,
        timestamp: Date.now()
      });

      // Store image generation analytics
      if (typeof localStorage !== 'undefined') {
        const imageAnalytics = JSON.parse(localStorage.getItem('gemini-image-analytics') || '[]');
        imageAnalytics.push({
          type: 'image-generation-request',
          config: processedConfig,
          timestamp: Date.now(),
          status: 'not-supported'
        });
        localStorage.setItem('gemini-image-analytics', JSON.stringify(imageAnalytics.slice(-20)));
      }

      // Note: Gemini Pro doesn't support image generation
      // This would require a different model or service
      // But we can provide enhanced error information based on config
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

type Chat = any;
type GenerateContentResponse = any;

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
    initializationError = "Gemini API Key is not configured. AI features will be unavailable. Please ensure the GEMINI_API_KEY environment variable is correctly set.";
  }
} catch (error) {
  console.error("❌ Failed to initialize Gemini AI:", error);
  initializationError = `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
  ai = null;
}

let chat: Chat | null = null;

const TEXT_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
const IMAGE_MODEL_NAME = 'imagen-3.0-generate-002';

const CHAT_SYSTEM_INSTRUCTION_BASE = `You are an expert AI assistant specializing in Solidity, smart contract development, Ethereum, and general blockchain technologies. 
Your goal is to help users learn and understand these complex topics. 
Provide clear, concise, and accurate explanations. When asked for code, provide functional Solidity examples using recent compiler versions (e.g., ^0.8.20).
Be patient and break down complex ideas into smaller, understandable parts.
When formatting code, use markdown code blocks. For Solidity, specify 'solidity'.
Example:
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 public storedData;

    function set(uint256 x) public {
        storedData = x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}
\`\`\`
`;

// Safety settings to block harmful content (using mock values)
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];


export const initializeChatForModule = async (moduleTitle: string, geminiPromptSeed?: string): Promise<string | null> => {
  if (!ai) {
    return initializationError || "Gemini AI Service not initialized. API Key may be missing.";
  }

  let systemInstruction = CHAT_SYSTEM_INSTRUCTION_BASE;
  if (moduleTitle) {
    systemInstruction += `\n\nThe user is currently focusing on the learning module: "${moduleTitle}". Please tailor your explanations and examples to this topic where relevant.`;
  }
  if (geminiPromptSeed) {
     systemInstruction += `\n\nConsider this initial prompt related to the module: "${geminiPromptSeed}"`;
  }
  
  try {
    chat = ai.chats.create({
      model: TEXT_MODEL_NAME,
      config: { 
        systemInstruction: systemInstruction,
        safetySettings: safetySettings, 
      },
      history: [], // Start with an empty history; App.tsx handles the initial greeting message.
    });
    return null; // No error
  } catch (error) {
    console.error("Error initializing Gemini chat:", error);
    if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('permission denied')) {
            return "Error: The Gemini API key is invalid or lacks permissions. Please check your configuration.";
        }
        return `Error initializing AI assistant: ${error.message}`;
    }
    return "An unexpected error occurred while initializing the AI assistant.";
  }
};

export const sendMessageToGeminiChat = async (message: string): Promise<string> => {
  if (!ai) {
    return "Gemini AI Service not initialized. API Key may be missing.";
  }
  if (!chat) {
    // Attempt to re-initialize if chat is null, e.g., after an error or if not called before.
    const initError = await initializeChatForModule("General Blockchain Topics"); 
    if (initError || !chat) { // Check !chat again in case initError was null but chat still failed to set.
        return initError || "Failed to initialize chat session. Please try selecting a module again.";
    }
  }
  
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message: message });
    return response.text || "AI response was empty";
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('permission denied')) {
            return "Error: The Gemini API key is invalid or lacks permissions. Please check your configuration.";
        }
        // Handle cases where the model might be blocked due to safety or other reasons.
        // The specific error message or structure might vary based on the SDK version and error type.
        if (error.message.toLowerCase().includes('blocked') || error.message.toLowerCase().includes('safety')) {
             return "Error: The AI's response was blocked. This might be due to safety filters or the nature of the request. Please try rephrasing or a different question.";
        }
        return `Error communicating with AI: ${error.message}. Please try again.`;
    }
    return "An unexpected error occurred while communicating with the AI.";
  }
};

export const generateDiagramForConcept = async (prompt: string): Promise<{ base64Image?: string; error?: string }> => {
  if (!ai) {
    return { error: "Gemini AI Service not initialized. API Key may be missing." };
  }
  try {
    const response = await ai.models.generateImages({
        model: IMAGE_MODEL_NAME,
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png' },
        // safetySettings are not directly part of generateImages config based on current guidelines for this specific model type.
        // However, the Gemini API for image generation inherently applies safety filters.
        // We'll rely on the API's error handling or response structure to indicate safety blocks.
    });

    if (response.generatedImages && response.generatedImages.length > 0 && (response.generatedImages[0] as any)?.image?.imageBytes) {
        const base64ImageBytes = (response.generatedImages[0] as any).image.imageBytes;
        return { base64Image: `data:image/png;base64,${base64ImageBytes}` };
    } else {
         // Check for explicit blocking in the response structure if available
        // The exact structure for indicating a safety block might vary.
        // For instance, if `generatedImages` is empty but there's a reason field, or if an error is thrown.
        // This is a speculative check based on common API patterns.
        if (response.generatedImages && response.generatedImages.length > 0 && (response.generatedImages[0] as any).finishReason === 'SAFETY') {
            return { error: "The image generation request was blocked by safety filters. Please rephrase your prompt." };
        }
        if ((response as any).error && (response as any).error.message && (response as any).error.message.toLowerCase().includes('safety')) {
           return { error: "The image generation request was blocked by safety filters. Please rephrase your prompt." };
        }
        return { error: "AI did not return an image. This could be due to safety filters, prompt complexity, or an issue with the image generation service. Please try a different prompt."};
    }
  } catch (error) {
    console.error("Error generating diagram with Gemini:", error);
    if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('permission denied')) {
            return { error: "Error: The Gemini API key is invalid or lacks permissions for image generation."};
        }
         if (error.message.toLowerCase().includes('prompt') && (error.message.toLowerCase().includes('blocked') || error.message.toLowerCase().includes('safety'))) {
            return { error: "The prompt was blocked by safety filters. Please rephrase your request." };
        }
        // Check for specific error codes or messages related to safety if the SDK provides them
        if ((error as any).code === 'BLOCKED_BY_SAFETY_FILTER' || (error as any).status === 'BLOCKED_PROMPT') {
           return { error: "The image generation request was blocked by safety filters. Please rephrase your prompt." };
        }
        return { error: `Error generating diagram: ${error.message}` };
    }
    return { error: "An unexpected error occurred while generating the diagram." };
  }
};


// This function is kept as an example of direct content generation if needed,
// but the chat interface is primary for this app.
export const getTopicExplanation = async (topic: string, details: string): Promise<string> => {
  if (!ai) {
    return "Gemini AI Service not initialized. API Key may be missing.";
  }
  try {
    const prompt = `Explain the following blockchain/Solidity topic: "${topic}". Specific details or question: "${details}". Provide a comprehensive yet easy-to-understand explanation formatted with markdown.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: TEXT_MODEL_NAME,
        contents: prompt,
        config: {
            systemInstruction: CHAT_SYSTEM_INSTRUCTION_BASE,
            safetySettings: safetySettings,
            // Add other configs like temperature if needed, but keep it simple for now
        }
    });

    // Check if the response was blocked
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason === 'SAFETY') {
        return "Error: The AI's response was blocked due to safety settings. Please try rephrasing your query.";
    }
    if (!response.text && response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason !== 'STOP') {
        return `Error: AI could not generate a response. Reason: ${response.candidates[0].finishReason}. Please try again.`;
    }
    
    return response.text || "AI response was empty";
  } catch (error) {
    console.error("Error getting topic explanation from Gemini:", error);
    if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('permission denied')) {
            return "Error: The Gemini API key is invalid or lacks permissions. Please check your configuration.";
        }
        if (error.message.toLowerCase().includes('blocked') || error.message.toLowerCase().includes('safety')) {
             return "Error: The request was blocked. This might be due to safety filters or the nature of the request. Please try rephrasing.";
        }
        return `Error fetching explanation: ${error.message}`;
    }
    return "An unexpected error occurred while fetching explanation.";
  }
};
