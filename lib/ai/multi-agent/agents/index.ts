/** * Export all specialized agents for the Multi-Agent Deep Analysis System */ export { SecurityAgent } from './SecurityAgent'
export { PerformanceAgent } from './PerformanceAgent'
export { ArchitectureAgent } from './ArchitectureAgent'
export { TestingAgent } from './TestingAgent' // Re-export base agent for extension
export { BaseAgent, IAnalysisAgent } from '../BaseAgent' // Factory function to create all default agents
import { SecurityAgent } from './SecurityAgent'
import { PerformanceAgent } from './PerformanceAgent'
import { ArchitectureAgent } from './ArchitectureAgent'
import { TestingAgent } from './TestingAgent'
import { IAnalysisAgent } from '../BaseAgent'
export function createDefaultAgents(): IAnalysisAgent[] {
  return [
    new SecurityAgent(),
    new PerformanceAgent(),
    new ArchitectureAgent(),
    new TestingAgent(),
  ]
} // Agent registry for dynamic agent discovery
export const AgentRegistry = {
  security: SecurityAgent,
  performance: PerformanceAgent,
  architecture: ArchitectureAgent,
  testing: TestingAgent,
} as const
export type AgentRegistryKey = keyof typeof AgentRegistry
