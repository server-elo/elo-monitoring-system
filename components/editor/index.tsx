/**;
 * Editor Components Index
 *
 * Central export point for all editor-related components
 * including mobile-optimized and desktop versions.
 *
 * @module components/editor
 */
// Core Editor Components
export { SolidityEditor } from './SolidityEditor'
export { EnhancedCodeEditor } from './EnhancedCodeEditor'
export { MobileCodeEditor } from './MobileCodeEditor'
export { MobileOptimizedCodeEditor } from './MobileOptimizedCodeEditor'
// Temporarily disabled components due to syntax errors:
// export { SecurityEnhancedEditor } from "./SecurityEnhancedEditor";
// export { AdvancedCollaborativeMonacoEditor } from "./AdvancedCollaborativeMonacoEditor";
// export { MobileQuickActionBar } from "./MobileQuickActionBar";
// export { MobileCodeSnippets } from "./MobileCodeSnippets";
// export { SecurityOverlay } from "./SecurityOverlay";
// export { SecurityStatusIndicator } from "./SecurityStatusIndicator";

export { AdvancedIDEInterface } from './AdvancedIDEInterface'
// Mobile-Specific Components
export { MobileEditorToolbar } from './MobileEditorToolbar'
// export type { CodeSnippet } from "./MobileCodeSnippets";
export { GasOptimizationPanel } from './GasOptimizationPanel'
// Preset Configurations
// export { QuickActionPresets } from "./MobileQuickActionBar"; // Disabled
// Responsive Editor Wrapper
import React, { ReactElement } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MobileOptimizedCodeEditor } from './MobileOptimizedCodeEditor'
import { EnhancedCodeEditor } from './EnhancedCodeEditor'
interface ResponsiveCodeEditorProps {
  onCodeChange?: (code: string) => void
  height?: string
  className?: string
  mobileProps?: React.ComponentProps<typeof MobileOptimizedCodeEditor>
  desktopProps?: React.ComponentProps<typeof EnhancedCodeEditor>
  breakpoint?: string
}
/**
 * Responsive Code Editor that automatically switches between
 * mobile and desktop versions based on screen size.
 */
export function ResponsiveCodeEditor({
  onCodeChange,
  height = '400px',
  className = '',
  mobileProps = {},
  desktopProps = {},
  breakpoint = '(max-width: 768px)',
}: ResponsiveCodeEditorProps): ReactElement {
  const isMobile = useMediaQuery(breakpoint)

  // Merge common props
  const commonProps = {
    onCodeChange,
    height,
    className,
  }

  if (isMobile) {
    return <MobileOptimizedCodeEditor {...commonProps} {...mobileProps} />
  }

  return <EnhancedCodeEditor {...commonProps} {...desktopProps} />
}
