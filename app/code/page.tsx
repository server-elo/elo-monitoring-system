import React, { ReactElement } from "react";
("use client");
import { ResponsiveCodeEditor } from "@/components/editor";
import { AICodeAssistant } from "@/components/ai/AICodeAssistant";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bot, X } from "lucide-react";
import { cn } from "@/lib/utils";
export default function CodeLabPage(): void {
  const [code, setCode] = useState("");
  const [showAssistant, setShowAssistant] = useState(true);
  const [isAssistantCollapsed, setIsAssistantCollapsed] = useState(false);
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    // Handle code changes if needed (e.g., auto-save)
    console.log("Code changed, length:", newCode.length);
  }, []);
  const handleApplySuggestion = useCallback((suggestion: string) => {
    // Apply AI suggestion to the code
    setCode((prevCode: unknown) => prevCode + "\n\n" + suggestion);
  }, []);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Solidity Code Lab
              </h1>
              <p className="text-gray-400">
                Write, compile, and analyze smart contracts with AI-powered
                assistance
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssistant(!showAssistant)}
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              {showAssistant ? "Hide" : "Show"} AI Assistant
            </Button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Editor Section */}
          <div
            className={cn(
              "flex-1 transition-all duration-300",
              showAssistant && !isAssistantCollapsed ? "pr-0" : "pr-0",
            )}
          >
            <ResponsiveCodeEditor
              onCodeChange={handleCodeChange}
              height="100%"
              className="h-full"
            />
          </div>
          {/* AI Assistant Section */}
          {showAssistant && (
            <div
              className={cn(
                "transition-all duration-300",
                isAssistantCollapsed ? "w-12" : "w-[400px]",
              )}
            >
              <AICodeAssistant
                code={code}
                onCodeChange={setCode}
                onApplySuggestion={handleApplySuggestion}
                className="h-full"
                isCollapsed={isAssistantCollapsed}
                onToggleCollapse={() =>
                  setIsAssistantCollapsed(!isAssistantCollapsed)
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
