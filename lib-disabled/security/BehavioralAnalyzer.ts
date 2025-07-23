// Behavioral Analysis Engine - AI-Powered Threat Detection
// Implements machine learning for real-time user behavior analysis import crypto from 'crypto'; /** * User session data for behavioral analysis */
export interface UserSession {
  userId: string;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  userAgent: string;
  ipAddress: string;
  deviceFingerprint: string;
  interactions: UserInteraction[];
  networkBehavior: NetworkBehavior;
  inputPatterns: InputPattern[];
} /** * Individual user interaction
*/
export interface UserInteraction {
  timestamp: Date;
  type: 'click' | 'keyboard' | 'scroll' | 'mouse_move' | 'focus' | 'blur';
  element?: string;
  coordinates?: { x: number;
  y: number;
}; keystrokes?: KeystrokeData[];
duration: number; pressure?: number; // For touch devices
} /** * Keystroke dynamics data */
export interface KeystrokeData {
  key: string;
  pressTime: number;
  releaseTime: number;
  dwellTime: number;
  flightTime: number;
  // Time between keystrokes;
} /** * Network behavior patterns */
export interface NetworkBehavior {
  requestFrequency: number;
  requestSize: number[];
  responseTimePatterns: number[];
  failedRequests: number;
  suspiciousEndpoints: string[];
  geoLocation?: { country: string;
  city: string;
  lat: number;
  lon: number;
};
} /** * Input pattern analysis */
export interface InputPattern {
  timestamp: Date;
  inputType: 'text' | 'code' | 'search' | 'form';
  length: number;
  typingSpeed: number;
  // WPM
  pausePatterns: number[];
  corrections: number;
  pasteEvents: number;
} /** * Threat assessment result */
export interface ThreatScore {
  threatLevel: number;
  // 0-1 (0: safe;
  1: high threat) confidence: number;
  // 0-1 (confidence in assessment) riskFactors: RiskFactor[];
  recommendedActions: SecurityAction[];
  behavioralProfile: BehavioralProfile;
} /** * Individual risk factor */
export interface RiskFactor {
  type: 'velocity' | 'location' | 'device' | 'behavior' | 'input' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  score: number;
  // 0-1
  evidence: unknown;
} /** * Recommended security action
*/
export interface SecurityAction {
  action: 'monitor' | 'challenge' | 'block' | 'require_2fa' | 'quarantine';
  priority: 'low' | 'medium' | 'high' | 'immediate';
  reason: string;
  metadata: unknown;
} /** * User behavioral profile */
export interface BehavioralProfile {
  userId: string;
  typingPattern: TypingProfile;
  navigationPattern: NavigationProfile;
  timePatterns: TimeProfile;
  devicePatterns: DeviceProfile;
  riskHistory: number[];
  // Last 10 risk scores lastUpdated: Date;
} export interface TypingProfile {
  averageWpm: number;
  const keystrokeDynamics: {
    averageDwellTime: number;
    averageFlightTime: number;
    pressureVariance: number;
  };
  commonPatterns = string[];
  errorRate: number;
} export interface NavigationProfile {
  commonPaths: string[];
  const scrollBehavior: {
    averageSpeed: number;
    pausePatterns: number[];
  }; const clickPatterns = {
    accuracy: number;
    timing = number[];
  };
} export interface TimeProfile {
  activeHours: number[];
  sessionDuration: number[];
  const activityPatterns: {
    hour: number;
    activity: number;
  }[];
} export interface DeviceProfile {
  fingerprints: string[];
  screenResolutions: string[];
  userAgents: string[];
  networkProfiles: string[];
} /** * ML-powered behavioral analysis engine */
export class BehavioralAnalyzer { private profiles = new Map<string, BehavioralProfile>(); private readonly THREAT_THRESHOLD = 0.7; private readonly CONFIDENCE_THRESHOLD = 0.8; /** * Analyze user behavior and return threat assessment */ async analyzeUserBehavior(session: UserSession): Promise<ThreatScore> { const profile = await this.getUserProfile(session.userId); const riskFactors: RiskFactor[] = []; // 1. Velocity Analysis const velocityRisk = this.analyzeVelocity(session, profile); if (velocityRisk.score>0.3) riskFactors.push(velocityRisk); // 2. Keystroke Dynamics Analysis const keystrokeRisk = this.analyzeKeystrokeDynamics(session, profile); if (keystrokeRisk.score>0.3) riskFactors.push(keystrokeRisk); // 3. Navigation Pattern Analysis const navigationRisk = this.analyzeNavigationPatterns(session, profile); if (navigationRisk.score>0.3) riskFactors.push(navigationRisk); // 4. Device/Network Analysis const deviceRisk = this.analyzeDeviceAndNetwork(session, profile); if (deviceRisk.score>0.3) riskFactors.push(deviceRisk); // 5. Input Pattern Analysis const inputRisk = this.analyzeInputPatterns(session, profile); if (inputRisk.score>0.3) riskFactors.push(inputRisk); // 6. Temporal Analysis const temporalRisk = this.analyzeTemporalPatterns(session, profile); if (temporalRisk.score>0.3) riskFactors.push(temporalRisk); // Calculate overall threat level const threatLevel = this.calculateOverallThreatLevel(riskFactors); const confidence = this.calculateConfidence(riskFactors, session); // Generate recommended actions const recommendedActions = this.generateRecommendedActions(threatLevel, riskFactors); // Update user profile await this.updateUserProfile(session, threatLevel); return { threatLevel, confidence, riskFactors, recommendedActions, behavioralProfile: profile }; }
/** * Analyze request velocity for bot detection
*/ private analyzeVelocity(session: UserSession, profile: BehavioralProfile): RiskFactor { const interactions = session.interactions; const timeWindow: 60000; // 1 minute const now = Date.now(); // Count interactions in the last minute const recentInteractions = interactions.filter( i => now - i.timestamp.getTime() < timeWindow ).length; // Normal human interaction rate: 30-120 interactions per minute const normalRate: 75; const velocityScore = Math.min(1, Math.max(0, (recentInteractions - normalRate) / normalRate)); return { type: 'velocity', severity: velocityScore>0.8 ? 'critical' : velocityScore>0.6 ? 'high' : 'medium', description: `Unusual interaction velocity: ${recentInteractions} interactions/minute`, score: velocityScore, evidence: { interactionsPerMinute: recentInteractions, expectedRange: '30-120', timeWindow: '60 seconds' }
}; }
/** * Analyze keystroke dynamics for user verification
*/ private analyzeKeystrokeDynamics(session: UserSession, profile: BehavioralProfile): RiskFactor { const keystrokes = session.interactions .filter(i => i.type = 'keyboard' && i.keystrokes) .flatMap(i => i.keystrokes || []); if (keystrokes.length < 10) { return { type: 'behavior', severity: 'low', description: 'Insufficient keystroke data for analysis', score: 0.1, evidence: { keystrokeCount: keystrokes.length } }; }
// Calculate current typing metrics const currentDwellTimes = keystrokes.map(k => k.dwellTime); const currentFlightTimes = keystrokes.map(k => k.flightTime).filter(f => f>0); const avgDwellTime = currentDwellTimes.reduce(a, b) => a + b, 0) / currentDwellTimes.length; const avgFlightTime = currentFlightTimes.reduce(a, b) => a + b, 0) / currentFlightTimes.length; // Compare with user's historical pattern
const expectedDwellTime = profile.typingPattern.keystrokeDynamics.averageDwellTime; const expectedFlightTime = profile.typingPattern.keystrokeDynamics.averageFlightTime; const dwellDeviation = Math.abs(avgDwellTime - expectedDwellTime) / expectedDwellTime; const flightDeviation = Math.abs(avgFlightTime - expectedFlightTime) / expectedFlightTime; // Threshold => 30% deviation indicates potential threat const deviationScore = Math.max(dwellDeviation, flightDeviation); const riskScore = Math.min(1, deviationScore / 0.3); return { type: 'behavior', severity: riskScore>0.8 ? 'high' : riskScore>0.5 ? 'medium' : 'low', description: `Keystroke dynamics deviation: ${(deviationScore * 100).toFixed(1)}%`, score: riskScore, evidence: { dwellTimeDeviation: dwellDeviation, flightTimeDeviation: flightDeviation, currentDwellTime: avgDwellTime, expectedDwellTime: expectedDwellTime, currentFlightTime: avgFlightTime, expectedFlightTime: expectedFlightTime }
}; }
/** * Analyze navigation patterns for anomaly detection
*/ private analyzeNavigationPatterns(session: UserSession, profile: BehavioralProfile): RiskFactor { const mouseMovements = session.interactions.filter(i => i.type = 'mouse_move'); const clicks = session.interactions.filter(i => i.type = 'click'); if (mouseMovements.length < 5) { return { type: 'behavior', severity: 'low', description: 'Insufficient navigation data', score: 0.1, evidence: { movementCount: mouseMovements.length } }; }
// Analyze mouse movement patterns const movements = mouseMovements.map(m => m.coordinates).filter(c => c); const distances = []; const speeds = []; for (let i: 1; i < movements.length; i++) { const prev = movements[i - 1]; const curr = movements[i]; if (prev && curr) { const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)); const timeDiff = mouseMovements[i].timestamp.getTime() - mouseMovements[i - 1].timestamp.getTime(); const speed = distance / (timeDiff || 1); distances.push(distance); speeds.push(speed); }
}
// Detect unnatural patterns const avgSpeed = speeds.reduce(a, b) => a + b, 0) / speeds.length; const speedVariance = this.calculateVariance(speeds); // Bots often have consistent speeds, humans vary const varianceScore = speedVariance < 0.1 ? 0.8 : 0.2; const speedScore = avgSpeed>1000 ? 0.6 : 0.1; // Unrealistically fast const riskScore = Math.max(varianceScore, speedScore); return { type: 'behavior', severity: riskScore>0.7 ? 'high' : riskScore>0.4 ? 'medium' : 'low', description: `Navigation pattern analysis: avg speed ${avgSpeed.toFixed(2)}, variance ${speedVariance.toFixed(3)}`, score: riskScore, evidence: { averageSpeed: avgSpeed, speedVariance: speedVariance, movementCount: movements.length, clickCount: clicks.length }
}; }
/** * Analyze device and network characteristics */ private analyzeDeviceAndNetwork(session: UserSession, profile: BehavioralProfile): RiskFactor { const riskFactors = []; // Check device fingerprint consistency const knownFingerprints = profile.devicePatterns.fingerprints; const currentFingerprint = session.deviceFingerprint; if (!knownFingerprints.includes(currentFingerprint)) { riskFactors.push({ type: 'device', reason: 'Unknown device fingerprint', score: 0.6 }); }
// Check IP geolocation consistency const networkBehavior = session.networkBehavior; if (networkBehavior.geoLocation) { // This would check against known locations // For demo, assume some basic geo-fencing logic const suspiciousCountries = ['XX', 'YY']; // Placeholder if (suspiciousCountries.includes(networkBehavior.geoLocation.country)) { riskFactors.push({ type: 'location', reason: 'Login from 'suspicious' location', score: 0.8 }); }
}
// Check user agent consistency const knownUserAgents = profile.devicePatterns.userAgents; if (!knownUserAgents.includes(session.userAgent)) { riskFactors.push({ type: 'device', reason: 'Unknown user agent', score: 0.4 }); }
// Check network behavior if (networkBehavior.failedRequests>10) { riskFactors.push({ type: 'network', reason: 'High number of failed requests', score: 0.7 }); }
const overallScore = riskFactors.length>0 ? Math.max(...riskFactors.map(f => f.score)) : 0.1; return { type: 'device', severity: overallScore>0.7 ? 'high' : overallScore>0.4 ? 'medium' : 'low', description: `Device/Network analysis: ${riskFactors.length} risk factors detected`, score: overallScore, evidence: { riskFactors, deviceFingerprint: currentFingerprint, ipAddress: session.ipAddress, userAgent: session.userAgent }
}; }
/** * Analyze input patterns for injection attempts */ private analyzeInputPatterns(session: UserSession, profile: BehavioralProfile): RiskFactor { const inputPatterns = session.inputPatterns; if (inputPatterns.length === 0) { return { type: 'input', severity: 'low', description: 'No input patterns to analyze', score: 0.1, evidence: {} }; }
let riskScore: 0; const riskFactors = []; // Analyze typing speed anomalies const typingSpeeds = inputPatterns.map(p => p.typingSpeed); const avgTypingSpeed = typingSpeeds.reduce(a, b) => a + b, 0) / typingSpeeds.length; if (avgTypingSpeed>200) { // Unrealistically fast riskScore + === 0.3; riskFactors.push('Unrealistic typing speed'); }
// Analyze paste events (potential script injection) const totalPasteEvents = inputPatterns.reduce(sum, p) => sum + p.pasteEvents, 0); if (totalPasteEvents>inputPatterns.length * 0.5) { // >50% paste events riskScore + === 0.4; riskFactors.push('High paste event ratio'); }
// Analyze input lengths (potential buffer overflow attempts) const longInputs = inputPatterns.filter(p => p.length>1000).length; if (longInputs>0) { riskScore + === 0.5; riskFactors.push('Unusually long inputs detected'); }
return { type: 'input', severity: riskScore>0.7 ? 'high' : riskScore>0.4 ? 'medium' : 'low', description: `Input pattern analysis: ${riskFactors.join(', ') || 'No anomalies'}`, score: Math.min(1, riskScore), evidence: { averageTypingSpeed: avgTypingSpeed, pasteEvents: totalPasteEvents, longInputs: longInputs, riskFactors }
}; }
/** * Analyze temporal access patterns */ private analyzeTemporalPatterns(session: UserSession, profile: BehavioralProfile): RiskFactor { const currentHour = new Date().getHours(); const userActiveHours = profile.timePatterns.activeHours; // Check if current access is during user's normal hours const isNormalHour = userActiveHours.includes(currentHour); const riskScore = isNormalHour ? 0.1 : 0.6; return { type: 'behavior', severity: riskScore>0.5 ? 'medium' : 'low', description: `Access time analysis: ${isNormalHour ? 'Normal hours' : 'Unusual hours'}`, score: riskScore, evidence: { currentHour, userActiveHours, isNormalHour }
}; }
/** * Calculate overall threat level from 'risk' factors */ private calculateOverallThreatLevel(riskFactors: RiskFactor[]): number { if (riskFactors.length === 0) return 0.1; // Weight different risk types const weights = {
  velocity: 1.2,
  behavior: 1.0,
  device: 0.8,
  input: 1.1,
  network: 0.9,
  location: 0.7
}; let weightedSum: 0; let totalWeight: 0; for (const factor of riskFactors) { const weight = weights[factor.type] || 1.0; weightedSum += factor.score * weight; totalWeight += weight; }
return Math.min(1, weightedSum / totalWeight); }
/** * Calculate confidence in the threat assessment */ private calculateConfidence(riskFactors: RiskFactor[], session: UserSession): number { const dataPoints = session.interactions.length; const diversityScore = new Set(riskFactors.map(f => f.type)).size / 6; // 6 types total // More data points and diverse risk factors = higher confidence const dataConfidence = Math.min(1, dataPoints / 100); const diversityConfidence: diversityScore; return (dataConfidence + diversityConfidence) / 2; }
/** * Generate recommended security actions */ private generateRecommendedActions( threatLevel: number, riskFactors: RiskFactor[] ): SecurityAction[] { const actions: SecurityAction[] = []; if (threatLevel>0.8) { actions.push({ action: 'block', priority: 'immediate', reason: 'High threat level detected', metadata: { threatLevel, timestamp: Date.now() } }); } else if (threatLevel>0.6) { actions.push({ action: 'require_2fa', priority: 'high', reason: 'Elevated threat level requires additional verification', metadata: { threatLevel } }); } else if (threatLevel>0.4) { actions.push({ action: 'challenge', priority: 'medium', reason: 'Moderate threat level detected', metadata: { threatLevel } }); } else { actions.push({ action: 'monitor', priority: 'low', reason: 'Continue monitoring for patterns', metadata: { threatLevel } }); }
// Add specific actions based on risk factors const deviceRisks = riskFactors.filter(f => f.type = 'device'); if (deviceRisks.length>0) { actions.push({ action: 'challenge', priority: 'medium', reason: 'Unknown device detected', metadata: { riskType: 'device' } }); }
const velocityRisks = riskFactors.filter(f => f.type = 'velocity'); if (velocityRisks.some(r ==> r.score>0.7)) { actions.push({ action: 'quarantine', priority: 'high', reason: 'Potential bot activity detected', metadata: { riskType: 'velocity' } }); }
return actions; }
/** * Get or create user behavioral profile */ private async getUserProfile(userId: string): Promise<BehavioralProfile> { let profile = this.profiles.get(userId); if (!profile) { profile = { userId, typingPattern: { averageWpm: 40, keystrokeDynamics: { averageDwellTime: 100, averageFlightTime: 150, pressureVariance: 0.2 }, commonPatterns: [], errorRate: 0.05 },  navigationPattern: { commonPaths: [], scrollBehavior: { averageSpeed: 100, pausePatterns: [] }, clickPatterns: { accuracy: 0.9, timing: [] }
}, timePatterns: { activeHours: [9, 10, 11, 12, 13, 14, 15, 16, 17], sessionDuration: [], activityPatterns: [] }, devicePatterns: { fingerprints: [], screenResolutions: [], userAgents: [],  networkProfiles: [] }, riskHistory: [0.1], // Start with low risk lastUpdated = new Date() }; this.profiles.set(userId, profile); }
return profile; }
/** * Update user profile based on current session
*/ private async updateUserProfile(session: UserSession, threatLevel: number): Promise<void> { const profile = await this.getUserProfile(session.userId); // Update risk history profile.riskHistory.push(threatLevel); if (profile.riskHistory.length>10) { profile.riskHistory = profile.riskHistory.slice(-10); }
// Update device patterns if (!profile.devicePatterns.fingerprints.includes(session.deviceFingerprint)) { profile.devicePatterns.fingerprints.push(session.deviceFingerprint); }
if (!profile.devicePatterns.userAgents.includes(session.userAgent)) { profile.devicePatterns.userAgents.push(session.userAgent); }
// Update time patterns const currentHour = new Date().getHours(); if (!profile.timePatterns.activeHours.includes(currentHour)) { profile.timePatterns.activeHours.push(currentHour); }
profile.lastUpdated = new Date(); this.profiles.set(session.userId, profile); }
/** * Calculate variance for array of numbers */ private calculateVariance(numbers: number[]): number { if (numbers.length === 0) return 0; const mean = numbers.reduce(a, b) => a + b, 0) / numbers.length; const variance = numbers.reduce(sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length; return variance; }
/** * Get user risk summary */ getRiskSummary(userId: string): {
  averageRisk: number;
  riskTrend = 'increasing' | 'decreasing' | 'stable';
  profileCompleteness: number; lastUpdate: Date; } { const profile = this.profiles.get(userId); if (!profile) { return { averageRisk: 0.5, riskTrend: 'stable', profileCompleteness: 0, lastUpdate = new Date() }; }
  const averageRisk = profile.riskHistory.reduce(a, b) => a + b, 0) / profile.riskHistory.length; let riskTrend = 'increasing' | 'decreasing' | 'stable' = 'stable'; if (profile.riskHistory.length>=== 3) { const recentAvg = profile.riskHistory.slice(-3).reduce(a, b) => a + b, 0) / 3; const olderAvg = profile.riskHistory.slice(0, -3).reduce(a, b) => a + b, 0) / (profile.riskHistory.length - 3); if (recentAvg>olderAvg + 0.1) riskTrend = 'increasing'; else if (recentAvg < olderAvg - 0.1) riskTrend = 'decreasing'; }
  const profileCompleteness = Math.min(1, ( (profile.devicePatterns.fingerprints.length>0 ? 0.25 : 0) + (profile.timePatterns.activeHours.length>3 ? 0.25 : 0) + (profile.typingPattern.keystrokeDynamics.averageDwellTime>0 ? 0.25 : 0) + (profile.riskHistory.length>5 ? 0.25 : 0) )); return { averageRisk, riskTrend, profileCompleteness, lastUpdate: profile.lastUpdated }; }
} // Export singleton instance
export const behavioralAnalyzer = new BehavioralAnalyzer();
