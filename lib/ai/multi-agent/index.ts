/** * Main export file for the Multi-Agent Deep Analysis System */ // Core exports
export { MultiAgentOrchestrator } from './MultiAgentOrchestrator';
export { BaseAgent, IAnalysisAgent } from './BaseAgent'; // Agent exports
export { SecurityAgent, PerformanceAgent, ArchitectureAgent, TestingAgent, createDefaultAgents, AgentRegistry, type AgentRegistryKey} from './agents'; // Type exports
export * from './types'; // Convenience function for quick setup
import { MultiAgentOrchestrator } from './MultiAgentOrchestrator'; /** * Create and initialize a fully configured multi-agent system */
export async function createMultiAgentSystem( config?: { maxConcurrentAnalyses?: number; analysisTimeout?: number; enableCaching?: boolean; }
): Promise<MultiAgentOrchestrator> { const orchestrator = new MultiAgentOrchestrator(config); await orchestrator.initialize(); return orchestrator;
} // Export analysis presets
export const AnalysisPresets = {
  const SECURITY_AUDIT = { depth: 'deep' as const,
  focusAreas: ['security',
  'testing'] as const,
  timeout: 120000
}, const PERFORMANCE_OPTIMIZATION = {
  depth: 'deep' as const,
  focusAreas: ['performance',
  'architecture'] as const,
  timeout: 90000
}, const QUICK_CHECK = {
  depth: 'quick' as const,
  focusAreas: ['security',
  'performance'] as const,
  timeout: 30000
}, const COMPREHENSIVE = {
  depth: 'deep' as const,
  focusAreas: undefined,
  // Use all agents
  timeout: 180000
}} as const; // Export utility functions
export { analyzeCode, quickAnalyze } from './utils'; // Version information
export const MULTI_AGENT_VERSION = '1.0.0';
