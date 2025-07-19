'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, FileText, GitBranch, Bug, Search, Terminal, Layers, Sidebar, SplitSquareHorizontal, SplitSquareVertical, Accessibility, Sun, Moon, Zap, Command, AlertTriangle } from 'lucide-react';
import { AdvancedCollaborativeMonacoEditor } from './AdvancedCollaborativeMonacoEditor';
import { SolidityDebuggerInterface } from '../debugging/SolidityDebuggerInterface';
import { VersionControlInterface } from '../vcs/VersionControlInterface';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

export interface IDELayout {
  leftSidebar: {
    visible: boolean;
    width: number;
    activePanel: 'files' | 'vcs' | 'search' | 'extensions';
  };
  rightSidebar: {
    visible: boolean;
    width: number;
    activePanel: 'outline' | 'debug' | 'analysis';
  };
  bottomPanel: {
    visible: boolean;
    height: number;
    activeTab: 'terminal' | 'debug' | 'problems' | 'output';
  };
  editor: {
    splitMode: 'single' | 'horizontal' | 'vertical';
    minimap: boolean;
    wordWrap: boolean;
    lineNumbers: boolean;
  };
  theme: 'dark' | 'light' | 'auto' | 'high-contrast';
  accessibility: {
    screenReader: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: number;
  };
}

export interface AdvancedIDEInterfaceProps {
  documentId: string;
  repositoryId: string;
  repositoryName: string;
  initialContent?: string;
  onLayoutChange?: (layout: IDELayout) => void;
  className?: string;
}

const defaultLayout: IDELayout = {
  leftSidebar: {
    visible: true,
    width: 300,
    activePanel: 'files'
  },
  rightSidebar: {
    visible: true,
    width: 300,
    activePanel: 'outline'
  },
  bottomPanel: {
    visible: true,
    height: 200,
    activeTab: 'terminal'
  },
  editor: {
    splitMode: 'single',
    minimap: true,
    wordWrap: true,
    lineNumbers: true
  },
  theme: 'dark',
  accessibility: {
    screenReader: false,
    highContrast: false,
    reducedMotion: false,
    fontSize: 14
  }
};

export function AdvancedIDEInterface({
  documentId,
  repositoryId,
  repositoryName,
  initialContent = '',
  onLayoutChange,
  className
}: AdvancedIDEInterfaceProps) {
  const [layout, setLayout] = useState<IDELayout>(defaultLayout);
  const [_isFullscreen, _setIsFullscreen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [editorContent, setEditorContent] = useState(initialContent);
  
  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);

  // Update layout and notify parent
  const updateLayout = useCallback((updates: Partial<IDELayout>) => {
    setLayout(prev => {
      const newLayout = { ...prev, ...updates };
      onLayoutChange?.(newLayout);
      return newLayout;
    });
  }, [onLayoutChange]);

  // Toggle sidebar visibility
  const toggleLeftSidebar = useCallback(() => {
    updateLayout({
      leftSidebar: {
        ...layout.leftSidebar,
        visible: !layout.leftSidebar.visible
      }
    });
  }, [layout.leftSidebar, updateLayout]);

  // Right sidebar toggle functionality is handled by the layout system
  // const _toggleRightSidebar = useCallback(() => {
  //   updateLayout({
  //     rightSidebar: {
  //       ...layout.rightSidebar,
  //       visible: !layout.rightSidebar.visible
  //     }
  //   });
  // }, [layout.rightSidebar, updateLayout]);

  const toggleBottomPanel = useCallback(() => {
    updateLayout({
      bottomPanel: {
        ...layout.bottomPanel,
        visible: !layout.bottomPanel.visible
      }
    });
  }, [layout.bottomPanel, updateLayout]);

  // Change editor split mode
  const changeSplitMode = useCallback((mode: IDELayout['editor']['splitMode']) => {
    updateLayout({
      editor: {
        ...layout.editor,
        splitMode: mode
      }
    });
  }, [layout.editor, updateLayout]);

  // Toggle editor features
  const toggleMinimap = useCallback(() => {
    updateLayout({
      editor: {
        ...layout.editor,
        minimap: !layout.editor.minimap
      }
    });
  }, [layout.editor, updateLayout]);

  // Change theme
  const changeTheme = useCallback((theme: IDELayout['theme']) => {
    updateLayout({ theme });
  }, [updateLayout]);

  // Accessibility features
  const toggleHighContrast = useCallback(() => {
    updateLayout({
      accessibility: {
        ...layout.accessibility,
        highContrast: !layout.accessibility.highContrast
      }
    });
  }, [layout.accessibility, updateLayout]);

  const adjustFontSize = useCallback((delta: number) => {
    updateLayout({
      accessibility: {
        ...layout.accessibility,
        fontSize: Math.max(10, Math.min(24, layout.accessibility.fontSize + delta))
      }
    });
  }, [layout.accessibility, updateLayout]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      
      // Toggle panels
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleLeftSidebar();
      }
      
      // Toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        toggleBottomPanel();
      }
      
      // Split editor
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        changeSplitMode(layout.editor.splitMode === 'single' ? 'vertical' : 'single');
      }
      
      // Accessibility shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        adjustFontSize(2);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        adjustFontSize(-2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftSidebar, toggleBottomPanel, changeSplitMode, layout.editor.splitMode, adjustFontSize]);

  // Command palette commands
  const commands = [
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', action: toggleLeftSidebar },
    { id: 'toggle-terminal', label: 'Toggle Terminal', action: toggleBottomPanel },
    { id: 'split-vertical', label: 'Split Editor Vertically', action: () => changeSplitMode('vertical') },
    { id: 'split-horizontal', label: 'Split Editor Horizontally', action: () => changeSplitMode('horizontal') },
    { id: 'toggle-minimap', label: 'Toggle Minimap', action: toggleMinimap },
    { id: 'theme-dark', label: 'Dark Theme', action: () => changeTheme('dark') },
    { id: 'theme-light', label: 'Light Theme', action: () => changeTheme('light') },
    { id: 'high-contrast', label: 'Toggle High Contrast', action: toggleHighContrast },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(commandQuery.toLowerCase())
  );

  return (
    <div 
      className={cn(
        'flex flex-col h-screen bg-gray-900 text-white',
        layout.accessibility.highContrast && 'high-contrast',
        layout.accessibility.reducedMotion && 'reduce-motion',
        className
      )}
      style={{ fontSize: `${layout.accessibility.fontSize}px` }}
    >
      {/* Top Menu Bar */}
      <GlassContainer
        intensity="light"
        tint="neutral"
        border
        className="flex items-center justify-between px-4 py-2 border-b border-gray-700"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">Solidity IDE</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleLeftSidebar}
              className={cn(
                'p-1 rounded hover:bg-gray-700 transition-colors',
                layout.leftSidebar.visible ? 'text-blue-400' : 'text-gray-400'
              )}
              title="Toggle Sidebar (Ctrl+B)"
            >
              <Sidebar className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => changeSplitMode('vertical')}
              className={cn(
                'p-1 rounded hover:bg-gray-700 transition-colors',
                layout.editor.splitMode === 'vertical' ? 'text-blue-400' : 'text-gray-400'
              )}
              title="Split Vertically"
            >
              <SplitSquareVertical className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => changeSplitMode('horizontal')}
              className={cn(
                'p-1 rounded hover:bg-gray-700 transition-colors',
                layout.editor.splitMode === 'horizontal' ? 'text-blue-400' : 'text-gray-400'
              )}
              title="Split Horizontally"
            >
              <SplitSquareHorizontal className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleBottomPanel}
              className={cn(
                'p-1 rounded hover:bg-gray-700 transition-colors',
                layout.bottomPanel.visible ? 'text-blue-400' : 'text-gray-400'
              )}
              title="Toggle Terminal (Ctrl+`)"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            title="Command Palette (Ctrl+Shift+P)"
          >
            <Command className="w-3 h-3" />
            <span>Commands</span>
          </button>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => changeTheme('dark')}
              className={cn(
                'p-1 rounded hover:bg-gray-700 transition-colors',
                layout.theme === 'dark' ? 'text-blue-400' : 'text-gray-400'
              )}
              title="Dark Theme"
            >
              <Moon className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => changeTheme('light')}
              className={cn(
                'p-1 rounded hover:bg-gray-700 transition-colors',
                layout.theme === 'light' ? 'text-blue-400' : 'text-gray-400'
              )}
              title="Light Theme"
            >
              <Sun className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleHighContrast}
              className={cn(
                'p-1 rounded hover:bg-gray-700 transition-colors',
                layout.accessibility.highContrast ? 'text-blue-400' : 'text-gray-400'
              )}
              title="High Contrast"
            >
              <Accessibility className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassContainer>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <AnimatePresence>
          {layout.leftSidebar.visible && (
            <motion.div
              ref={leftSidebarRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: layout.leftSidebar.width, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-gray-700 bg-gray-800/50"
            >
              <LeftSidebarContent
                activePanel={layout.leftSidebar.activePanel}
                onPanelChange={(panel) => updateLayout({
                  leftSidebar: { ...layout.leftSidebar, activePanel: panel }
                })}
                repositoryId={repositoryId}
                repositoryName={repositoryName}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            {layout.editor.splitMode === 'single' && (
              <AdvancedCollaborativeMonacoEditor
                documentId={documentId}
                initialContent={editorContent}
                language="solidity"
                showMinimap={layout.editor.minimap}
                onContentChange={setEditorContent}
                className="h-full"
              />
            )}
            
            {layout.editor.splitMode === 'vertical' && (
              <div className="flex h-full">
                <div className="flex-1 border-r border-gray-700">
                  <AdvancedCollaborativeMonacoEditor
                    documentId={`${documentId}-left`}
                    initialContent={editorContent}
                    language="solidity"
                    showMinimap={layout.editor.minimap}
                    onContentChange={setEditorContent}
                    className="h-full"
                  />
                </div>
                <div className="flex-1">
                  <AdvancedCollaborativeMonacoEditor
                    documentId={`${documentId}-right`}
                    initialContent=""
                    language="solidity"
                    showMinimap={layout.editor.minimap}
                    className="h-full"
                  />
                </div>
              </div>
            )}
            
            {layout.editor.splitMode === 'horizontal' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 border-b border-gray-700">
                  <AdvancedCollaborativeMonacoEditor
                    documentId={`${documentId}-top`}
                    initialContent={editorContent}
                    language="solidity"
                    showMinimap={layout.editor.minimap}
                    onContentChange={setEditorContent}
                    className="h-full"
                  />
                </div>
                <div className="flex-1">
                  <AdvancedCollaborativeMonacoEditor
                    documentId={`${documentId}-bottom`}
                    initialContent=""
                    language="solidity"
                    showMinimap={layout.editor.minimap}
                    className="h-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel */}
          <AnimatePresence>
            {layout.bottomPanel.visible && (
              <motion.div
                ref={bottomPanelRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: layout.bottomPanel.height, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-700 bg-gray-800/50"
              >
                <BottomPanelContent
                  activeTab={layout.bottomPanel.activeTab}
                  onTabChange={(tab) => updateLayout({
                    bottomPanel: { ...layout.bottomPanel, activeTab: tab }
                  })}
                  repositoryId={repositoryId}
                  repositoryName={repositoryName}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar */}
        <AnimatePresence>
          {layout.rightSidebar.visible && (
            <motion.div
              ref={rightSidebarRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: layout.rightSidebar.width, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-700 bg-gray-800/50"
            >
              <RightSidebarContent
                activePanel={layout.rightSidebar.activePanel}
                onPanelChange={(panel) => updateLayout({
                  rightSidebar: { ...layout.rightSidebar, activePanel: panel }
                })}
              />
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 z-50"
            onClick={() => setShowCommandPalette(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 border border-gray-600 rounded-lg w-96 max-h-96 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-600">
                <input
                  type="text"
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  placeholder="Type a command..."
                  className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
                  autoFocus
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {filteredCommands.map((command) => (
                  <button
                    key={command.id}
                    onClick={() => {
                      command.action();
                      setShowCommandPalette(false);
                      setCommandQuery('');
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-white">{command.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Left Sidebar Content Component
function LeftSidebarContent({
  activePanel,
  onPanelChange,
  repositoryId,
  repositoryName
}: {
  activePanel: IDELayout['leftSidebar']['activePanel'];
  onPanelChange: (panel: IDELayout['leftSidebar']['activePanel']) => void;
  repositoryId: string;
  repositoryName: string;
}) {
  const panels = [
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'vcs', label: 'Source Control', icon: GitBranch },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'extensions', label: 'Extensions', icon: Layers },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Panel Tabs */}
      <div className="flex border-b border-gray-600">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <button
              key={panel.id}
              onClick={() => onPanelChange(panel.id as any)}
              className={cn(
                'flex-1 flex items-center justify-center p-3 transition-colors',
                activePanel === panel.id
                  ? 'bg-gray-700 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              )}
              title={panel.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {activePanel === 'files' && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-white mb-3">Explorer</h3>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">MyContract.sol</span>
              </div>
              <div className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                <FileText className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Test.sol</span>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'vcs' && (
          <VersionControlInterface
            repositoryId={repositoryId}
            repositoryName={repositoryName}
            className="h-full"
          />
        )}

        {activePanel === 'search' && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-white mb-3">Search</h3>
            <input
              type="text"
              placeholder="Search in files..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {activePanel === 'extensions' && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-white mb-3">Extensions</h3>
            <p className="text-sm text-gray-400">No extensions installed</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Right Sidebar Content Component
function RightSidebarContent({
  activePanel,
  onPanelChange
}: {
  activePanel: IDELayout['rightSidebar']['activePanel'];
  onPanelChange: (panel: IDELayout['rightSidebar']['activePanel']) => void;
}) {
  const panels = [
    { id: 'outline', label: 'Outline', icon: Layers },
    { id: 'debug', label: 'Debug', icon: Bug },
    { id: 'analysis', label: 'Analysis', icon: Zap },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Panel Tabs */}
      <div className="flex border-b border-gray-600">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <button
              key={panel.id}
              onClick={() => onPanelChange(panel.id as any)}
              className={cn(
                'flex-1 flex items-center justify-center p-3 transition-colors',
                activePanel === panel.id
                  ? 'bg-gray-700 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              )}
              title={panel.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {activePanel === 'outline' && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-white mb-3">Outline</h3>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                <Code className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">MyContract</span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="flex items-center space-x-2 p-1 hover:bg-gray-700 rounded cursor-pointer">
                  <span className="text-xs text-blue-400">f</span>
                  <span className="text-sm text-gray-300">constructor</span>
                </div>
                <div className="flex items-center space-x-2 p-1 hover:bg-gray-700 rounded cursor-pointer">
                  <span className="text-xs text-green-400">f</span>
                  <span className="text-sm text-gray-300">getValue</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'debug' && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-white mb-3">Debug</h3>
            <p className="text-sm text-gray-400">No active debug session</p>
          </div>
        )}

        {activePanel === 'analysis' && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-white mb-3">Code Analysis</h3>
            <div className="space-y-2">
              <div className="p-2 bg-green-500/10 border border-green-500/30 rounded">
                <p className="text-xs text-green-400">✓ No issues found</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Bottom Panel Content Component
function BottomPanelContent({
  activeTab,
  onTabChange,
  repositoryId: _repositoryId,
  repositoryName: _repositoryName
}: {
  activeTab: IDELayout['bottomPanel']['activeTab'];
  onTabChange: (tab: IDELayout['bottomPanel']['activeTab']) => void;
  repositoryId: string;
  repositoryName: string;
}) {
  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'debug', label: 'Debug Console', icon: Bug },
    { id: 'problems', label: 'Problems', icon: AlertTriangle },
    { id: 'output', label: 'Output', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'terminal' && (
          <div className="h-full bg-black/50 p-4 font-mono text-sm">
            <div className="text-green-400">$ solc --version</div>
            <div className="text-gray-300">solc, the solidity compiler commandline interface</div>
            <div className="text-gray-300">Version: 0.8.19+commit.7dd6d404.Linux.g++</div>
            <div className="text-green-400 mt-2">$ _</div>
          </div>
        )}

        {activeTab === 'debug' && (
          <SolidityDebuggerInterface
            className="h-full"
          />
        )}

        {activeTab === 'problems' && (
          <div className="p-4">
            <div className="text-center text-gray-400 py-8">
              <Check className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p>No problems detected</p>
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="h-full bg-black/50 p-4 font-mono text-sm">
            <div className="text-gray-300">[INFO] Solidity Language Server started</div>
            <div className="text-gray-300">[INFO] Workspace initialized</div>
            <div className="text-blue-400">[DEBUG] Analysis complete</div>
          </div>
        )}
      </div>
    </div>
  );
}
