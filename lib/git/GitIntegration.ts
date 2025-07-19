'use client';

interface GitCommitOptions {
  message: string;
  prefix?: 'Add' | 'Edit' | 'Del';
  files?: string[];
  skipTypeScriptCheck?: boolean;
  skipTests?: boolean;
}

interface GitStatus {
  isClean: boolean;
  hasUncommittedChanges: boolean;
  currentBranch: string;
  ahead: number;
  behind: number;
  stagedFiles: string[];
  unstagedFiles: string[];
}

interface TypeScriptCheckResult {
  success: boolean;
  errors: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'warning';
  }>;
}

export class GitIntegrationManager {
  private static instance: GitIntegrationManager;
  private isInitialized = false;
  private currentBranch = 'main';
  private commitQueue: GitCommitOptions[] = [];
  private isProcessingQueue = false;

  static getInstance(): GitIntegrationManager {
    if (!GitIntegrationManager.instance) {
      GitIntegrationManager.instance = new GitIntegrationManager();
    }
    return GitIntegrationManager.instance;
  }

  private constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      // Check if we're in a git repository
      const status = await this.getGitStatus();
      this.currentBranch = status.currentBranch;
      this.isInitialized = true;
      console.log('Git integration initialized on branch:', this.currentBranch);
    } catch (error) {
      console.warn('Git integration not available:', error);
    }
  }

  async getGitStatus(): Promise<GitStatus> {
    // In a real implementation, this would call git commands
    // For now, we'll simulate the git status
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isClean: Math.random() > 0.3,
          hasUncommittedChanges: Math.random() > 0.5,
          currentBranch: this.currentBranch,
          ahead: Math.floor(Math.random() * 3),
          behind: Math.floor(Math.random() * 2),
          stagedFiles: [],
          unstagedFiles: ['components/learning/InteractiveCodeEditor.tsx']
        });
      }, 500);
    });
  }

  async checkTypeScript(): Promise<TypeScriptCheckResult> {
    // Simulate TypeScript checking
    return new Promise((resolve) => {
      setTimeout(() => {
        const hasErrors = Math.random() > 0.8;
        const hasWarnings = Math.random() > 0.6;
        
        resolve({
          success: !hasErrors,
          errors: hasErrors ? [{
            file: 'components/learning/InteractiveCodeEditor.tsx',
            line: 42,
            column: 15,
            message: 'Type error: Property does not exist',
            severity: 'error'
          }] : [],
          warnings: hasWarnings ? [{
            file: 'components/learning/InteractiveCodeEditor.tsx',
            line: 128,
            column: 8,
            message: 'Unused variable',
            severity: 'warning'
          }] : []
        });
      }, 1000);
    });
  }

  async commitChanges(options: GitCommitOptions): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Git integration not initialized');
    }

    // Add to queue for batch processing
    this.commitQueue.push(options);
    
    if (!this.isProcessingQueue) {
      await this.processCommitQueue();
    }
  }

  private async processCommitQueue(): Promise<void> {
    if (this.commitQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    try {
      // Process commits in batches of 5-10 related changes
      const batchSize = Math.min(this.commitQueue.length, 8);
      const batch = this.commitQueue.splice(0, batchSize);
      
      // Check TypeScript before committing
      if (!batch.some(commit => commit.skipTypeScriptCheck)) {
        const tsResult = await this.checkTypeScript();
        if (!tsResult.success) {
          throw new Error(`TypeScript errors found: ${tsResult.errors.map(e => e.message).join(', ')}`);
        }
      }

      // Group commits by prefix for better organization
      const groupedCommits = this.groupCommitsByPrefix(batch);
      
      for (const [prefix, commits] of Object.entries(groupedCommits)) {
        await this.executeCommit(prefix, commits);
      }

      // Continue processing if there are more commits
      if (this.commitQueue.length > 0) {
        setTimeout(() => this.processCommitQueue(), 1000);
      } else {
        this.isProcessingQueue = false;
      }
    } catch (error) {
      this.isProcessingQueue = false;
      throw error;
    }
  }

  private groupCommitsByPrefix(commits: GitCommitOptions[]): Record<string, GitCommitOptions[]> {
    const grouped: Record<string, GitCommitOptions[]> = {};
    
    commits.forEach(commit => {
      const prefix = commit.prefix || 'Edit';
      if (!grouped[prefix]) {
        grouped[prefix] = [];
      }
      grouped[prefix].push(commit);
    });
    
    return grouped;
  }

  private async executeCommit(prefix: string, commits: GitCommitOptions[]): Promise<void> {
    // Simulate git operations
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const messages = commits.map(c => c.message);
          const commitMessage = this.formatCommitMessage(prefix, messages);
          
          console.log(`Executing git commit: ${commitMessage}`);
          
          // Simulate potential git errors
          if (Math.random() > 0.9) {
            reject(new Error('Git commit failed: merge conflict'));
            return;
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 1500);
    });
  }

  private formatCommitMessage(prefix: string, messages: string[]): string {
    if (messages.length === 1) {
      return `${prefix}: ${messages[0]}`;
    }
    
    // For multiple commits, create a summary
    const summary = this.createCommitSummary(prefix, messages);
    return `${prefix}: ${summary}`;
  }

  private createCommitSummary(prefix: string, messages: string[]): string {
    const commonTerms = this.findCommonTerms(messages);
    
    if (commonTerms.length > 0) {
      return `${commonTerms.join(' and ')} improvements (${messages.length} changes)`;
    }
    
    // Fallback to generic message
    switch (prefix) {
      case 'Add':
        return `Add new features and components (${messages.length} additions)`;
      case 'Edit':
        return `Update and enhance existing functionality (${messages.length} modifications)`;
      case 'Del':
        return `Remove deprecated code and cleanup (${messages.length} deletions)`;
      default:
        return `Multiple changes (${messages.length} commits)`;
    }
  }

  private findCommonTerms(messages: string[]): string[] {
    const terms = ['editor', 'error', 'save', 'compile', 'syntax', 'highlight', 'auto-save', 'button'];
    const commonTerms: string[] = [];
    
    terms.forEach(term => {
      const count = messages.filter(msg => msg.toLowerCase().includes(term)).length;
      if (count >= Math.ceil(messages.length * 0.5)) {
        commonTerms.push(term);
      }
    });
    
    return commonTerms.slice(0, 3); // Limit to 3 terms
  }

  async commitLessonCompletion(lessonId: string, _code: string): Promise<void> {
    await this.commitChanges({
      message: `Complete lesson ${lessonId} with working solution`,
      prefix: 'Add',
      files: [`lessons/${lessonId}/solution.sol`],
      skipTypeScriptCheck: true
    });
  }

  async commitCodeSave(sessionId: string, description?: string): Promise<void> {
    await this.commitChanges({
      message: description || `Save code progress for session ${sessionId}`,
      prefix: 'Edit',
      files: [`sessions/${sessionId}/code.sol`],
      skipTypeScriptCheck: true
    });
  }

  async commitFeatureImplementation(feature: string, files: string[]): Promise<void> {
    await this.commitChanges({
      message: `Implement ${feature} functionality`,
      prefix: 'Add',
      files,
      skipTypeScriptCheck: false
    });
  }

  async commitBugFix(issue: string, files: string[]): Promise<void> {
    await this.commitChanges({
      message: `Fix ${issue}`,
      prefix: 'Edit',
      files,
      skipTypeScriptCheck: false
    });
  }

  async commitCleanup(description: string, files: string[]): Promise<void> {
    await this.commitChanges({
      message: `Cleanup ${description}`,
      prefix: 'Del',
      files,
      skipTypeScriptCheck: true
    });
  }

  // Auto-push functionality
  async pushChanges(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Git integration not initialized');
    }

    // Simulate git push
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.95) {
          reject(new Error('Push failed: remote rejected'));
          return;
        }
        
        console.log('Changes pushed to remote repository');
        resolve();
      }, 2000);
    });
  }

  // Get commit history for a file
  async getFileHistory(filePath: string): Promise<Array<{
    hash: string;
    message: string;
    author: string;
    date: Date;
  }>> {
    // Simulate git log
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            hash: 'abc123',
            message: 'Add: Enhanced code editor with auto-save',
            author: 'Developer',
            date: new Date(Date.now() - 3600000)
          },
          {
            hash: 'def456',
            message: 'Edit: Improve error highlighting',
            author: 'Developer',
            date: new Date(Date.now() - 7200000)
          }
        ]);
      }, 800);
    });
  }

  // Check if repository is clean before major operations
  async ensureCleanRepository(): Promise<void> {
    const status = await this.getGitStatus();
    
    if (status.hasUncommittedChanges) {
      throw new Error('Repository has uncommitted changes. Please commit or stash them first.');
    }
  }

  // Create a new branch for feature development
  async createFeatureBranch(featureName: string): Promise<void> {
    await this.ensureCleanRepository();
    
    // Simulate git checkout -b
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentBranch = `feature/${featureName}`;
        console.log(`Created and switched to branch: ${this.currentBranch}`);
        resolve();
      }, 1000);
    });
  }

  getCurrentBranch(): string {
    return this.currentBranch;
  }

  isGitAvailable(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const gitIntegration = GitIntegrationManager.getInstance();
