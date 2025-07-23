import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { solidityMonitor } from "@/lib/monitoring/agentops";
import { getServerSession } from "next-auth";
// Request validation schema
const requestSchema = z.object({
  message: z.string().min(1).max(1000),
  code: z.string().optional(),
  context: z
    .object({
      line: z.number().optional(),
      selection: z.string().optional(),
      fileName: z.string().optional(),
    })
    .optional(),
  type: z.enum(["chat", "analyze", "suggest", "fix"]).default("chat"),
});
// Mock AI responses for different query types
const generateAIResponse = (message: string, code?: string, type?: string) => {
  const lowerMessage = message.toLowerCase();
  // Security-related queries
  if (
    lowerMessage.includes("security") ||
    lowerMessage.includes("vulnerable")
  ) {
    return {
      response: `I've analyzed your code for security vulnerabilities. Here are my findings:
      **High Priority Issues:**
      1. **Reentrancy Vulnerability** (Line 45): The withdraw function modifies state after external calls. Use the checks-effects-interactions pattern.
      2. **Missing Access Control** (Line 23): Public functions that modify state should have proper access controls.
      **Recommendations:**;
      - Implement ReentrancyGuard from OpenZeppelin
      - Add role-based access control
      - Use latest Solidity version for built-in overflow protection
      Would you like me to show you how to fix these issues?`,
      metadata: {
        severity: "high",
        category: "security",
        suggestions: [
          "Add ReentrancyGuard modifier",
          "Implement access controls",
          "Update Solidity version",
        ],
      },
    };
  }
  // Gas optimization queries
  if (lowerMessage.includes("gas") || lowerMessage.includes("optimize")) {
    return {
      response: `I've identified several gas optimization opportunities:
      **Storage Optimizations:**
      1. **Pack struct variables** (Line 15): Reorder variables to use fewer storage slots
      - Current: 3 slots, Optimized: 2 slots
      - Savings: ~20,000 gas per transaction
      2. **Use mappings over arrays** (Line 32): For lookups, mappings are more efficient
      - Savings: ~5,000 gas per lookup
      **Function Optimizations:**
      1. **Cache array length** (Line 48): Store length in memory before loops
      2. **Use unchecked blocks** for safe arithmetic operations
      3. **Short-circuit expensive operations**
      Estimated total savings: ~35,000 gas per transaction`,
      metadata: {
        category: "optimization",
        estimatedSavings: 35000,
      },
    };
  }
  // Error fixing queries
  if (lowerMessage.includes("error") || lowerMessage.includes("fix")) {
    return {
      response: `I can help you fix compilation errors. Common Solidity errors include:
      **Syntax Errors:**
      - Missing semicolons or brackets
      - Incorrect function signatures
      - Invalid type conversions
      **Logic Errors:**
      - Uninitialized variables
      - Division by zero possibilities
      - Incorrect visibility modifiers
      Please share the specific error message you're seeing, and I'll provide a targeted solution.`,
      metadata: {
        category: "debugging",
      },
    };
  }
  // Code explanation queries
  if (lowerMessage.includes("explain") || lowerMessage.includes("what does")) {
    return {
      response: `I'll explain the code structure and functionality:
      **Contract Overview:**
      Your contract implements a basic storage pattern with owner-based access control.
      **Key Components:**
      1. **State Variables**: Store data persistently on the blockchain
      2. **Constructor**: Initializes the contract and sets the owner
      3. **Modifiers**: Provide reusable access control logic
      4. **Events**: Enable efficient filtering of blockchain data
      **Best Practices Used:**
      - Explicit visibility declarations
      - Event emissions for state changes
      - Access control patterns
      Would you like me to explain any specific part in more detail?`,
      metadata: {
        category: "explanation",
      },
    };
  }
  // Default response
  return {
    response: `I'm your AI Solidity assistant! I can help with:
    • **Security Analysis**: Identify vulnerabilities and suggest fixes
    • **Gas Optimization**: Find ways to reduce transaction costs
    • **Error Resolution**: Debug compilation and runtime errors
    • **Code Explanation**: Understand complex Solidity patterns
    • **Best Practices**: Apply industry standards and patterns
    What would you like help with today?`,
    metadata: {
      category: "general",
    },
  };
};
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId = 'anonymous';
  
  try {
    // Get user session
    const session = await getServerSession();
    userId = session?.user?.id || 'anonymous';
    
    const body = await request.json();
    // Validate request
    const validatedData = requestSchema.parse(body);
    
    // Start AgentOps session
    await solidityMonitor.startCodeAssistantSession(userId, validatedData.message);
    
    // Generate AI response (mock for now)
    const aiResponse = generateAIResponse(
      validatedData.message,
      validatedData.code,
      validatedData.type,
    );
    
    // Track code generation if applicable
    if (validatedData.type === 'suggest' || validatedData.type === 'fix') {
      await solidityMonitor.trackCodeGeneration(userId, {
        language: 'solidity',
        complexity: aiResponse.metadata.category || 'general',
        lines_generated: aiResponse.response.split('\n').length,
        execution_time: Date.now() - startTime
      });
    }
    
    // Track tool usage
    await solidityMonitor.trackToolUsage(userId, 'ai-code-assistant', {
      type: validatedData.type,
      category: aiResponse.metadata.category,
      hasCode: !!validatedData.code
    });
    
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // End session successfully
    await solidityMonitor.endSession(userId, 'success', {
      response_time: Date.now() - startTime,
      category: aiResponse.metadata.category
    });
    
    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse.response,
        metadata: aiResponse.metadata,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }
    // Track error in monitoring
    await solidityMonitor.trackError(error as Error, {
      userId,
      endpoint: 'ai-code-assistant',
      method: 'POST'
    });
    
    // End session with error
    await solidityMonitor.endSession(userId, 'error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.error("AI Assistant error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
// Code analysis endpoint
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  let userId = 'anonymous';
  
  try {
    // Get user session
    const session = await getServerSession();
    userId = session?.user?.id || 'anonymous';
    
    const body = await request.json();
    const { code } = body;
    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Code is required for analysis",
        },
        { status: 400 },
      );
    }
    
    // Start monitoring session
    await solidityMonitor.startCodeAssistantSession(userId, 'code-analysis');
    // Mock analysis results
    const analysis = {
      security: {
        issues: [
          {
            type: "Reentrancy",
            severity: "high",
            line: 45,
            message: "State changes after external call",
            fix: "Move state changes before external calls",
          },
          {
            type: "Unchecked Return",
            severity: "medium",
            line: 23,
            message: "Return value not checked",
            fix: "Check return values from external calls",
          },
        ],
        score: 65,
      },
      gas: {
        optimizations: [
          {
            type: "Storage Packing",
            line: 8,
            currentCost: 20000,
            optimizedCost: 15000,
            savings: 5000,
          },
          {
            type: "Loop Caching",
            line: 32,
            currentCost: 3000,
            optimizedCost: 2000,
            savings: 1000,
          },
        ],
        totalSavings: 6000,
      },
      quality: {
        score: 78,
        readability: 85,
        maintainability: 72,
        testability: 68,
        documentation: 82,
      },
    };
    
    // Track code analysis
    await solidityMonitor.trackCodeAnalysis(userId, {
      contract_name: 'analyzed-contract',
      vulnerabilities_found: analysis.security.issues.length,
      gas_optimization_suggestions: analysis.gas.optimizations.length,
      execution_time: Date.now() - startTime
    });
    
    // Track tool usage
    await solidityMonitor.trackToolUsage(userId, 'code-analyzer', {
      security_score: analysis.security.score,
      quality_score: analysis.quality.score,
      total_savings: analysis.gas.totalSavings
    });
    
    // End session successfully
    await solidityMonitor.endSession(userId, 'success', {
      response_time: Date.now() - startTime,
      issues_found: analysis.security.issues.length + analysis.gas.optimizations.length
    });
    
    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Track error
    await solidityMonitor.trackError(error as Error, {
      userId,
      endpoint: 'ai-code-assistant',
      method: 'PUT'
    });
    
    // End session with error
    await solidityMonitor.endSession(userId, 'error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.error("Code analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Analysis failed",
      },
      { status: 500 },
    );
  }
}
