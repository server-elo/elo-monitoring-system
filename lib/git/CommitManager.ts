'use client';

interface CommitRule {
  pattern: RegExp;
  prefix: 'Add' | 'Edit' | 'Del';
  description: string;
}

interface CommitBatch {
  prefix: 'Add' | 'Edit' | 'Del';
  files: string[];
  messages: string[];
  timestamp: Date;
  priority: number;
}

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  code?: string;
}

export class CommitManager {
  private static instance: CommitManager;
  private commitRules: CommitRule[] = [];
  private pendingCommits: CommitBatch[] = [];
  private isProcessing = false;
  private maxBatchSize = 8;
  private processingDelay = 2000; // 2 seconds between batches

  static getInstance(): CommitManager {
    if (!CommitManager.instance) {
      CommitManager.instance = new CommitManager();
    }
    return CommitManager.instance;
  }

  private constructor() {
    this.initializeCommitRules();
  }

  private initializeCommitRules(): void {
    this.commitRules = [
      // Add rules
      {
        pattern: /^(create|implement|add|new)\s/i,
        prefix: 'Add',
        description: 'Adding new functionality or files'
      },
      {
        pattern: /component|hook|util|lib|feature/i,
        prefix: 'Add',
        description: 'Adding new components or utilities'
      },
      {
        pattern: /test|spec|\.test\.|\.spec\./i,
        prefix: 'Add',
        description: 'Adding tests'
      },

      // Edit rules
      {
        pattern: /^(update|modify|change|improve|enhance|fix|refactor)\s/i,
        prefix: 'Edit',
        description: 'Modifying existing functionality'
      },
      {
        pattern: /bug|issue|error|problem|fix/i,
        prefix: 'Edit',
        description: 'Bug fixes and improvements'
      },
      {
        pattern: /style|format|lint|prettier/i,
        prefix: 'Edit',
        description: 'Code style and formatting'
      },

      // Delete rules
      {
        pattern: /^(remove|delete|clean|cleanup)\s/i,
        prefix: 'Del',
        description: 'Removing code or files'
      },
      {
        pattern: /unused|deprecated|obsolete|legacy/i,
        prefix: 'Del',
        description: 'Removing unused or deprecated code'
      }
    ];
  }

  // Determine commit prefix based on message and files
  determineCommitPrefix(message: string, files: string[] = []): 'Add' | 'Edit' | 'Del' {
    // Check message against rules
    for (const rule of this.commitRules) {
      if (rule.pattern.test(message)) {
        return rule.prefix;
      }
    }

    // Check file patterns
    const hasNewFiles = files.some(file => 
      file.includes('new') || 
      file.includes('create') ||
      !this.fileExists(file)
    );

    const hasDeletedFiles = files.some(file => 
      file.includes('delete') || 
      file.includes('remove')
    );

    if (hasNewFiles) return 'Add';
    if (hasDeletedFiles) return 'Del';
    
    // Default to Edit for modifications
    return 'Edit';
  }

  // Queue a commit for batch processing
  queueCommit(message: string, files: string[] = [], priority: number = 1): void {
    const prefix = this.determineCommitPrefix(message, files);
    
    // Find existing batch with same prefix or create new one
    let batch = this.pendingCommits.find(b => 
      b.prefix === prefix && 
      b.files.length + files.length <= this.maxBatchSize
    );

    if (!batch) {
      batch = {
        prefix,
        files: [],
        messages: [],
        timestamp: new Date(),
        priority
      };
      this.pendingCommits.push(batch);
    }

    // Add to batch
    batch.files.push(...files);
    batch.messages.push(message);
    batch.priority = Math.max(batch.priority, priority);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processPendingCommits();
    }
  }

  // Process pending commits in batches
  private async processPendingCommits(): Promise<void> {
    if (this.pendingCommits.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Sort by priority (higher first) and timestamp
      this.pendingCommits.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      while (this.pendingCommits.length > 0) {
        const batch = this.pendingCommits.shift()!;
        
        try {
          await this.processBatch(batch);
          console.log(`✅ Committed batch: ${batch.prefix} (${batch.messages.length} changes)`);
        } catch (error) {
          console.error(`❌ Failed to commit batch: ${batch.prefix}`, error);
          // Re-queue with lower priority
          batch.priority = Math.max(0, batch.priority - 1);
          this.pendingCommits.push(batch);
        }

        // Delay between batches
        if (this.pendingCommits.length > 0) {
          await this.delay(this.processingDelay);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Process a single batch
  private async processBatch(batch: CommitBatch): Promise<void> {
    // Check TypeScript before committing
    const tsErrors = await this.checkTypeScript();
    if (tsErrors.length > 0) {
      const errorMessages = tsErrors.map(e => `${e.file}:${e.line} - ${e.message}`);
      throw new Error(`TypeScript errors found:\n${errorMessages.join('\n')}`);
    }

    // Generate commit message
    const commitMessage = this.generateCommitMessage(batch);
    
    // Simulate git operations
    await this.executeGitCommit(commitMessage, batch.files);
  }

  // Generate a commit message for a batch
  private generateCommitMessage(batch: CommitBatch): string {
    const { prefix, messages } = batch;

    if (messages.length === 1) {
      return `${prefix}: ${messages[0]}`;
    }

    // Group similar messages
    const grouped = this.groupSimilarMessages(messages);
    
    if (grouped.length === 1) {
      const group = grouped[0];
      if (group.messages.length === 1) {
        return `${prefix}: ${group.messages[0]}`;
      } else {
        return `${prefix}: ${group.summary} (${group.messages.length} changes)`;
      }
    }

    // Multiple groups - create summary
    const summary = this.createBatchSummary(prefix, grouped);
    return `${prefix}: ${summary}`;
  }

  // Group similar commit messages
  private groupSimilarMessages(messages: string[]): Array<{
    summary: string;
    messages: string[];
  }> {
    const groups: Map<string, string[]> = new Map();
    
    messages.forEach(message => {
      const key = this.extractMessageKey(message);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(message);
    });

    return Array.from(groups.entries()).map(([key, msgs]) => ({
      summary: key,
      messages: msgs
    }));
  }

  // Extract key terms from commit message for grouping
  private extractMessageKey(message: string): string {
    const keywords = [
      'editor', 'component', 'hook', 'util', 'test', 'style', 'fix', 'bug',
      'feature', 'ui', 'api', 'database', 'auth', 'error', 'validation',
      'performance', 'security', 'accessibility', 'responsive'
    ];

    const lowerMessage = message.toLowerCase();
    const foundKeywords = keywords.filter(keyword => lowerMessage.includes(keyword));
    
    if (foundKeywords.length > 0) {
      return foundKeywords.slice(0, 2).join(' and ');
    }

    // Fallback to first few words
    return message.split(' ').slice(0, 3).join(' ');
  }

  // Create summary for batch with multiple groups
  private createBatchSummary(prefix: string, groups: Array<{ summary: string; messages: string[] }>): string {
    const totalChanges = groups.reduce((sum, group) => sum + group.messages.length, 0);
    const mainTopics = groups.slice(0, 3).map(g => g.summary);

    switch (prefix) {
      case 'Add':
        return `Implement ${mainTopics.join(', ')} features (${totalChanges} additions)`;
      case 'Edit':
        return `Update ${mainTopics.join(', ')} functionality (${totalChanges} modifications)`;
      case 'Del':
        return `Remove ${mainTopics.join(', ')} code (${totalChanges} deletions)`;
      default:
        return `Multiple ${mainTopics.join(', ')} changes (${totalChanges} commits)`;
    }
  }

  // Check TypeScript compilation
  private async checkTypeScript(): Promise<TypeScriptError[]> {
    // Simulate TypeScript checking
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate occasional TypeScript errors
        if (Math.random() > 0.9) {
          resolve([{
            file: 'components/learning/InteractiveCodeEditor.tsx',
            line: 42,
            column: 15,
            message: 'Property does not exist on type',
            severity: 'error',
            code: 'TS2339'
          }]);
        } else {
          resolve([]);
        }
      }, 1000);
    });
  }

  // Execute git commit
  private async executeGitCommit(message: string, files: string[]): Promise<void> {
    // Simulate git operations
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional git failures
        if (Math.random() > 0.95) {
          reject(new Error('Git commit failed: merge conflict'));
        } else {
          console.log(`Git commit: ${message}`);
          if (files.length > 0) {
            console.log(`Files: ${files.join(', ')}`);
          }
          resolve();
        }
      }, 1500);
    });
  }

  // Utility methods
  private fileExists(filePath: string): boolean {
    // Simulate file existence check
    return !filePath.includes('new') && !filePath.includes('create');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for specific commit types
  async commitFeatureImplementation(feature: string, files: string[]): Promise<void> {
    this.queueCommit(`Implement ${feature} functionality`, files, 3);
  }

  async commitBugFix(issue: string, files: string[]): Promise<void> {
    this.queueCommit(`Fix ${issue}`, files, 4);
  }

  async commitCodeCleanup(description: string, files: string[]): Promise<void> {
    this.queueCommit(`Cleanup ${description}`, files, 1);
  }

  async commitLessonCompletion(lessonId: string, _code: string): Promise<void> {
    this.queueCommit(
      `Complete lesson ${lessonId} with working solution`,
      [`lessons/${lessonId}/solution.sol`],
      2
    );
  }

  async commitCodeSave(sessionId: string, description?: string): Promise<void> {
    this.queueCommit(
      description || `Save code progress for session ${sessionId}`,
      [`sessions/${sessionId}/code.sol`],
      1
    );
  }

  // Get commit statistics
  getCommitStats(): {
    pending: number;
    processing: boolean;
    lastCommitTime: Date | null;
  } {
    return {
      pending: this.pendingCommits.length,
      processing: this.isProcessing,
      lastCommitTime: null // Would track in real implementation
    };
  }

  // Force process all pending commits
  async flushPendingCommits(): Promise<void> {
    if (!this.isProcessing) {
      await this.processPendingCommits();
    }
  }
}

// Export singleton instance
export const commitManager = CommitManager.getInstance();
