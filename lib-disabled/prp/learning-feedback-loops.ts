/**
 * Learning Feedback Loops System
 * Intelligent feedback mechanisms for continuous learning and adaptation
 */

import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'

interface FeedbackLoopConfig {
  learningRate: number
  adaptationThreshold: number
  reinforcementStrength: number
  decayRate: number
  memoryDepth: number
  crossLearning: boolean
}

interface LearningFeedbackLoop {
  id: string
  name: string
  type: FeedbackLoopType
  source: string
  target: string
  strength: number
  adaptation: number
  performance: number
  confidence: number
  createdAt: Date
  lastUpdate: Date
  isActive: boolean
  learningHistory: LearningEvent[]
  connections: FeedbackConnection[]
}

type FeedbackLoopType =
  | 'reinforcement'
  | 'corrective'
  | 'predictive'
  | 'adaptive'
  | 'exploratory'
  | 'consolidation'

interface LearningEvent {
  id: string
  timestamp: Date
  eventType: 'success' | 'failure' | 'improvement' | 'degradation'
  magnitude: number
  context: Record<string, unknown>
  outcome: string
  lessons: string[]
}

interface FeedbackConnection {
  targetLoopId: string
  connectionType: 'reinforcing' | 'balancing' | 'competing' | 'synergistic'
  strength: number
  influence: number
}

interface FeedbackSignal {
  id: string
  sourceLoopId: string
  timestamp: Date
  signalType: 'positive' | 'negative' | 'neutral'
  strength: number
  payload: Record<string, unknown>
  propagationPath: string[]
}

interface AdaptationResponse {
  id: string
  loopId: string
  timestamp: Date
  adaptationType:
    | 'parameter_adjustment'
    | 'behavior_modification'
    | 'strategy_change'
    | 'structure_evolution'
  changes: AdaptationChange[]
  expectedImpact: number
  confidence: number
}

interface AdaptationChange {
  parameter: string
  oldValue: unknown
  newValue: unknown
  reason: string
  impact: number
}

interface LearningInsight {
  id: string
  insight: string
  confidence: number
  sourceLoops: string[]
  applicability: string[]
  evidence: LearningEvent[]
  recommendations: string[]
  createdAt: Date
}

interface FeedbackMetrics {
  totalLoops: number
  activeLoops: number
  averagePerformance: number
  learningVelocity: number
  adaptationSuccess: number
  insightsGenerated: number
  crossLearningEvents: number
}

export class LearningFeedbackLoops extends EventEmitter {
  private config: FeedbackLoopConfig
  private feedbackLoops: Map<string, LearningFeedbackLoop> = new Map()
  private feedbackSignals: FeedbackSignal[] = []
  private adaptationResponses: AdaptationResponse[] = []
  private learningInsights: Map<string, LearningInsight> = new Map()
  private isActive = false

  constructor(config: Partial<FeedbackLoopConfig> = {}) {
    super()

    this.config = {
      learningRate: 0.1,
      adaptationThreshold: 0.15,
      reinforcementStrength: 0.8,
      decayRate: 0.95,
      memoryDepth: 1000,
      crossLearning: true,
      ...config,
    }

    this.initializeFeedbackSystem()
  }

  /**
   * Start learning feedback system
   */
  async start(): Promise<void> {
    console.log('🔄 Starting Learning Feedback Loops System...')

    if (this.isActive) {
      console.log('⚡ System already active')
      return
    }

    this.isActive = true

    // Initialize default feedback loops
    await this.initializeDefaultLoops()

    // Start feedback processing
    this.startFeedbackProcessing()

    console.log('✅ Learning feedback loops system started')
  }

  /**
   * Stop learning feedback system
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping learning feedback loops system...')
    this.isActive = false
  }

  /**
   * Create new feedback loop
   */
  async createFeedbackLoop(
    name: string,
    type: FeedbackLoopType,
    source: string,
    target: string,
    initialStrength: number = 0.5,
  ): Promise<LearningFeedbackLoop> {
    const loop: LearningFeedbackLoop = {
      id: uuidv4(),
      name,
      type,
      source,
      target,
      strength: initialStrength,
      adaptation: 0,
      performance: 0.5,
      confidence: 0.5,
      createdAt: new Date(),
      lastUpdate: new Date(),
      isActive: true,
      learningHistory: [],
      connections: [],
    }

    this.feedbackLoops.set(loop.id, loop)

    console.log(`🔗 Created feedback loop: ${name} (${type})`)

    this.emit('feedbackLoopCreated', loop)

    return loop
  }

  /**
   * Send feedback signal
   */
  async sendFeedbackSignal(
    sourceLoopId: string,
    signalType: 'positive' | 'negative' | 'neutral',
    strength: number,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    const sourceLoop = this.feedbackLoops.get(sourceLoopId)
    if (!sourceLoop) {
      throw new Error(`Feedback loop not found: ${sourceLoopId}`)
    }

    const signal: FeedbackSignal = {
      id: uuidv4(),
      sourceLoopId,
      timestamp: new Date(),
      signalType,
      strength,
      payload,
      propagationPath: [sourceLoopId],
    }

    this.feedbackSignals.push(signal)

    // Process signal immediately
    await this.processSignal(signal)

    this.emit('feedbackSignalSent', signal)
  }

  /**
   * Record learning event
   */
  async recordLearningEvent(
    loopId: string,
    eventType: LearningEvent['eventType'],
    magnitude: number,
    context: Record<string, unknown> = {},
    outcome: string = '',
    lessons: string[] = [],
  ): Promise<void> {
    const loop = this.feedbackLoops.get(loopId)
    if (!loop) {
      throw new Error(`Feedback loop not found: ${loopId}`)
    }

    const event: LearningEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      eventType,
      magnitude,
      context,
      outcome,
      lessons,
    }

    loop.learningHistory.push(event)

    // Trim history if it exceeds memory depth
    if (loop.learningHistory.length > this.config.memoryDepth) {
      loop.learningHistory = loop.learningHistory.slice(
        -this.config.memoryDepth,
      )
    }

    // Update loop metrics based on event
    await this.updateLoopFromEvent(loop, event)

    // Generate insights from event
    await this.generateInsightsFromEvent(event)

    this.emit('learningEventRecorded', { loopId, event })
  }

  /**
   * Connect feedback loops
   */
  async connectFeedbackLoops(
    sourceLoopId: string,
    targetLoopId: string,
    connectionType: FeedbackConnection['connectionType'],
    strength: number = 0.5,
  ): Promise<void> {
    const sourceLoop = this.feedbackLoops.get(sourceLoopId)
    const targetLoop = this.feedbackLoops.get(targetLoopId)

    if (!sourceLoop || !targetLoop) {
      throw new Error('One or both feedback loops not found')
    }

    const connection: FeedbackConnection = {
      targetLoopId,
      connectionType,
      strength,
      influence: 0,
    }

    sourceLoop.connections.push(connection)

    console.log(
      `🔗 Connected loops: ${sourceLoop.name} -> ${targetLoop.name} (${connectionType})`,
    )

    this.emit('feedbackLoopsConnected', {
      sourceLoopId,
      targetLoopId,
      connection,
    })
  }

  /**
   * Get feedback loop metrics
   */
  async getFeedbackMetrics(): Promise<FeedbackMetrics> {
    const loops = Array.from(this.feedbackLoops.values())
    const activeLoops = loops.filter((loop) => loop.isActive)

    const averagePerformance =
      activeLoops.length > 0
        ? activeLoops.reduce((sum, loop) => sum + loop.performance, 0) /
          activeLoops.length
        : 0

    const totalLearningEvents = loops.reduce(
      (sum, loop) => sum + loop.learningHistory.length,
      0,
    )
    const recentEvents = loops.flatMap((loop) =>
      loop.learningHistory.filter(
        (event) => Date.now() - event.timestamp.getTime() < 3600000, // Last hour
      ),
    )

    const adaptationSuccesses = this.adaptationResponses.filter((response) => {
      const loop = this.feedbackLoops.get(response.loopId)
      return loop && loop.performance > 0.7
    })

    return {
      totalLoops: loops.length,
      activeLoops: activeLoops.length,
      averagePerformance,
      learningVelocity: recentEvents.length / 60, // Events per minute
      adaptationSuccess:
        adaptationSuccesses.length /
        Math.max(this.adaptationResponses.length, 1),
      insightsGenerated: this.learningInsights.size,
      crossLearningEvents: this.countCrossLearningEvents(),
    }
  }

  /**
   * Get learning insights
   */
  getLearningInsights(): LearningInsight[] {
    return Array.from(this.learningInsights.values()).sort(
      (a, b) => b.confidence - a.confidence,
    )
  }

  /**
   * Get feedback loop status
   */
  getFeedbackLoopStatus(loopId: string): {
    loop: LearningFeedbackLoop
    recentEvents: LearningEvent[]
    connections: number
    adaptations: number
    insights: number
  } | null {
    const loop = this.feedbackLoops.get(loopId)
    if (!loop) return null

    const recentEvents = loop.learningHistory
      .filter((event) => Date.now() - event.timestamp.getTime() < 86400000) // Last 24 hours
      .slice(-10) // Last 10 events

    const adaptations = this.adaptationResponses.filter(
      (response) => response.loopId === loopId,
    ).length
    const insights = Array.from(this.learningInsights.values()).filter(
      (insight) => insight.sourceLoops.includes(loopId),
    ).length

    return {
      loop,
      recentEvents,
      connections: loop.connections.length,
      adaptations,
      insights,
    }
  }

  /**
   * Initialize feedback system
   */
  private async initializeFeedbackSystem(): Promise<void> {
    console.log('🔧 Initializing Learning Feedback Loops System...')
  }

  /**
   * Initialize default feedback loops
   */
  private async initializeDefaultLoops(): Promise<void> {
    // Performance feedback loop
    await this.createFeedbackLoop(
      'Performance Optimization',
      'reinforcement',
      'performance_metrics',
      'optimization_engine',
      0.8,
    )

    // Error correction feedback loop
    await this.createFeedbackLoop(
      'Error Correction',
      'corrective',
      'error_detection',
      'error_handling',
      0.7,
    )

    // Learning acceleration feedback loop
    await this.createFeedbackLoop(
      'Learning Acceleration',
      'adaptive',
      'learning_progress',
      'learning_rate',
      0.6,
    )

    // Pattern recognition feedback loop
    await this.createFeedbackLoop(
      'Pattern Recognition',
      'predictive',
      'pattern_detection',
      'analysis_strategy',
      0.7,
    )

    // System stability feedback loop
    await this.createFeedbackLoop(
      'System Stability',
      'balancing',
      'stability_metrics',
      'system_parameters',
      0.9,
    )

    // Connect related loops
    const loops = Array.from(this.feedbackLoops.values())
    if (loops.length >= 2) {
      await this.connectFeedbackLoops(
        loops[0].id,
        loops[1].id,
        'synergistic',
        0.5,
      )
      await this.connectFeedbackLoops(
        loops[1].id,
        loops[2].id,
        'reinforcing',
        0.6,
      )
    }
  }

  /**
   * Start feedback processing
   */
  private startFeedbackProcessing(): void {
    setInterval(() => {
      if (this.isActive) {
        this.processPendingSignals()
        this.updateAllLoops()
        this.cleanupOldData()
      }
    }, 5000) // Every 5 seconds
  }

  /**
   * Process pending feedback signals
   */
  private async processPendingSignals(): Promise<void> {
    const unprocessedSignals = this.feedbackSignals.slice(-100) // Last 100 signals

    for (const signal of unprocessedSignals) {
      await this.processSignal(signal)
    }
  }

  /**
   * Process individual feedback signal
   */
  private async processSignal(signal: FeedbackSignal): Promise<void> {
    const sourceLoop = this.feedbackLoops.get(signal.sourceLoopId)
    if (!sourceLoop) return

    // Update source loop based on signal
    this.updateLoopFromSignal(sourceLoop, signal)

    // Propagate signal to connected loops
    for (const connection of sourceLoop.connections) {
      const targetLoop = this.feedbackLoops.get(connection.targetLoopId)
      if (targetLoop) {
        await this.propagateSignal(signal, connection, targetLoop)
      }
    }
  }

  /**
   * Update loop from feedback signal
   */
  private updateLoopFromSignal(
    loop: LearningFeedbackLoop,
    signal: FeedbackSignal,
  ): void {
    const signalImpact = signal.strength * this.config.learningRate

    switch (signal.signalType) {
      case 'positive':
        loop.performance = Math.min(1.0, loop.performance + signalImpact)
        loop.strength = Math.min(1.0, loop.strength + signalImpact * 0.5)
        break

      case 'negative':
        loop.performance = Math.max(0.0, loop.performance - signalImpact)
        loop.strength = Math.max(0.1, loop.strength - signalImpact * 0.3)
        break

      case 'neutral':
        // Gradual decay towards baseline
        loop.performance = loop.performance * this.config.decayRate
        break
    }

    loop.lastUpdate = new Date()
  }

  /**
   * Propagate signal to connected loop
   */
  private async propagateSignal(
    signal: FeedbackSignal,
    connection: FeedbackConnection,
    targetLoop: LearningFeedbackLoop,
  ): Promise<void> {
    // Avoid infinite loops
    if (signal.propagationPath.includes(targetLoop.id)) return

    const propagatedStrength = signal.strength * connection.strength

    // Modify signal based on connection type
    let modifiedSignalType = signal.signalType
    if (connection.connectionType === 'balancing') {
      modifiedSignalType =
        signal.signalType === 'positive'
          ? 'negative'
          : signal.signalType === 'negative'
            ? 'positive'
            : 'neutral'
    }

    const propagatedSignal: FeedbackSignal = {
      id: uuidv4(),
      sourceLoopId: targetLoop.id,
      timestamp: new Date(),
      signalType: modifiedSignalType,
      strength: propagatedStrength,
      payload: signal.payload,
      propagationPath: [...signal.propagationPath, targetLoop.id],
    }

    this.updateLoopFromSignal(targetLoop, propagatedSignal)

    // Update connection influence
    connection.influence += Math.abs(propagatedStrength) * 0.1
  }

  /**
   * Update loop from learning event
   */
  private async updateLoopFromEvent(
    loop: LearningFeedbackLoop,
    event: LearningEvent,
  ): Promise<void> {
    const eventImpact = event.magnitude * this.config.learningRate

    switch (event.eventType) {
      case 'success':
        loop.performance = Math.min(1.0, loop.performance + eventImpact)
        loop.confidence = Math.min(1.0, loop.confidence + eventImpact * 0.5)
        break

      case 'failure':
        loop.performance = Math.max(0.0, loop.performance - eventImpact)
        loop.confidence = Math.max(0.1, loop.confidence - eventImpact * 0.3)
        break

      case 'improvement':
        loop.adaptation += eventImpact
        loop.strength = Math.min(1.0, loop.strength + eventImpact * 0.3)
        break

      case 'degradation':
        loop.adaptation = Math.max(0, loop.adaptation - eventImpact)
        break
    }

    // Trigger adaptation if threshold is met
    if (Math.abs(loop.adaptation) > this.config.adaptationThreshold) {
      await this.triggerAdaptation(loop)
    }

    loop.lastUpdate = new Date()
  }

  /**
   * Trigger adaptation response
   */
  private async triggerAdaptation(loop: LearningFeedbackLoop): Promise<void> {
    const adaptation: AdaptationResponse = {
      id: uuidv4(),
      loopId: loop.id,
      timestamp: new Date(),
      adaptationType: this.determineAdaptationType(loop),
      changes: await this.generateAdaptationChanges(loop),
      expectedImpact: Math.abs(loop.adaptation),
      confidence: loop.confidence,
    }

    this.adaptationResponses.push(adaptation)

    // Apply adaptation
    await this.applyAdaptation(loop, adaptation)

    // Reset adaptation counter
    loop.adaptation = 0

    this.emit('adaptationTriggered', adaptation)
  }

  /**
   * Determine adaptation type
   */
  private determineAdaptationType(
    loop: LearningFeedbackLoop,
  ): AdaptationResponse['adaptationType'] {
    if (loop.performance < 0.5) {
      return 'behavior_modification'
    } else if (loop.confidence < 0.6) {
      return 'parameter_adjustment'
    } else if (loop.strength < 0.4) {
      return 'strategy_change'
    } else {
      return 'structure_evolution'
    }
  }

  /**
   * Generate adaptation changes
   */
  private async generateAdaptationChanges(
    loop: LearningFeedbackLoop,
  ): Promise<AdaptationChange[]> {
    const changes: AdaptationChange[] = []

    // Learning rate adjustment
    if (loop.performance < 0.6) {
      changes.push({
        parameter: 'learning_rate',
        oldValue: this.config.learningRate,
        newValue: Math.min(0.5, this.config.learningRate * 1.2),
        reason: 'Poor performance detected',
        impact: 0.1,
      })
    }

    // Strength adjustment
    if (loop.confidence > 0.8) {
      changes.push({
        parameter: 'strength',
        oldValue: loop.strength,
        newValue: Math.min(1.0, loop.strength * 1.1),
        reason: 'High confidence allows strength increase',
        impact: 0.05,
      })
    }

    return changes
  }

  /**
   * Apply adaptation
   */
  private async applyAdaptation(
    loop: LearningFeedbackLoop,
    adaptation: AdaptationResponse,
  ): Promise<void> {
    for (const change of adaptation.changes) {
      switch (change.parameter) {
        case 'learning_rate':
          // Apply learning rate change (would need system integration)
          break

        case 'strength':
          loop.strength = Number(change.newValue)
          break

        default:
          console.log(`Unknown adaptation parameter: ${change.parameter}`)
      }
    }

    console.log(`🔄 Applied adaptation to loop: ${loop.name}`)
  }

  /**
   * Generate insights from learning event
   */
  private async generateInsightsFromEvent(event: LearningEvent): Promise<void> {
    // Look for patterns in recent events
    const recentEvents = this.getAllRecentEvents()
    const pattern = this.detectEventPattern(recentEvents)

    if (pattern && pattern.significance > 0.7) {
      const insight: LearningInsight = {
        id: uuidv4(),
        insight: pattern.description,
        confidence: pattern.significance,
        sourceLoops: pattern.involvedLoops,
        applicability: pattern.applicableContexts,
        evidence: pattern.supportingEvents,
        recommendations: pattern.recommendations,
        createdAt: new Date(),
      }

      this.learningInsights.set(insight.id, insight)

      this.emit('insightGenerated', insight)
    }
  }

  /**
   * Update all feedback loops
   */
  private updateAllLoops(): void {
    for (const loop of this.feedbackLoops.values()) {
      if (loop.isActive) {
        // Apply decay
        loop.performance *= this.config.decayRate
        loop.strength *= this.config.decayRate

        // Clamp values
        loop.performance = Math.max(0.1, Math.min(1.0, loop.performance))
        loop.strength = Math.max(0.1, Math.min(1.0, loop.strength))
      }
    }
  }

  /**
   * Cleanup old data
   */
  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - 86400000 * 7) // 7 days ago

    // Clean old feedback signals
    this.feedbackSignals = this.feedbackSignals.filter(
      (signal) => signal.timestamp >= cutoff,
    )

    // Clean old adaptation responses
    this.adaptationResponses = this.adaptationResponses.filter(
      (response) => response.timestamp >= cutoff,
    )

    // Clean old learning events from loops
    for (const loop of this.feedbackLoops.values()) {
      loop.learningHistory = loop.learningHistory.filter(
        (event) => event.timestamp >= cutoff,
      )
    }
  }

  /**
   * Utility methods
   */
  private getAllRecentEvents(): LearningEvent[] {
    const cutoff = new Date(Date.now() - 3600000) // Last hour

    return Array.from(this.feedbackLoops.values())
      .flatMap((loop) => loop.learningHistory)
      .filter((event) => event.timestamp >= cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private detectEventPattern(events: LearningEvent[]): {
    description: string
    significance: number
    involvedLoops: string[]
    applicableContexts: string[]
    supportingEvents: LearningEvent[]
    recommendations: string[]
  } | null {
    // Simplified pattern detection
    const successEvents = events.filter((e) => e.eventType === 'success')

    if (successEvents.length > 3) {
      return {
        description:
          'Consistent success pattern detected across multiple loops',
        significance: 0.8,
        involvedLoops: ['multiple'],
        applicableContexts: ['performance', 'learning'],
        supportingEvents: successEvents.slice(0, 3),
        recommendations: [
          'Continue current strategy',
          'Consider expanding successful patterns to other areas',
        ],
      }
    }

    return null
  }

  private countCrossLearningEvents(): number {
    // Count events that influence multiple loops
    return this.adaptationResponses.filter((response) => {
      const loop = this.feedbackLoops.get(response.loopId)
      return loop && loop.connections.length > 0
    }).length
  }
}

export default LearningFeedbackLoops
