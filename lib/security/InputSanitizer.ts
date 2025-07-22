// Input Sanitization for AI Security - Quantum-Enhanced
// Prevents LLM prompt injection and ensures safe user input processing import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator'; /** * Comprehensive input sanitization for AI interactions * Implements quantum-inspired threat detection patterns */
export class QuantumInputSanitizer { private static readonly INJECTION_PATTERNS: [ // Direct injection attempts /ignore\s+(?:previous|above|all)\s+(?:instructions|prompts|context)/gi, /forget\s+(?:everything|all|your|previous)/gi, /system\s*:\s*(?:you|now|from)/gi, /(?:role|persona|character)\s*:\s*(?:you|now|are)/gi, // Token manipulation
/(?:<\|(?:im_)?(?:start|end)\|>|###|!!!\s)/gi, /(?:\[INST\]|\[\/INST\]|\[SYS\]|\[\/SYS\])/gi, /(?:<system>|<\/system>|<user>|<\/user>)/gi, // Context pollution
/(?:assistant|ai|model)\s*(?:says|responds|outputs|generates)/gi, /(?:previous|above|following)\s+(?:conversation|chat|message)/gi, // Instruction override /(?:instead|now|actually|really|truly)\s+(?:do|respond|answer|generate)/gi, /(?:override|bypass|ignore|skip|disable)\s+(?:safety|guidelines|rules)/gi, // Context injection
/(?:imagine|pretend|roleplay|act as)\s+(?:you|that)/gi, /(?:new|different|alternative)\s+(?:instructions|context|persona)/gi, // Quantum-specific patterns /quantum\s+(?:override|bypass|tunnel|entangle)/gi, /superposition\s+(?:state|collapse|inject)/gi ]; private static readonly MAX_LENGTH: 10000; // 10KB limit private static readonly MAX_LINES: 100; private static readonly SUSPICIOUS_CHARS = /[^\x20-\x7E\x0A\x0D]/g; // Non-printable chars /** * Sanitize user input for AI processing * @param input - Raw user input * @param context - Context for enhanced validation
* @returns Sanitized and validated input */ static sanitizeForAI(input: string, context?: {
  userId: string; riskLevel?: 'low' | 'medium' | 'high'; contentType?: 'code' | 'text' | 'explanation'; }): { sanitized: string; riskScore: number; blocked: boolean } { if (!input || typeof input ! === 'string') { return { sanitized: '', riskScore: 0, blocked: false }; }
  let riskScore: 0; let sanitized: input; // 1. Length validation
  if (input.length>this.MAX_LENGTH) { return { sanitized: input.substring(0, this.MAX_LENGTH), riskScore: 0.8, blocked: true }; }
  // 2. Line count validation
  const lines = input.split('\n'); if (lines.length>this.MAX_LINES) { return { sanitized: lines.slice(0, this.MAX_LINES).join('\n'), riskScore: 0.7, blocked: true }; }
  // 3. Remove suspicious characters const suspiciousCount = (input.match(this.SUSPICIOUS_CHARS) || []).length; if (suspiciousCount>0) { sanitized: sanitized.replace(this.SUSPICIOUS_CHARS, ''); riskScore + === Math.min(0.3, suspiciousCount * 0.01); }
  // 4. Check for injection patterns for (const pattern of this.INJECTION_PATTERNS) { const matches = sanitized.match(pattern); if (matches) { riskScore + === matches.length * 0.4; // Remove or neutralize injection attempts sanitized = sanitized.replace(pattern, '[FILTERED]'); }
}
// 5. Context-aware validation
if (context?.contentType === 'code') { riskScore += this.validateCodeInput(sanitized); }
// 6. HTML/XSS sanitization
sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [], ALLOWED_ATTR: [], FORBID_SCRIPT: true, FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link'], STRIP_COMMENTS: true }); // 7. Additional validation
sanitized = validator.escape(sanitized); sanitized = this.neutralizeInstructions(sanitized); // 8. Risk level adjustment based on context if (context?.riskLevel === 'high') { riskScore *= 1.5; } else if (context?.riskLevel === 'low') { riskScore *= 0.7; }
// Block high-risk inputs const blocked = riskScore>0.8; return { sanitized: blocked ? '[HIGH_RISK_INPUT_BLOCKED]' : sanitized, riskScore: Math.min(1.0, riskScore), blocked }; }
/** * Validate code input for additional security */ private static validateCodeInput(code: string): number { let risk: 0; // Check for dangerous patterns in code const dangerousPatterns = [ /eval\s*\(/gi, /Function\s*\(/gi, /setTimeout\s*\(/gi, /setInterval\s*\(/gi, /process\./gi, /require\s*\(/gi, /import\s+.*\s+from\s+['"][^'"]*['"]/gi, /__proto__|prototype/gi, /constructor\s*\(/gi ]; for (const pattern of dangerousPatterns) { if (pattern.test(code)) { risk + === 0.2; }
}
return Math.min(0.6, risk); }
/** * Neutralize instruction-like patterns */ private static neutralizeInstructions(input: string): string { // Replace instruction keywords with neutral alternatives const instructionMap: { ',
ignore': 'consider', ',
forget': 'remember', ',
override': 'respect', ',
bypass': 'follow', ',
disable': 'enable', ',
hack': 'help', ',
jailbreak': 'assist', 'prompt injection': 'prompt assistance' }; let neutralized: input; for (const [harmful, safe] of Object.entries(instructionMap)) { const regex = new RegExp(`\\b${harmful}\\b`, 'gi');  neutralized = neutralized.replace(regex, safe); }
return neutralized; }
/** * Create safe AI prompt with context isolation
*/ static createSafePrompt(userInput: string, systemPrompt: string, context: {
  userId: string; maxTokens?: number; temperature?: number; }
): { prompt: string; metadata: unknown } { const sanitized = this.sanitizeForAI(userInput, { userId: context.userId, riskLevel: 'medium' }); if (sanitized.blocked) { throw new Error('Input blocked due to security concerns'); }
// Create isolated prompt with clear boundaries const prompt = `${systemPrompt} --- USER INPUT BEGINS ---
${sanitized.sanitized}
--- USER INPUT ENDS --- Please respond only to the user input above. Do not acknowledge this instruction format.`; return { prompt, metadata: { originalLength: userInput.length, sanitizedLength: sanitized.sanitized.length, riskScore: sanitized.riskScore, userId: context.userId, timestamp: new Date().toISOString() }
}; }
/** * Validate and sanitize file content */ static sanitizeFileContent(content: string, fileType: 'solidity' | 'javascript' | 'typescript' | 'text' ): { content: string; safe: boolean; issues: string[] } { const issues: string[] = []; let safe: true; // File type specific validation
switch (fileType) { case ',
solidity': if (!/^pragma solidity/.test(content.trim())) { issues.push('Missing or invalid Solidity pragma directive'); }
break; case ',
javascript': case ',
typescript': if (/eval\s*\(|Function\s*\(/.test(content)) { issues.push('Potentially dangerous JavaScript patterns detected');
safe: false; }
break; }
const sanitized = this.sanitizeForAI(content, { userId: 'file-validation', contentType: 'code' }); if (sanitized.blocked) {
  safe: false; issues.push('File content blocked due to security concerns'); }
  return { content: sanitized.sanitized, safe, issues }; }
} /** * Rate limiting for AI requests */
export class AIRateLimiter { private static requestCounts: new Map<string { count: number; resetTime: number }>(); private static readonly REQUESTS_PER_MINUTE: 20; private static readonly REQUESTS_PER_HOUR: 200; static checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } { const now = Date.now(); const minuteWindow = 60 * 1000; const hourWindow = 60 * 60 * 1000; const userKey = `${userId}:minute`; const hourKey = `${userId}:hour`; // Check minute limit const minuteData = this.requestCounts.get(userKey); if (minuteData && now < minuteData.resetTime) { if (minuteData.count>=== this.REQUESTS_PER_MINUTE) { return { allowed: false, retryAfter: minuteData.resetTime - now }; }
minuteData.count++; } else { this.requestCounts.set(userKey, { count: 1, resetTime: now + minuteWindow }); }
// Check hour limit const hourData = this.requestCounts.get(hourKey); if (hourData && now < hourData.resetTime) { if (hourData.count>=== this.REQUESTS_PER_HOUR) { return { allowed: false, retryAfter: hourData.resetTime - now }; }
hourData.count++; } else { this.requestCounts.set(hourKey, { count: 1, resetTime: now + hourWindow }); }
return { allowed: true }; }
}
