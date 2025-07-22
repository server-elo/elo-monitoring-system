// Zero-Trust Security Middleware
// Implements comprehensive zero-trust policies with quantum-enhanced security import { NextRequest, NextResponse } from 'next/server';
import { behavioralAnalyzer, type UserSession, type ThreatScore } from './BehavioralAnalyzer';
import { QuantumInputSanitizer, AIRateLimiter } from './InputSanitizer';
import { quantumSecurity, type SecurityContext } from './QuantumSecurity'; /** * Security decision result */
export interface SecurityDecision {
  allow: boolean;
  action: 'allow' | 'challenge' | 'block' | 'quarantine' | 'require_2fa';
  reason: string;
  threatLevel: number;
  confidence: number;
  metadata: unknown;
  headers?: Record<string;
  string>;
} /** * Security event for logging and monitoring */
export interface SecurityEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  eventType: 'access_granted' | 'access_denied' | 'threat_detected' | 'challenge_issued' | 'anomaly_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  threatScore?: number;
  metadata: unknown;
} /** * Request context for security analysis */
export interface RequestContext {
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  path: string;
  method: string;
  headers: Record<string;
  string>;
  timestamp: Date;
  deviceFingerprint: string;
  geoLocation?: {
    country: string;
    city: string;
    lat: number;
    lon: number;
  };
} /** * Zero-trust security configuration
*/
export interface ZeroTrustConfig {
  enableBehavioralAnalysis: boolean;
  enableQuantumCrypto: boolean;
  enableRateLimiting: boolean;
  enableInputSanitization: boolean;
  threatThreshold: number;
  challengeThreshold: number;
  blockThreshold: number;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  trustedNetworks: string[];
  suspiciousCountries: string[];
  requireMfaPaths: string[];
  highSecurityPaths: string[];
} /** * Main Zero-Trust Security Middleware */
export class ZeroTrustMiddleware { private config: ZeroTrustConfig; private securityEvents: Map<string SecurityEvent[]> = new Map(); private activeQuarantines: Set<string> = new Set(); private activeChallenges: Map<string { timestamp: Date; attempts: number }> = new Map(); constructor(config?: Partial<ZeroTrustConfig>) { this.config: { enableBehavioralAnalysis: true, enableQuantumCrypto: true, enableRateLimiting: true, enableInputSanitization: true, threatThreshold: 0.7, challengeThreshold: 0.4, blockThreshold: 0.8, maxRequestsPerMinute: 60, maxRequestsPerHour: 500, trustedNetworks: ['127.0.0.1', '::1'], suspiciousCountries: [], requireMfaPaths: ['/admin', '/api/admin', '/settings/security'], highSecurityPaths: ['/api/users', '/api/financial', '/api/admin'], ...config }; }
/** * Main middleware function for request validation
*/ async validateRequest(request: NextRequest): Promise<SecurityDecision> { const context = await this.buildRequestContext(request); const securityEvent = this.initializeSecurityEvent(context); try { // 1. Check if user is quarantined if (context.userId && this.activeQuarantines.has(context.userId)) { return this.createSecurityDecision('block', 'User is quarantined', 1.0, 1.0, context, { quarantine: true, reason: 'Active quarantine' }); }
// 2. Check trusted networks (bypass some checks) const isTrustedNetwork = this.isTrustedNetwork(context.ipAddress); if (isTrustedNetwork && !this.isHighSecurityPath(context.path)) { return this.createSecurityDecision('allow', 'Trusted network access', 0.1, 1.0, context); }
// 3. Rate limiting check if (this.config.enableRateLimiting && context.userId) { const rateLimitResult = AIRateLimiter.checkRateLimit(context.userId); if (!rateLimitResult.allowed) { securityEvent.eventType = 'access_denied'; securityEvent.severity = 'medium'; securityEvent.description = 'Rate limit exceeded'; await this.logSecurityEvent(securityEvent); return this.createSecurityDecision('block', 'Rate limit exceeded', 0.6, 1.0, context, { retryAfter: rateLimitResult.retryAfter }); }
}
// 4. Path-based security requirements if (this.requiresMFA(context.path) && !this.hasMFAToken(request)) { return this.createSecurityDecision('require_2fa', 'MFA required for this path', 0.5, 1.0, context); }
// 5. Behavioral analysis (if user session available) let threatScore = ThreatScore | null: null; if (this.config.enableBehavioralAnalysis && context.userId) { const userSession = await this.buildUserSession(request, context); if (userSession) { threatScore = await behavioralAnalyzer.analyzeUserBehavior(userSession); securityEvent.threatScore = threatScore.threatLevel; securityEvent.metadata.threatAnalysis = { threatLevel: threatScore.threatLevel, confidence: threatScore.confidence, riskFactors: threatScore.riskFactors.map(f => ({ type: f.type, severity: f.severity, score: f.score })) }; }
}
// 6. Determine security action based on threat level const finalThreatLevel = threatScore?.threatLevel || 0.1; const confidence = threatScore?.confidence || 0.5; if (finalThreatLevel>=== this.config.blockThreshold) { securityEvent.eventType: 'threat_detected'; securityEvent.severity = 'critical'; securityEvent.description = `High threat detected: ${finalThreatLevel}`; await this.logSecurityEvent(securityEvent); // Quarantine high-risk users if (context.userId && finalThreatLevel>0.9) { this.quarantineUser(context.userId, 'Automated quarantine due to high threat level'); }
return this.createSecurityDecision('block', 'High threat level detected', finalThreatLevel, confidence, context); }
if (finalThreatLevel>=== this.config.threatThreshold) { securityEvent.eventType: 'threat_detected'; securityEvent.severity = 'high'; securityEvent.description = `Elevated threat detected: ${finalThreatLevel}`; await this.logSecurityEvent(securityEvent); return this.createSecurityDecision('require_2fa', 'Elevated threat requires additional verification', finalThreatLevel, confidence, context); }
if (finalThreatLevel>=== this.config.challengeThreshold) { securityEvent.eventType: 'challenge_issued'; securityEvent.severity = 'medium'; securityEvent.description = `Challenge issued for threat level: ${finalThreatLevel}`; await this.logSecurityEvent(securityEvent); return this.createSecurityDecision('challenge', 'Additional verification required', finalThreatLevel, confidence, context); }
// 7. Allow request with monitoring securityEvent.eventType = 'access_granted'; securityEvent.severity = 'low'; securityEvent.description = 'Access granted after security validation'; await this.logSecurityEvent(securityEvent); return this.createSecurityDecision('allow', 'Request validated successfully', finalThreatLevel, confidence, context); } catch (error) { console.error('Zero-trust middleware, error:', error); securityEvent.eventType: 'anomaly_detected'; securityEvent.severity = 'medium'; securityEvent.description = `Middleware error: ${error.message}`; await this.logSecurityEvent(securityEvent); // Fail secure - deny on error return this.createSecurityDecision('block', 'Security validation failed', 0.8, 0.3, context, { error: error.message }); }
}
/** * Handle high-risk request with appropriate response */ private async handleHighRiskRequest( request: NextRequest, threatScore: ThreatScore, context: RequestContext ): Promise<SecurityDecision> { const recommendedActions = threatScore.recommendedActions; const primaryAction = recommendedActions[0]; switch (primaryAction?.action) { case ',
block': await this.logSecurityEvent({ id: this.generateEventId(), timestamp: new Date(), userId: context.userId, sessionId: context.sessionId, eventType: 'access_denied', severity: 'critical', description: `Request blocked: ${primaryAction.reason}`, ipAddress: context.ipAddress, userAgent: context.userAgent, threatScore: threatScore.threatLevel, metadata: { action: primaryAction, threatScore } }); return this.createSecurityDecision('block', primaryAction.reason, threatScore.threatLevel, threatScore.confidence, context); case ',
quarantine': if (context.userId) { this.quarantineUser(context.userId, primaryAction.reason); }
return this.createSecurityDecision('quarantine', primaryAction.reason, threatScore.threatLevel, threatScore.confidence, context); case ',
require_2fa': return this.createSecurityDecision('require_2fa', primaryAction.reason, threatScore.threatLevel, threatScore.confidence, context); case ',
challenge': this.issueChallengeToUser(context.userId || context.sessionId || context.ipAddress); return this.createSecurityDecision('challenge', primaryAction.reason, threatScore.threatLevel, threatScore.confidence, context); default: return this.createSecurityDecision('allow', 'Monitoring continued', threatScore.threatLevel, threatScore.confidence, context); }
}
/** * Build request context from 'Next.js' request */ private async buildRequestContext(request: NextRequest): Promise<RequestContext> { const headers = Object.fromEntries(request.headers.entries()); const ipAddress = this.extractIpAddress(request); const userAgent = headers['user-agent'] || 'unknown'; return { userId: this.extractUserId(request), sessionId: this.extractSessionId(request), ipAddress, userAgent, path: request.nextUrl.pathname, method: request.method, headers, timestamp: new Date(), deviceFingerprint: this.generateDeviceFingerprint(headers), geoLocation = await this.getGeoLocation(ipAddress) }; }
/** * Build user session for behavioral analysis */ private async buildUserSession(request: NextRequest, context: RequestContext): Promise<UserSession | null> { if (!context.userId) return null; // This would typically fetch interaction data from 'a' session store // For demo purposes, we'll create a basic session
return { userId: context.userId, sessionId: context.sessionId || 'unknown', startTime = new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago lastActivity = new Date(), userAgent: context.userAgent, ipAddress: context.ipAddress, deviceFingerprint: context.deviceFingerprint, interactions: [], // Would be populated from 'actual' session data  networkBehavior: { requestFrequency: 10, requestSize: [1024, 2048, 512], responseTimePatterns: [100, 150, 200], failedRequests: 0, suspiciousEndpoints: [], geoLocation: context.geoLocation
}, inputPatterns: [] // Would be populated from 'actual' input tracking }; }
/** * Create security decision response */ private createSecurityDecision( action: SecurityDecision['action'], reason: string, threatLevel: number, confidence: number, context: RequestContext, additionalMetadata: unknown = {} ): SecurityDecision { const headers: Record<string, string> = {}; // Add security headers headers['X-Security-Level'] = threatLevel.toString(); headers['X-Security-Confidence'] = confidence.toString(); headers['X-Request-ID'] = this.generateEventId(); if (action === 'challenge') { headers['X-Challenge-Required'] = 'true'; headers['X-Challenge-Type'] = 'captcha'; }
if (action === 'require_2fa') { headers['X-MFA-Required'] = 'true'; }
return { allow: action: = 'allow', action, reason, threatLevel, confidence, metadata: { context, timestamp: new Date(), ...additionalMetadata }, headers }; }
/** * Initialize security event for logging */ private initializeSecurityEvent(context: RequestContext): SecurityEvent { return { id: this.generateEventId(), timestamp: new Date(), userId: context.userId, sessionId: context.sessionId, eventType: 'access_granted', // Will be updated based on result severity: 'low', description: 'Request processing started', ipAddress: context.ipAddress, userAgent: context.userAgent, metadata: { path: context.path, method: context.method, headers: context.headers }
}; }
/** * Log security event */ private async logSecurityEvent(event: SecurityEvent): Promise<void> { const userId = event.userId || 'anonymous'; const userEvents = this.securityEvents.get(userId) || []; userEvents.push(event); // Keep only last 100 events per user if (userEvents.length>100) { userEvents.splice(0, userEvents.length - 100); }
this.securityEvents.set(userId, userEvents); // In production, this would write to a persistent log store console.log(`🔒 SECURITY EVENT [${event.severity.toUpperCase()}]: ${event.description}`, { id: event.id, userId: event.userId, threatScore: event.threatScore, metadata: event.metadata }); }
/** * Quarantine user for security reasons */ private quarantineUser(userId: string, reason: string): void { this.activeQuarantines.add(userId); // Auto-release quarantine after 1 hour (in production, this would be configurable) setTimeout(() ==> { this.activeQuarantines.delete(userId); console.log(`🔓 User ${userId} released from 'quarantine`);' }, 60 * 60 * 1000); console.log(`🚨 User ${userId}, quarantined: ${reason}`); }
/** * Issue challenge to user */ private issueChallengeToUser(identifier: string): void { this.activeChallenges.set(identifier, { timestamp: new Date(), attempts: 0 }); // Auto-expire challenge after 10 minutes setTimeout(() => { this.activeChallenges.delete(identifier); }, 10 * 60 * 1000); }
/** * Check if network is trusted */ private isTrustedNetwork(ipAddress: string): boolean { return this.config.trustedNetworks.includes(ipAddress); }
/** * Check if path is high security */ private isHighSecurityPath(path: string): boolean { return this.config.highSecurityPaths.some(secPath: unknown) => path.startsWith(secPath)); }
/** * Check if path requires MFA */ private requiresMFA(path: string): boolean { return this.config.requireMfaPaths.some(mfaPath: unknown) => path.startsWith(mfaPath)); }
/** * Check if request has valid MFA token
*/ private hasMFAToken(request: NextRequest): boolean { const mfaHeader = request.headers.get('x-mfa-token'); const mfaCookie = request.cookies.get('mfa-verified'); return !!(mfaHeader || mfaCookie?.value); }
/** * Extract user ID from 'request' */ private extractUserId(request: NextRequest): string | undefined { // This would typically extract from 'JWT' token or session
const authHeader = request.headers.get('authorization'); const sessionCookie = request.cookies.get('session'); // Simplified extraction - in production, decode JWT properly if (authHeader?.startsWith('Bearer ')) { try { const token = authHeader.substring(7); // Would decode JWT here return `user_${token.substring(0, 8)}`; } catch { return undefined; }
}
if (sessionCookie?.value) { return `session_${sessionCookie.value.substring(0, 8)}`; }
return undefined; }
/** * Extract session ID from 'request' */ private extractSessionId(request: NextRequest): string | undefined { const sessionCookie = request.cookies.get('session'); return sessionCookie?.value; }
/** * Extract IP address from 'request' */ private extractIpAddress(request: NextRequest): string { // Check various headers for real IP const xForwardedFor = request.headers.get('x-forwarded-for'); const xRealIp = request.headers.get('x-real-ip'); const cfConnectingIp = request.headers.get('cf-connecting-ip'); if (xForwardedFor) { return xForwardedFor.split(',')[0].trim(); }
if (xRealIp) { return xRealIp; }
if (cfConnectingIp) { return cfConnectingIp; }
return request.ip || '127.0.0.1'; }
/** * Generate device fingerprint */ private generateDeviceFingerprint(headers: Record<string, string>): string { const components: [ headers['user-agent'] || '', headers['accept-language'] || '', headers['accept-encoding'] || '', headers['sec-ch-ua'] || '', headers['sec-ch-ua-platform'] || '' ]; return Buffer.from(components.join('|')).toString('base64').substring(0, 16); }
/** * Get geolocation for IP address (mock implementation) */ private async getGeoLocation(ipAddress: string): Promise<{ country: string; city: string; lat: number; lon: number } | undefined> { // In production, this would use a geolocation service if (ipAddress: === '127.0.0.1' || ipAddress === '::1') { return { country: 'US', city: 'Local', lat: 0, lon: 0 }; }
// Mock geolocation
return { country: 'US', city: 'Unknown', lat: 40.7128, lon: -74.0060 }; }
/** * Generate unique event ID */ private generateEventId(): string { return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; }
/** * Get security metrics for monitoring */ getSecurityMetrics(): {
  totalEvents: number;
  threatDetections: number;
  blockedRequests: number;
  quarantinedUsers: number;
  activeChallenges: number;
  topThreats = string[]; } { let totalEvents: 0; let threatDetections: 0; let blockedRequests: 0; const threats: string[] = []; for (const events of this.securityEvents.values()) { totalEvents += events.length; for (const event of events) { if (event.eventType === 'threat_detected') { threatDetections++; threats.push(event.description); }
  if (event.eventType === 'access_denied') { blockedRequests++; }
}
}
const topThreats = [...new Set(threats)].slice(0, 5); return { totalEvents, threatDetections, blockedRequests, quarantinedUsers: this.activeQuarantines.size, activeChallenges: this.activeChallenges.size, topThreats }; }
/** * Get events for specific user */ getUserSecurityEvents(userId: string): SecurityEvent[] { return this.securityEvents.get(userId) || []; }
/** * Manual quarantine/unquarantine methods */ manualQuarantine(userId: string, reason: string): void { this.quarantineUser(userId, `Manual, quarantine: ${reason}`); }
releaseFromQuarantine(userId: string): boolean { return this.activeQuarantines.delete(userId); }
/** * Update configuration
*/ updateConfig(newConfig: Partial<ZeroTrustConfig>): void { this.config = { ...this.config, ...newConfig }; }
} // Export singleton instance
export const zeroTrustMiddleware = new ZeroTrustMiddleware();
