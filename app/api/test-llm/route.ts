// API endpoint to test multi-LLM setup
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/api/logger';
import { LLMModelsResponse } from '@/lib/api/types';

export async function GET() {
  try {
    // Test all LLM servers
    const servers = [
      { name: 'CodeLlama 34B', port: 1234, model: 'codellama-34b-instruct' },
      { name: 'Mixtral 8x7B', port: 1235, model: 'mixtral-8x7b-instruct' },
      { name: 'Llama 3.1 8B', port: 1236, model: 'llama-3.1-8b-instruct' }
    ];

    const results = await Promise.allSettled(
      servers.map(async (server) => {
        try {
          const response = await fetch(`http://localhost:${server.port}/v1/models`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(3000)
          });

          if (response.ok) {
            const models: LLMModelsResponse = await response.json();
            return {
              ...server,
              status: 'online',
              models: models.data?.map((m) => m.id) || []
            };
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          return {
            ...server,
            status: 'offline',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const serverStatus = results.map((result, index) =>
      result.status === 'fulfilled' ? result.value : {
        ...servers[index],
        status: 'offline',
        error: 'Connection failed'
      }
    );

    const onlineServers = serverStatus.filter(s => s.status === 'online');
    const offlineServers = serverStatus.filter(s => s.status === 'offline');

    return NextResponse.json({
      status: onlineServers.length > 0 ? 'partial' : 'offline',
      message: `${onlineServers.length}/${servers.length} LLM servers online`,
      servers: serverStatus,
      summary: {
        online: onlineServers.length,
        offline: offlineServers.length,
        total: servers.length
      },
      instructions: offlineServers.length > 0 ? [
        '1. Start LM Studio application',
        '2. Load the required models',
        '3. Start servers on the specified ports',
        '4. Run: ./monitor-llm-servers.sh for detailed status'
      ] : [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check LLM server status',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

interface TestRequest {
  prompt: string;
  type?: 'code' | 'explanation' | 'quick';
  service?: 'codellama' | 'mixtral' | 'llama' | 'auto';
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, type: _type = 'code', service = 'auto' }: TestRequest = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Simple test implementation without full MultiLLMManager
    const services = {
      codellama: { port: 1234, model: 'codellama-34b-instruct' },
      mixtral: { port: 1235, model: 'mixtral-8x7b-instruct' },
      llama: { port: 1236, model: 'llama-3.1-8b-instruct' }
    };

    // Auto-select service based on type
    let selectedService = service;
    if (service === 'auto') {
      const promptLower = prompt.toLowerCase();
      if (promptLower.includes('solidity') || promptLower.includes('contract') || promptLower.includes('function')) {
        selectedService = 'codellama';
      } else if (prompt.length < 50) {
        selectedService = 'llama';
      } else {
        selectedService = 'mixtral';
      }
    }

    const serviceConfig = services[selectedService as keyof typeof services];
    if (!serviceConfig) {
      return NextResponse.json(
        { error: 'Invalid service specified' },
        { status: 400 }
      );
    }

    // Test the LLM service
    const startTime = Date.now();
    
    const response = await fetch(`http://localhost:${serviceConfig.port}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: serviceConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert Solidity developer and blockchain educator.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`LLM service responded with status: ${response.status}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      response: data.choices[0].message.content,
      metadata: {
        service: selectedService,
        model: serviceConfig.model,
        responseTime,
        tokensUsed: data.usage?.total_tokens
      }
    });

  } catch (error) {
    logger.error('LLM test error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'llm-test'
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      { 
        error: 'Failed to connect to LLM service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


