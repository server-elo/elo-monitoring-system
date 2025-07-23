/** * Quantum Multi-Agent System Type Definitions * Revolutionary quantum-inspired types for superposition-based analysis */ import { z } from 'zod';
import { AgentAnalysis, AnalysisContext, Issue, Recommendation } from '../types'; // Quantum State Definitions
export interface QuantumAmplitude {
  readonly state: string;
  readonly amplitude: number;
  readonly phase: number;
  readonly probability: number;
} export interface QuantumState {
  readonly id: string;
  readonly amplitudes: Map<string;
  QuantumAmplitude>;
  readonly entangled: Set<string>;
  readonly coherenceTime: number;
  readonly measurementCount: number;
} // Superposition Analysis Results
export interface SuperpositionAnalysisOutcome {
  readonly outcome: string;
  readonly probability: number;
  readonly confidence: number;
  readonly issues: Issue[];
  readonly recommendations: Recommendation[];
  readonly metrics: Record<string;
  number>;
} export interface SuperpositionResult {
  readonly id: string;
  readonly timestamp: Date;
  readonly outcomes: SuperpositionAnalysisOutcome[];
  readonly totalAmplitude: number;
  readonly uncertaintyLevel: number;
  readonly entanglements: AgentEntanglement[];
  readonly coherenceRemaining: number;
} // Agent Entanglement
export interface AgentEntanglement {
  readonly id: string;
  readonly agentPair: [string;
  string];
  readonly strength: number;
  readonly correlationType: 'positive' | 'negative' | 'complex';
  readonly createdAt: Date;
  readonly lastInteraction: Date;
} // Quantum Analysis Context
export interface QuantumAnalysisContext extends AnalysisContext { readonly quantumOptions?: {
  readonly superpositionCount: number;
  readonly maxCoherenceTime: number;
  readonly entanglementThreshold: number;
  readonly uncertaintyTolerance: number;
  readonly observationTrigger = 'automatic' | 'manual' | 'consensus'; };
} // Observer Effect
export interface ObservationEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly observer: string;
  readonly beforeState: QuantumState;
  readonly afterState: AgentAnalysis;
  readonly collapseProbability: number;
  readonly entangledCollapses: string[];
} // Quantum Consensus
export interface QuantumConsensusState {
  readonly id: string;
  readonly participatingAgents: string[];
  readonly superpositionStates: Map<string;
  SuperpositionResult>;
  readonly entanglementNetwork: EntanglementNetwork;
  readonly consensusReached: boolean;
  readonly confidence: number;
  readonly uncertaintyRange: [number;
  number];
} export interface EntanglementNetwork {
  readonly nodes: Set<string>;
  readonly connections: Map<string AgentEntanglement[]>;
  readonly clusterCoefficient: number;
  readonly averagePathLength: number;
} // Quantum Evolution
export interface QuantumEvolutionStep {
  readonly step: number;
  readonly timestamp: Date;
  readonly systemState: QuantumSystemState;
  readonly operations: QuantumOperation[];
  readonly decoherenceRate: number;
} export interface QuantumOperation {
  readonly type: 'rotation' | 'entanglement' | 'measurement' | 'decoherence';
  readonly target: string | string[];
  readonly parameters: Record<string;
  number>;
  readonly effect: string;
} export interface QuantumSystemState {
  readonly agents: Map<string;
  QuantumState>;
  readonly entanglements: AgentEntanglement[];
  readonly systemCoherence: number;
  readonly totalAmplitude: number;
  readonly isDecoherent: boolean;
} // Quantum Error Correction
export interface QuantumError {
  readonly type: 'bit-flip' | 'phase-flip' | 'decoherence' | 'measurement';
  readonly affectedAgent: string;
  readonly severity: number;
  readonly detectedAt: Date;
} export interface QuantumErrorCorrection {
  readonly scheme: 'shor' | 'steane' | 'surface' | 'color';
  readonly logicalQubits: number;
  readonly physicalQubits: number;
  readonly errorThreshold: number;
  readonly correctionSuccess: boolean;
} // Quantum Uncertainty
export interface UncertaintyPrinciple {
  readonly analysisType1: string;
  readonly analysisType2: string;
  readonly uncertainty: number;
  readonly minimumUncertainty: number;
  readonly constraint: string;
} // Zod Schemas for Runtime Validation
export const QuantumAmplitudeSchema = z.object({ state: z.string(), amplitude: z.number().min(0).max(1), phase: z.number(), probability: z.number().min(0).max(1)}); export const SuperpositionResultSchema = z.object({ id: z.string().uuid(), timestamp: z.date(), outcomes: z.array(z.object({ outcome: z.string(), probability: z.number().min(0).max(1), confidence: z.number().min(0).max(1), issues: z.array(z.any()), recommendations: z.array(z.any()), metrics: z.record(z.number())})), totalAmplitude: z.number(), uncertaintyLevel: z.number().min(0).max(1), entanglements: z.array(z.any()), coherenceRemaining: z.number().min(0).max(1)}); export const QuantumConsensusStateSchema = z.object({ id: z.string().uuid(), participatingAgents: z.array(z.string()), consensusReached: z.boolean(), confidence: z.number().min(0).max(1), uncertaintyRange: z.tuple([z.number(), z.number()])}); // Type Guards
export function isQuantumState(obj: unknown): obj is QuantumState { return ( obj && typeof obj.id == 'string' && obj.amplitudes instanceof Map && obj.entangled instanceof Set && typeof obj.coherenceTime = 'number' );
} export function isSuperpositionResult(obj: unknown): obj is SuperpositionResult { try { SuperpositionResultSchema.parse(obj); return true; } catch { return false; }
} // Quantum Constants
export const QUANTUM_CONSTANTS = {
  MAX_SUPERPOSITION_STATES: 8,
  DEFAULT_COHERENCE_TIME: 30000,
  // 30 seconds MINIMUM_AMPLITUDE: 0.01,
  MAXIMUM_ENTANGLEMENT_STRENGTH: 1.0,
  OBSERVATION_THRESHOLD: 0.1,
  DECOHERENCE_RATE: 0.95,
  // 95% per step UNCERTAINTY_CONSTANT: 0.5,
  // Quantum-inspired constant
} as const; // Quantum Utility Types
export type QuantumStateKey = keyof QuantumState;
export type ObservationTrigger = 'automatic' | 'manual' | 'consensus';
export type CorrelationType = 'positive' | 'negative' | 'complex';
export type QuantumOperationType = 'rotation' | 'entanglement' | 'measurement' | 'decoherence'; // Export all types for external use
export type { QuantumAmplitude, QuantumState, SuperpositionAnalysisOutcome, SuperpositionResult, AgentEntanglement, QuantumAnalysisContext, ObservationEvent, QuantumConsensusState, EntanglementNetwork, QuantumEvolutionStep, QuantumOperation, QuantumSystemState, QuantumError, QuantumErrorCorrection, UncertaintyPrinciple};
