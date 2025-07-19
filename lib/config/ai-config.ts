// Enhanced AI Configuration
// Centralized configuration for AI services and features

export const AI_CONFIG = {
  // Local LLM Configuration (CodeLlama 34B)
  LOCAL_LLM: {
    BASE_URL: process.env.LOCAL_LLM_URL || 'http://localhost:1234/v1',
    API_KEY: process.env.LOCAL_LLM_API_KEY || 'lm-studio',
    MODEL: 'codellama-34b-instruct',
    MAX_TOKENS: 4096,
    TEMPERATURE: {
      CODE: 0.1,        // Low temperature for code generation
      ANALYSIS: 0.2,    // Slightly higher for analysis
      EXPLANATION: 0.3, // Higher for explanations
      CREATIVE: 0.7     // High for creative tasks
    },
    TIMEOUT: 120000,    // 2 minutes
    HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000   // 1 second
  },

  // Gemini Configuration (Fallback)
  GEMINI: {
    MODEL: 'gemini-pro',
    MAX_TOKENS: 2048,
    TEMPERATURE: 0.4,
    TIMEOUT: 60000,     // 1 minute
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 500    // 0.5 seconds
  },

  // Smart Routing Rules
  ROUTING: {
    // Use local LLM for these request types
    LOCAL_LLM_TYPES: ['code', 'analysis', 'security', 'optimization'],
    
    // Use Gemini for these request types
    GEMINI_TYPES: ['explanation', 'concept', 'tutorial', 'creative'],
    
    // Fallback preferences
    FALLBACK_CHAIN: ['local', 'gemini'],
    
    // Performance thresholds for routing decisions
    PERFORMANCE_THRESHOLDS: {
      RESPONSE_TIME_MS: 5000,     // Switch if response time > 5s
      ERROR_RATE_PERCENT: 10,     // Switch if error rate > 10%
      HEALTH_CHECK_FAILURES: 3    // Switch after 3 consecutive failures
    }
  },

  // Context Management
  CONTEXT: {
    // Cache settings
    USER_CONTEXT_TTL: 3600000,    // 1 hour
    ANALYTICS_CACHE_TTL: 1800000, // 30 minutes
    
    // Context window sizes
    CONVERSATION_HISTORY_LIMIT: 10,
    RECENT_TOPICS_LIMIT: 5,
    WEAK_AREAS_LIMIT: 8,
    STRONG_AREAS_LIMIT: 8,
    
    // Learning analytics
    MASTERY_THRESHOLD: 0.7,       // 70% mastery to consider "learned"
    DIFFICULTY_ADJUSTMENT_RATE: 0.1, // How quickly to adjust difficulty
    
    // Adaptive learning
    LEARNING_PATH_LENGTH: 7,      // Number of topics in adaptive path
    CHALLENGE_DIFFICULTY_RANGE: [1, 10], // Min/max difficulty levels
    
    // Performance tracking
    TRACK_RESPONSE_TIMES: true,
    TRACK_USER_SATISFACTION: true,
    TRACK_LEARNING_OUTCOMES: true
  },

  // Security Analysis
  SECURITY: {
    // Vulnerability detection
    VULNERABILITY_CATEGORIES: [
      'reentrancy',
      'integer_overflow',
      'access_control',
      'unchecked_calls',
      'denial_of_service',
      'front_running',
      'timestamp_dependence',
      'tx_origin',
      'uninitialized_storage',
      'delegatecall'
    ],
    
    // Severity levels
    SEVERITY_WEIGHTS: {
      critical: 10,
      high: 7,
      medium: 4,
      low: 1
    },
    
    // Scoring
    BASE_SECURITY_SCORE: 100,
    MIN_SECURITY_SCORE: 0,
    PASSING_SCORE: 70,
    
    // Gas optimization
    GAS_OPTIMIZATION_CATEGORIES: [
      'storage_optimization',
      'loop_optimization',
      'function_visibility',
      'data_types',
      'external_calls',
      'event_optimization'
    ],
    
    // Analysis caching
    CACHE_ANALYSIS_RESULTS: true,
    ANALYSIS_CACHE_TTL: 86400000, // 24 hours
    MAX_CODE_SIZE_FOR_ANALYSIS: 50000 // 50KB
  },

  // Personalized Challenges
  CHALLENGES: {
    // Difficulty scaling
    DIFFICULTY_FACTORS: {
      USER_LEVEL: 0.4,
      SKILL_LEVEL: 0.3,
      RECENT_PERFORMANCE: 0.2,
      WEAK_AREAS: 0.1
    },
    
    // Challenge types
    CHALLENGE_TYPES: [
      'basic_syntax',
      'data_structures',
      'control_flow',
      'functions',
      'modifiers',
      'events',
      'inheritance',
      'interfaces',
      'libraries',
      'security_patterns',
      'gas_optimization',
      'defi_protocols'
    ],
    
    // Scoring
    PASSING_SCORE: 70,
    EXCELLENT_SCORE: 90,
    TIME_BONUS_THRESHOLD: 300, // 5 minutes
    
    // Hints system
    MAX_HINTS: 3,
    HINT_PENALTY: 5, // Points deducted per hint used
    
    // Generation limits
    MAX_CHALLENGES_PER_DAY: 10,
    MAX_CHALLENGE_ATTEMPTS: 5
  },

  // Voice Learning
  VOICE: {
    // Speech recognition
    LANGUAGE: 'en-US',
    CONTINUOUS: false,
    INTERIM_RESULTS: false,
    MAX_ALTERNATIVES: 1,
    
    // Audio processing
    SAMPLE_RATE: 16000,
    AUDIO_FORMAT: 'webm',
    MAX_RECORDING_TIME: 60000, // 1 minute
    
    // Command processing
    VOICE_COMMANDS: [
      'explain',
      'analyze',
      'generate',
      'help',
      'repeat',
      'next',
      'previous',
      'save',
      'clear'
    ],
    
    // Confidence thresholds
    MIN_CONFIDENCE: 0.7,
    RETRY_ON_LOW_CONFIDENCE: true
  },

  // Multi-modal Content
  MULTIMODAL: {
    // Content types
    SUPPORTED_TYPES: ['text', 'image', 'audio', 'video', 'interactive'],
    
    // Generation preferences by skill level
    CONTENT_PREFERENCES: {
      BEGINNER: ['text', 'image', 'interactive'],
      INTERMEDIATE: ['text', 'image', 'video', 'interactive'],
      ADVANCED: ['text', 'video', 'interactive'],
      EXPERT: ['text', 'interactive']
    },
    
    // Visual aids
    DIAGRAM_TYPES: ['flowchart', 'sequence', 'class', 'component'],
    MAX_DIAGRAM_COMPLEXITY: 10,
    
    // Interactive examples
    ENABLE_CODE_PLAYGROUND: true,
    ENABLE_LIVE_COMPILATION: true,
    ENABLE_STEP_DEBUGGING: true
  },

  // Performance Monitoring
  MONITORING: {
    // Metrics collection
    COLLECT_PERFORMANCE_METRICS: true,
    COLLECT_USER_FEEDBACK: true,
    COLLECT_ERROR_LOGS: true,
    
    // Alerting thresholds
    HIGH_RESPONSE_TIME_MS: 10000,
    HIGH_ERROR_RATE_PERCENT: 15,
    LOW_USER_SATISFACTION: 3.0, // Out of 5
    
    // Reporting
    DAILY_REPORTS: true,
    WEEKLY_ANALYTICS: true,
    MONTHLY_INSIGHTS: true,
    
    // Data retention
    METRICS_RETENTION_DAYS: 90,
    LOGS_RETENTION_DAYS: 30,
    USER_FEEDBACK_RETENTION_DAYS: 365
  },

  // Feature Flags
  FEATURES: {
    ENHANCED_AI_TUTOR: true,
    PERSONALIZED_CHALLENGES: true,
    SECURITY_ANALYSIS: true,
    VOICE_LEARNING: true,
    MULTIMODAL_CONTENT: true,
    ADAPTIVE_LEARNING_PATHS: true,
    REAL_TIME_COLLABORATION: false, // Phase 2
    JOB_BOARD_INTEGRATION: false,   // Phase 3
    BLOCKCHAIN_CERTIFICATES: false, // Phase 4
    TOKEN_ECONOMY: false            // Phase 4
  },

  // Rate Limiting
  RATE_LIMITS: {
    // Per user limits
    AI_REQUESTS_PER_HOUR: 100,
    SECURITY_ANALYSES_PER_HOUR: 20,
    CHALLENGE_GENERATIONS_PER_HOUR: 10,
    VOICE_REQUESTS_PER_HOUR: 50,
    
    // Global limits
    TOTAL_AI_REQUESTS_PER_MINUTE: 1000,
    CONCURRENT_ANALYSES: 10,
    
    // Burst allowances
    BURST_MULTIPLIER: 2,
    BURST_WINDOW_MINUTES: 5
  },

  // Error Handling
  ERROR_HANDLING: {
    // Retry strategies
    EXPONENTIAL_BACKOFF: true,
    MAX_RETRY_ATTEMPTS: 3,
    BASE_RETRY_DELAY_MS: 1000,
    MAX_RETRY_DELAY_MS: 10000,
    
    // Fallback behaviors
    GRACEFUL_DEGRADATION: true,
    FALLBACK_TO_CACHED_RESPONSES: true,
    FALLBACK_TO_SIMPLE_RESPONSES: true,
    
    // Error reporting
    LOG_ALL_ERRORS: true,
    REPORT_CRITICAL_ERRORS: true,
    USER_FRIENDLY_ERROR_MESSAGES: true
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  AI_CONFIG.LOCAL_LLM.TIMEOUT = 300000; // 5 minutes for development
  AI_CONFIG.MONITORING.COLLECT_PERFORMANCE_METRICS = false;
  AI_CONFIG.RATE_LIMITS.AI_REQUESTS_PER_HOUR = 1000; // Higher limits for dev
}

if (process.env.NODE_ENV === 'production') {
  AI_CONFIG.ERROR_HANDLING.LOG_ALL_ERRORS = false; // Only log important errors
  AI_CONFIG.MONITORING.COLLECT_PERFORMANCE_METRICS = true;
  AI_CONFIG.RATE_LIMITS.AI_REQUESTS_PER_HOUR = 50; // Lower limits for prod
}

export default AI_CONFIG;
