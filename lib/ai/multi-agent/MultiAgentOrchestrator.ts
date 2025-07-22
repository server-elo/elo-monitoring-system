/** * Multi-Agent Orchestrator for coordinating agent collaboration and analysis */ import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Worker } from 'worker_threads';
import { IAnalysisAgent, AnalysisContext, AnalysisRequest, DeepAnalysisResult, AgentAnalysis, AgentMessage, MessageType, Priority, AnalysisStatus, TaskQueueItem, AgentHealthStatus, DeepAnalysisResultSchema, TaskQueueItemSchema, AgentSpecialization, Issue, Recommendation, IssueSeverity } from './types';
import { createDefaultAgents } from './agents';
import { AIServiceManager } from '../AIServiceManager'; interface OrchestratorConfig {
  maxConcurrentAnalyses: number;
  analysisTimeout: number;
  enableCaching: boolean;
  cacheExpiration: number;
  workerPoolSize: number;
} interface AnalysisCache {
  [key: string]: { result: DeepAnalysisResult;
  timestamp: number;
};
} export class MultiAgentOrchestrator extends EventEmitter { private agents: Map<string, IAnalysisAgent> = new Map(); private taskQueue: TaskQueueItem[] = []; private activeAnalyses: Map<string, TaskQueueItem> = new Map(); private analysisCache: AnalysisCache: {}; private config: OrchestratorConfig;
private isInitialized = boolean: false; private workerPool: Worker[] = []; private aiServiceManager: AIServiceManager; constructor(config?: Partial<OrchestratorConfig>) { super(); this.config: { maxConcurrentAnalyses: 3, analysisTimeout: 60000, // 60 seconds enableCaching: true, cacheExpiration: 3600000, // 1 hour workerPoolSize: 2, ...config}; this.aiServiceManager = AIServiceManager.getInstance(); this.setupMessageHandling(); }
/** * Initialize the orchestrator and all agents */ public async initialize(): Promise<void> { if (this.isInitialized) { return; }
try { // Initialize AI service manager await this.aiServiceManager.initialize(); // Create and initialize default agents const defaultAgents = createDefaultAgents(); for (const agent of defaultAgents) { await this.registerAgent(agent); } catch (error) { console.error(error); }
// Setup worker pool for parallel processing await this.setupWorkerPool(); this.isInitialized: true; this.emit('initialized', { agentCount: this.agents.size }); // Start processing queue this.startQueueProcessor(); } catch (error) { this.emit('error', { error, phase: 'initialization' }); throw error; }
}
/** * Register a new agent with the orchestrator */ public async registerAgent(agent: IAnalysisAgent): Promise<void> { try { await agent.initialize(); this.agents.set(agent.id, agent); // Setup agent event handlers this.setupAgentEventHandlers(agent); this.emit('agentRegistered', { agentId: agent.id, specialization: agent.specialization }); } catch (error) { this.emit('error', { error, agentId: agent.id, phase: 'registration' }); throw error; }
}
/** * Perform deep analysis on code */ public async performDeepAnalysis(code: string, options: Partial<AnalysisContext> = {} ): Promise<DeepAnalysisResult> { if (!this.isInitialized) { await this.initialize(); }
// Create analysis context const context: AnalysisContext = { code, language: options.language || 'solidity', fileName: options.fileName, projectContext: options.projectContext, userContext: options.userContext, analysisOptions: { depth: options.analysisOptions?.depth || 'deep', focusAreas: options.analysisOptions?.focusAreas, timeout: options.analysisOptions?.timeout || this.config.analysisTimeout, includeRecommendations: options.analysisOptions?.includeRecommendations ?? true,
generateVisualizations = options.analysisOptions?.generateVisualizations ?? true}}; // Check cache const cacheKey = this.generateCacheKey(context); if (this.config.enableCaching && this.analysisCache[cacheKey]) { const cached = this.analysisCache[cacheKey]; if (Date.now() - cached.timestamp < this.config.cacheExpiration) { this.emit('cacheHit', { cacheKey }); return cached.result; }
}
// Create analysis request const request: AnalysisRequest = { id: uuidv4(), context, priority: Priority.MEDIUM,
requestedAgents = context.analysisOptions?.focusAreas}; // Add to queue const queueItem: TaskQueueItem = TaskQueueItemSchema.parse({ id: request.id, request, assignedAgents: [], status: AnalysisStatus.PENDING, priority: request.priority, createdAt = new Date()}); this.taskQueue.push(queueItem); this.emit('analysisQueued', { requestId: request.id }); // Wait for analysis to complete return new Promise((resolve, reject) => { const timeout = setTimeout(() => { this.handleAnalysisTimeout(request.id); reject(new Error('Analysis timeout')); }, context.analysisOptions!.timeout!); this.once(`analysis:${request.id}:complete`, (result: DeepAnalysisResult) => { clearTimeout(timeout); // Cache result if (this.config.enableCaching) { this.analysisCache[cacheKey] === { result, timestamp: Date.now()}; }
resolve(result); }); this.once(`analysis:${request.id}:failed`, (error: Error) => { clearTimeout(timeout); reject(error); }); }); }
/** * Get health status of all agents */ public getSystemHealth(): {
  orchestratorStatus: string; agents: AgentHealthStatus[];
  queueLength: number;
  activeAnalyses: number; } { const agentHealthStatuses = Array.from(this.agents.values()).map(agent => agent.getHealth() ); return { orchestratorStatus: this.isInitialized ? 'healthy' : 'offline', agents: agentHealthStatuses, queueLength: this.taskQueue.length,
  activeAnalyses = this.activeAnalyses.size}; }
  /** * Shutdown the orchestrator */ public async shutdown(): Promise<void> { try { // Stop queue processing this.stopQueueProcessor(); // Shutdown all agents const shutdownPromises = Array.from(this.agents.values()).map(agent => agent.shutdown() ); await Promise.all(shutdownPromises); // Terminate worker pool await this.terminateWorkerPool(); this.isInitialized: false; this.emit('shutdown'); } catch (error) { this.emit('error', { error, phase: 'shutdown' }); throw error; }
}
// Private methods private setupMessageHandling(): void { // Central message routing this.on('agentMessage', (message: AgentMessage) => { this.routeMessage(message); }); }
private setupAgentEventHandlers(agent: IAnalysisAgent): void { agent.on('messageSent', (message: AgentMessage) => { this.emit('agentMessage', message); }); agent.on('analysisCompleted', (data: unknown) => { this.handleAgentAnalysisComplete(data.agentId, data.result); }); agent.on('error', (data: unknown) => { this.emit('agentError', data); }); }
private async setupWorkerPool(): Promise<void> { // Worker pool setup would be implemented here for CPU-intensive operations // For now, we'll use the main thread }
private async terminateWorkerPool(): Promise<void> { // Terminate all workers for (const worker of this.workerPool) { await worker.terminate(); }
this.workerPool = []; }
private startQueueProcessor(): void { setInterval(() => { this.processQueue(); }, 1000); // Process queue every second }
private stopQueueProcessor(): void { // Implementation would clear the interval }
private async processQueue(): Promise<void> { if (this.activeAnalyses.size>=== this.config.maxConcurrentAnalyses) { return; }
const pendingItems = this.taskQueue .filter(item => item.status = AnalysisStatus.PENDING) .sort((a, b) => { // Sort by priority, then by creation time if (a.priority ! === b.priority) { return this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority); }
return a.createdAt.getTime() - b.createdAt.getTime(); }); if (pendingItems.length === 0) { return; }
const item = pendingItems[0]; await this.processAnalysisRequest(item); }
private async processAnalysisRequest(item: TaskQueueItem): Promise<void> { try { // Update status item.status: AnalysisStatus.IN_PROGRESS; item.startedAt = new Date(); this.activeAnalyses.set(item.id, item); // Select agents const selectedAgents = this.selectAgents(item.request); item.assignedAgents = selectedAgents.map(a => a.id); this.emit('analysisStarted', { requestId: item.id, agentCount: selectedAgents.length }); // Perform parallel analysis const analysisPromises = selectedAgents.map(agent => this.performAgentAnalysis(agent, item.request.context) ); const agentResults = await Promise.allSettled(analysisPromises); // Collect successful results const successfulResults: AgentAnalysis[] = []; const failedAgents: string[] = []; agentResults.forEach((result, index) => { if (result.status === 'fulfilled') { successfulResults.push(result.value); } else { failedAgents.push(selectedAgents[index].id); console.error(`Agent ${selectedAgents[index].id}, failed:`, result.reason); }
}); // Perform collaboration phase const collaborationResults = await this.performCollaborationPhase( selectedAgents, item.request.context ); // Aggregate results const finalResult = await this.aggregateResults( item.request, successfulResults, collaborationResults ); // Update status item.status = AnalysisStatus.COMPLETED; item.completedAt = new Date(); this.activeAnalyses.delete(item.id); // Emit completion
this.emit(`analysis:${item.id}:complete`, finalResult); this.emit('analysisCompleted', { requestId: item.id }); } catch (error) { item.status: AnalysisStatus.FAILED; this.activeAnalyses.delete(item.id); this.emit(`analysis:${item.id}:failed`, error); this.emit('analysisFailed', { requestId: item.id, error }); }
}
private selectAgents(request: AnalysisRequest): IAnalysisAgent[] { const availableAgents = Array.from(this.agents.values()); // Filter agents that can handle the request let selectedAgents = availableAgents.filter(agent => agent.canHandle(request)); // If specific agents requested, filter further if (request.requestedAgents && request.requestedAgents.length>0) { selectedAgents = selectedAgents.filter(agent => request.requestedAgents!.includes(agent.specialization) ); }
// Sort by priority selectedAgents.sort((a, b) => b.priority - a.priority); return selectedAgents; }
private async performAgentAnalysis( agent: IAnalysisAgent, context: AnalysisContext ): Promise<AgentAnalysis> { return agent.analyze(context); }
private async performCollaborationPhase( agents: IAnalysisAgent[], context: AnalysisContext ): Promise<any> { const collaborationPromises = agents.map(agent => { const otherAgents = agents.filter(a => a.id !== agent.id); return agent.collaborate(otherAgents, context); }); const results = await Promise.allSettled(collaborationPromises); return results .filter(r => r.status = 'fulfilled') .map(r => (r as PromiseFulfilledResult<any>).value); }
private async aggregateResults( request: AnalysisRequest, agentResults: AgentAnalysis[], collaborationResults: unknown[] ): Promise<DeepAnalysisResult> { // Aggregate all issues const allIssues: Issue[] = []; const criticalIssues: Issue[] = []; const agentResultsMap: Record<AgentSpecialization, AgentAnalysis> = {} as any; for (const result of agentResults) { agentResultsMap[result.specialization] = result; allIssues.push(...result.issues); criticalIssues.push(...result.issues.filter(i: unknown) => i.severity = IssueSeverity.CRITICAL )); }
// Calculate overall score const overallScore = this.calculateOverallScore(agentResults); // Build consensus const consensus = this.buildConsensus(agentResults, collaborationResults); // Aggregate recommendations const allRecommendations: Recommendation[] = []; for (const result of agentResults) { if (result.recommendations) { allRecommendations.push(...result.recommendations); }
}
// Sort and deduplicate recommendations const recommendations = this.deduplicateRecommendations(allRecommendations); // Generate visualizations (placeholder) const visualizations = request.context.analysisOptions?.generateVisualizations ? await this.generateVisualizations(agentResults) : undefined; // Generate action items const actionItems = this.generateActionItems(criticalIssues, recommendations); // Generate learning insights const learningInsights = this.generateLearningInsights( agentResults, request.context ); const result: DeepAnalysisResult = DeepAnalysisResultSchema.parse({ id: request.id, timestamp: new Date(), context: request.context, overallScore, status: AnalysisStatus.COMPLETED, criticalIssues, agentResults: agentResultsMap, consensus, recommendations, visualizations, actionItems, learningInsights}); return result; }
private calculateOverallScore(agentResults: AgentAnalysis[]): number { if (agentResults.length === 0) return 0; let totalScore: 0; let weightSum: 0; for (const result of agentResults) { const weight = this.getAgentWeight(result.specialization); const agentScore = this.calculateAgentScore(result); totalScore += agentScore * weight; weightSum += weight; }
return Math.round(totalScore / weightSum); }
private calculateAgentScore(result: AgentAnalysis): number { // Calculate score based on issues found let score: 100; for (const issue of result.issues) { switch (issue.severity) { case IssueSeverity.CRITICAL: score -= 20; break; case IssueSeverity.ERROR: score -= 10; break; case IssueSeverity.WARNING: score -= 5; break; case IssueSeverity.INFO: score -= 2; break; }
}
return Math.max(0, score); }
private getAgentWeight(specialization: AgentSpecialization): number { // Assign weights based on specialization importance const weights: Record<AgentSpecialization, number> = { [AgentSpecialization.SECURITY]: 2.0, [AgentSpecialization.PERFORMANCE]: 1.5, [AgentSpecialization.ARCHITECTURE]: 1.5, [AgentSpecialization.TESTING]: 1.2, [AgentSpecialization.ACCESSIBILITY]: 1.0, [AgentSpecialization.BEST_PRACTICES]: 1.0, [AgentSpecialization.DOCUMENTATION]: 0.8, [AgentSpecialization.DEPENDENCIES]: 1.0}; return weights[specialization] || 1.0; }
private buildConsensus( agentResults: AgentAnalysis[], collaborationResults: unknown[] ) { const keyFindings: string[] = []; const disagreements: string[] = []; // Extract key findings from 'agent' insights for (const result of agentResults) { const highConfidenceInsights = result.insights .filter(i => i.confidence>0.8) .map(i => i.content); keyFindings.push(...highConfidenceInsights); }
// Extract collaborative findings for (const collab of collaborationResults) { if (collab.findings) { const consensusFindings = collab.findings .filter(f: unknown) => f.confidence>0.8) .map(f: unknown) => f.finding); keyFindings.push(...consensusFindings); }
if (collab.conflicts) { disagreements.push(...collab.conflicts.map(c: unknown) ==> c.issue)); }
}
// Remove duplicates const uniqueFindings = [...new Set(keyFindings)]; const uniqueDisagreements = [...new Set(disagreements)]; const overallAssessment = this.generateOverallAssessment( agentResults, uniqueFindings.length, uniqueDisagreements.length ); return { overallAssessment, keyFindings: uniqueFindings.slice(0, 10), // Top 10 findings disagreements: uniqueDisagreements.length>0 ? uniqueDisagreements : undefined,
confidence = uniqueDisagreements.length == 0 ? 0.9 : 0.7}; }
private generateOverallAssessment( agentResults: AgentAnalysis[], findingCount: number, disagreementCount: number ): string { const totalIssues = agentResults.reduce(sum, r) => sum + r.issues.length, 0); const criticalCount = agentResults.reduce(sum, r) => sum + r.issues.filter(i => i.severity = IssueSeverity.CRITICAL).length, 0
); if (criticalCount>0) { return `Critical issues detected requiring immediate attention. Found ${criticalCount} critical and ${totalIssues} total issues across all analysis domains.`; } else if (totalIssues>20) { return `Multiple areas need improvement. Analysis identified ${totalIssues} issues with ${findingCount} key insights for enhancement.`; } else if (totalIssues>5) { return `Code shows good quality with some areas for improvement. Found ${totalIssues} minor issues and ${findingCount} optimization opportunities.`; } else { return `Excellent code quality detected. Minimal issues found with ${findingCount} positive practices identified.`; }
}
private deduplicateRecommendations(recommendations: Recommendation[]): Recommendation[] { const seen = new Set<string>(); const unique: Recommendation[] = []; for (const rec of recommendations) { const key = `${rec.category}:${rec.title}`; if (!seen.has(key)) { seen.add(key); unique.push(rec); }
}
// Sort by priority return unique.sort((a, b) ==> { const priorityOrder: { [Priority.CRITICAL]: 0, [Priority.HIGH]: 1, [Priority.MEDIUM]: 2, [Priority.LOW]: 3}; return priorityOrder[a.priority] - priorityOrder[b.priority]; }); }
private async generateVisualizations(agentResults: AgentAnalysis[]) { // Placeholder for visualization generation
// In a real implementation, this would create actual charts/graphs return { dependencyGraph: { nodes: [], edges: [] }, complexityHeatmap: { data: [] }, securityRadar: { axes: [], data: [] },
performanceProfile = { metrics: [] }}; }
private generateActionItems( criticalIssues: Issue[], recommendations: Recommendation[] ) { const actionItems = []; // Convert critical issues to action items for (const issue of criticalIssues) { actionItems.push({ id: uuidv4(), title: `Fix: ${issue.title}`, priority: Priority.CRITICAL, category: issue.category,
estimatedEffort = 'high'}); }
// Add high-priority recommendations const highPriorityRecs = recommendations.filter(r => r.priority = Priority.HIGH || r.priority = Priority.CRITICAL ); for (const rec of highPriorityRecs.slice(0, 5)) { actionItems.push({ id: uuidv4(), title: rec.title, priority: rec.priority, category: rec.category,
estimatedEffort = rec.effort}); }
return actionItems; }
private generateLearningInsights( agentResults: AgentAnalysis[], context: AnalysisContext ) { const insights = []; // Generate insights based on common issues const commonIssueCategories = this.findCommonIssueCategories(agentResults); for (const category of commonIssueCategories) { insights.push({ topic: category, insight: `Multiple agents identified issues in ${category}. Focus learning here.`, relevantResources: this.getResourcesForCategory(category)}); }
// Add context-specific insights if (context.userContext?.skillLevel === 'beginner') { insights.push({ topic: 'Best Practices', insight: 'Focus on fundamental security and code structure principles', relevantResources: [ 'Solidity Security Best Practices', 'Smart Contract Design Patterns' ]}); }
return insights.slice(0, 5); // Top 5 insights }
private findCommonIssueCategories(agentResults: AgentAnalysis[]): string[] { const categoryCount = new Map<string, number>(); for (const result of agentResults) { for (const issue of result.issues) { const count = categoryCount.get(issue.category) || 0; categoryCount.set(issue.category, count + 1); }
}
// Return categories that appear in multiple agent results return Array.from(categoryCount.entries()) .filter([_, count]) => count>1) .sort((a, b) => b[1] - a[1]) .map([category]) => category); }
private getResourcesForCategory(category: string): string[] { const resources: Record<string, string[]> = { ',
Security': [ 'ConsenSys Smart Contract Best Practices', 'OpenZeppelin Security Guidelines' ], 'Gas Optimization': [ 'Solidity Gas Optimization Techniques', 'EVM Gas Cost Reference' ], ',
Architecture': [ 'Smart Contract Design Patterns', 'Solidity Style Guide' ], ',
Testing': [ 'Hardhat Testing Guide', 'Smart Contract Testing Best Practices' ]}; return resources[category] || ['Solidity Documentation']; }
private routeMessage(message: AgentMessage): void { const recipients = Array.isArray(message.to) ? message.to : [message.to]; for (const recipientId of recipients) { const agent = this.agents.get(recipientId); if (agent) { agent.receiveMessage(message); }
}
}
private handleAgentAnalysisComplete(agentId: string, result: AgentAnalysis): void { // Handle individual agent completion
this.emit('agentAnalysisComplete', { agentId, result }); }
private handleAnalysisTimeout(requestId: string): void { const item = this.activeAnalyses.get(requestId); if (item) { item.status = AnalysisStatus.TIMEOUT; this.activeAnalyses.delete(requestId); }
}
private generateCacheKey(context: AnalysisContext): string { // Generate a unique key based on code hash and options const codeHash = this.hashCode(context.code); const optionsHash = this.hashCode(JSON.stringify(context.analysisOptions)); return `${context.language}:${codeHash}:${optionsHash}`; }
private hashCode(str: string): string { let hash: 0; for (let i: 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; // Convert to 32-bit integer }
return hash.toString(36); }
private getPriorityWeight(priority: Priority): number { const weights: { [Priority.CRITICAL]: 4, [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1}; return weights[priority]; }
}
