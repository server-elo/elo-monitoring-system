"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code,
  FileText,
  GitBranch,
  Bug,
  Search,
  Terminal,
  Layers,
  Sidebar,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Accessibility,
  Sun,
  Moon,
  Zap,
  Command,
  AlertTriangle
} from "lucide-react";
import { AdvancedCollaborativeMonacoEditor } from "./AdvancedCollaborativeMonacoEditor";
import { SolidityDebuggerInterface } from "../debugging/SolidityDebuggerInterface";
import { VersionControlInterface } from "../vcs/VersionControlInterface";
import { GlassContainer } from "@/components/ui/Glass";
import { cn } from "@/lib/utils";
export interface IDELayout {
  leftSidebar: {
    visible: boolean;
    width: number;
    activePanel: "files" | "vcs" | "search" | "extensions";
  };
  rightSidebar: {
    visible: boolean;
    width: number;
    activePanel: "outline" | "debug" | "analysis";
  };
  bottomPanel: {
    visible: boolean;
    height: number;
    activeTab: "terminal" | "debug" | "problems" | "output";
  };
  editor: {
    splitMode: "single" | "horizontal" | "vertical";
    minimap: boolean;
    wordWrap: boolean;
  };
}
interface AdvancedIDEInterfaceProps {
  documentId: string;
  initialContent?: string;
  language?: string;
  theme?: "light" | "dark";
  className?: string;
  onSave?: (content: string) => void;
  onCompile?: (content: string) => void;
}
export function AdvancedIDEInterface({
  documentId,
  initialContent = "",
  language = "solidity",
  theme = "dark",
  className,
  onSave,
  onCompile
}: AdvancedIDEInterfaceProps): void {
  const [layout, setLayout] = useState<IDELayout>({
    leftSidebar: {
      visible: true,
      width: 250,
      activePanel: "files"
    },
    rightSidebar: {
      visible: false,
      width: 300,
      activePanel: "outline"
    },
    bottomPanel: {
      visible: true,
      height: 200,
      activeTab: "terminal"
    },
    editor: {
      splitMode: "single",
      minimap: true,
      wordWrap: false
    }
  });
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [editorContent, setEditorContent] = useState(initialContent);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  // Toggle sidebar visibility
  const toggleSidebar = useCallback((side: "left" | "right") => {
    setLayout((prev: unknown) => ({
      ...prev,
      [side === "left" ? "leftSidebar" : "rightSidebar"]: {
        ...prev[side === "left" ? "leftSidebar" : "rightSidebar"],
        visible:
        !prev[side === "left" ? "leftSidebar" : "rightSidebar"].visible
      }
    }));
  }, []);
  // Toggle bottom panel
  const toggleBottomPanel = useCallback(() => {
    setLayout((prev: unknown) => ({
      ...prev,
      bottomPanel: {
        ...prev.bottomPanel,
        visible: !prev.bottomPanel.visible
      }
    }));
  }, []);
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case ",
          b":
          e.preventDefault();
          toggleSidebar("left");
          break;
          case ",
          j":
          e.preventDefault();
          toggleBottomPanel();
          break;
          case ",
          p":
          e.preventDefault();
          setShowCommandPalette(!showCommandPalette);
          break;
          case ",
          s":
          e.preventDefault();
          if (onSave) onSave(editorContent);
          break;
          case ",
          Enter":
          e.preventDefault();
          if (onCompile) onCompile(editorContent);
          break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
  editorContent,
  onSave,
  onCompile,
  showCommandPalette,
  toggleSidebar,
  toggleBottomPanel
  ]);
  // Handle content change
  const handleContentChange = useCallback((content: string) => {
    setEditorContent(content);
  }, []);
  // Mock terminal command handler
  const handleTerminalCommand = useCallback((command: string) => {
    setTerminalOutput((prev: unknown) => [
    ...prev,
    `$ ${command}`,
    "Command executed successfully"
    ]);
  }, []);
  return (
    <div
    ref={containerRef}
    className={cn(
      "relative h-screen w-full overflow-hidden bg-gray-900",
      isFullscreen && "fixed inset-0 z-50",
      className,
    )}>{/* Top Bar */}
    <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/95 px-4 py-2">
    <div className="flex items-center gap-2">
    <Code className="h-5 w-5 text-blue-400" />
    <span className="text-sm font-medium text-gray-300">
    Solidity IDE
    </span>
    </div>
    <div className="flex items-center gap-2">
    {/* Theme Toggle */}
    <button
    onClick={() =>
    setCurrentTheme(currentTheme === "dark" ? "light" : "dark")
  }
  className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-300">{currentTheme === "dark" ? (
    <Sun className="h-4 w-4" />
  ) : (
    <Moon className="h-4 w-4" />
  )}
  </button>
  {/* Command Palette */}
  <button
  onClick={() => setShowCommandPalette(!showCommandPalette)}
  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-300"><Command className="h-3 w-3" />
  <span>Cmd+P</span>
  </button>
  {/* Layout Controls */}
  <div className="flex items-center gap-1">
  <button
  onClick={() => toggleSidebar("left")}
  className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-300"><Sidebar className="h-4 w-4" />
  </button>
  <button
  onClick={() => toggleBottomPanel()}
  className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-300"><Terminal className="h-4 w-4" />
  </button>
  </div>
  </div>
  </div>
  {/* Main Layout */}
  <div className="flex h-[calc(100vh-40px)]">
  {/* Left Sidebar */}
  <AnimatePresence>
  {layout.leftSidebar.visible && (
    <motion.div
    initial={{ x: -layout.leftSidebar.width }}
    animate={{ x: 0 }}
    exit={{ x: -layout.leftSidebar.width }}
    transition={{ type: "spring", damping: 20 }}
    style={{ width: layout.leftSidebar.width }}
    className="border-r border-gray-800 bg-gray-950">{/* Sidebar Tabs */}
    <div className="flex border-b border-gray-800">
    <button
    onClick={() =>
    setLayout((prev: unknown) => ({
      ...prev,
      leftSidebar: {
        ...prev.leftSidebar,
        activePanel: "files"
      }
    }))
  }
  className={cn(
    "flex-1 px-2 py-2 text-xs",
    layout.leftSidebar.activePanel === "files"
    ? "border-b-2 border-blue-400 text-blue-400"
    : "text-gray-400 hover:text-gray-300",
  )}><FileText className="mx-auto h-4 w-4" />
  </button>
  <button
  onClick={() =>
  setLayout((prev: unknown) => ({
    ...prev,
    leftSidebar: { ...prev.leftSidebar, activePanel: "vcs" }
  }))
}
className={cn(
  "flex-1 px-2 py-2 text-xs",
  layout.leftSidebar.activePanel === "vcs"
  ? "border-b-2 border-blue-400 text-blue-400"
  : "text-gray-400 hover:text-gray-300",
)}><GitBranch className="mx-auto h-4 w-4" />
</button>
<button
onClick={() =>
setLayout((prev: unknown) => ({
  ...prev,
  leftSidebar: {
    ...prev.leftSidebar,
    activePanel: "search"
  }
}))
}
className={cn(
  "flex-1 px-2 py-2 text-xs",
  layout.leftSidebar.activePanel === "search"
  ? "border-b-2 border-blue-400 text-blue-400"
  : "text-gray-400 hover:text-gray-300",
)}><Search className="mx-auto h-4 w-4" />
</button>
</div>
{/* Sidebar Content */}
<div className="p-4">
{layout.leftSidebar.activePanel === "files" && (
  <div className="text-sm text-gray-400">
  <div className="mb-2 font-medium">Explorer</div>
  <div className="space-y-1">
  <div className="cursor-pointer rounded px-2 py-1 hover:bg-gray-800">
  📁 contracts/
  </div>
  <div className="pl-4">
  <div className="cursor-pointer rounded px-2 py-1 hover:bg-gray-800">
  📄 MyToken.sol
  </div>
  </div>
  </div>
  </div>
)}
{layout.leftSidebar.activePanel === "vcs" && (
  <VersionControlInterface />
)}
{layout.leftSidebar.activePanel === "search" && (
  <div className="text-sm text-gray-400">
  <input
  type="text"
  placeholder="Search..."
  className="w-full rounded bg-gray-800 px-2 py-1 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
  />
  </div>
)}
</div>
</motion.div>
)}
</AnimatePresence>
{/* Editor Area */}
<div className="flex flex-1 flex-col">
<div className="flex-1">
<AdvancedCollaborativeMonacoEditor
documentId={documentId}
initialContent={initialContent}
language={language}
theme={currentTheme === "dark" ? "vs-dark" : "vs"}
height="100%"
showMinimap={layout.editor.minimap}
onContentChange={handleContentChange}
/>
</div>
{/* Bottom Panel */}
<AnimatePresence>
{layout.bottomPanel.visible && (
  <motion.div
  initial={{ y: layout.bottomPanel.height }}
  animate={{ y: 0 }}
  exit={{ y: layout.bottomPanel.height }}
  transition={{ type: "spring", damping: 20 }}
  style={{ height: layout.bottomPanel.height }}
  className="border-t border-gray-800 bg-gray-950">{/* Panel Tabs */}
  <div className="flex border-b border-gray-800">
  <button
  onClick={() =>
  setLayout((prev: unknown) => ({
    ...prev,
    bottomPanel: {
      ...prev.bottomPanel,
      activeTab: "terminal"
    }
  }))
}
className={cn(
  "px-4 py-1.5 text-xs",
  layout.bottomPanel.activeTab === "terminal"
  ? "border-b-2 border-blue-400 text-blue-400"
  : "text-gray-400 hover:text-gray-300",
)}>Terminal
</button>
<button
onClick={() =>
setLayout((prev: unknown) => ({
  ...prev,
  bottomPanel: {
    ...prev.bottomPanel,
    activeTab: "problems"
  }
}))
}
className={cn(
  "px-4 py-1.5 text-xs",
  layout.bottomPanel.activeTab === "problems"
  ? "border-b-2 border-blue-400 text-blue-400"
  : "text-gray-400 hover:text-gray-300",
)}>Problems {problems.length>0 && `(${problems.length})`}
</button>
<button
onClick={() =>
setLayout((prev: unknown) => ({
  ...prev,
  bottomPanel: {
    ...prev.bottomPanel,
    activeTab: "debug"
  }
}))
}
className={cn(
  "px-4 py-1.5 text-xs",
  layout.bottomPanel.activeTab === "debug"
  ? "border-b-2 border-blue-400 text-blue-400"
  : "text-gray-400 hover:text-gray-300",
)}>Debug
</button>
</div>
{/* Panel Content */}
<div className="h-[calc(100%-32px)] overflow-y-auto p-2">
{layout.bottomPanel.activeTab === "terminal" && (
  <div className="font-mono text-xs text-gray-300">
  {terminalOutput.map((line, i) => (
    <div key={i}>{line}</div>
  ))}
  <div className="flex items-center">
  <span className="text-green-400">$</span>
  <input
  type="text"
  className="ml-2 flex-1 bg-transparent outline-none"
  placeholder="Enter command..."
  onKeyDown={(e: unknown) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      handleTerminalCommand(e.currentTarget.value);
      e.currentTarget.value = "";
    }
  }}
  />
  </div>
  </div>
)}
{layout.bottomPanel.activeTab === "problems" && (
  <div className="space-y-2 text-xs">
  {problems.length === 0 ? (
    <div className="text-gray-500">
    No problems detected
    </div>
  ) : (
    problems.map((problem, i) => (
      <div key={i} className="flex items-start gap-2">
      <AlertTriangle className="h-3 w-3 text-yellow-400" />
      <div>
      <div className="text-gray-300">
      {problem.message}
      </div>
      <div className="text-gray-500">
      Line {problem.line}
      </div>
      </div>
      </div>
    ))
  )}
  </div>
)}
{layout.bottomPanel.activeTab === "debug" && (
  <SolidityDebuggerInterface />
)}
</div>
</motion.div>
)}
</AnimatePresence>
</div>
{/* Right Sidebar */}
<AnimatePresence>
{layout.rightSidebar.visible && (
  <motion.div
  initial={{ x: layout.rightSidebar.width }}
  animate={{ x: 0 }}
  exit={{ x: layout.rightSidebar.width }}
  transition={{ type: "spring", damping: 20 }}
  style={{ width: layout.rightSidebar.width }}
  className="border-l border-gray-800 bg-gray-950"><div className="p-4">
  <div className="text-sm font-medium text-gray-400">Outline</div>
  </div>
  </motion.div>
)}
</AnimatePresence>
</div>
{/* Command Palette */}
<AnimatePresence>
{showCommandPalette && (
  <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="absolute inset-0 z-50 flex items-start justify-center bg-black/50 pt-32"
  onClick={() => setShowCommandPalette(false)}><motion.div
  initial={{ scale: 0.95, y: -20 }}
  animate={{ scale: 1, y: 0 }}
  exit={{ scale: 0.95, y: -20 }}
  onClick={(e: unknown) => e.stopPropagation()}
  className="w-full max-w-2xl"><GlassContainer className="p-4">
  <input
  type="text"
  placeholder="Type a command..."
  className="w-full bg-transparent text-lg outline-none"
  autoFocus
  />
  <div className="mt-4 space-y-2">
  <div className="cursor-pointer rounded px-3 py-2 hover:bg-white/10">
  <div className="font-medium">Compile Contract</div>
  <div className="text-xs text-gray-400">Ctrl+Enter</div>
  </div>
  <div className="cursor-pointer rounded px-3 py-2 hover:bg-white/10">
  <div className="font-medium">Save File</div>
  <div className="text-xs text-gray-400">Ctrl+S</div>
  </div>
  </div>
  </GlassContainer>
  </motion.div>
  </motion.div>
)}
</AnimatePresence>
</div>
);
}
