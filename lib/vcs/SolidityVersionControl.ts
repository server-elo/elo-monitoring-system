'use client';

import { EventEmitter } from 'events';

export interface Commit {
  id: string;
  message: string;
  author: {
    name: string;
    email: string;
    id: string;
  };
  timestamp: number;
  parentIds: string[];
  changes: FileChange[];
  metadata: {
    branch: string;
    tags: string[];
    reviewStatus?: 'pending' | 'approved' | 'rejected';
    reviewers?: string[];
  };
}

export interface FileChange {
  type: 'added' | 'modified' | 'deleted' | 'renamed';
  path: string;
  oldPath?: string;
  content?: string;
  oldContent?: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'context' | 'added' | 'removed';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface Branch {
  name: string;
  commitId: string;
  isDefault: boolean;
  isProtected: boolean;
  upstream?: string;
  lastActivity: number;
  author: string;
}

export interface MergeRequest {
  id: string;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  author: {
    name: string;
    email: string;
    id: string;
  };
  status: 'open' | 'merged' | 'closed' | 'draft';
  commits: string[];
  reviewers: string[];
  approvals: string[];
  conflicts?: ConflictInfo[];
  createdAt: number;
  updatedAt: number;
}

export interface ConflictInfo {
  path: string;
  type: 'content' | 'rename' | 'delete';
  ourContent: string;
  theirContent: string;
  baseContent?: string;
  resolved: boolean;
}

export interface Repository {
  id: string;
  name: string;
  description: string;
  defaultBranch: string;
  branches: Map<string, Branch>;
  commits: Map<string, Commit>;
  mergeRequests: Map<string, MergeRequest>;
  files: Map<string, string>;
  head: string;
  currentBranch: string;
}

/**
 * Git-like version control system for Solidity code
 */
export class SolidityVersionControl extends EventEmitter {
  private repository: Repository;
  private stagingArea: Map<string, string> = new Map(_);
  private workingDirectory: Map<string, string> = new Map(_);

  constructor( repositoryId: string, repositoryName: string) {
    super(_);
    
    this.repository = {
      id: repositoryId,
      name: repositoryName,
      description: '',
      defaultBranch: 'main',
      branches: new Map(_),
      commits: new Map(_),
      mergeRequests: new Map(_),
      files: new Map(_),
      head: '',
      currentBranch: 'main'
    };

    // Create initial branch
    this.createBranch( 'main', null, true);
  }

  /**
   * Initialize repository with initial commit
   */
  async initialize( initialFiles: Record<string, string> = {}): Promise<string> {
    // Add initial files
    Object.entries(_initialFiles).forEach( ([path, content]) => {
      this.workingDirectory.set( path, content);
      this.repository.files.set( path, content);
    });

    // Create initial commit
    const commitId = await this.commit('Initial commit', {
      name: 'System',
      email: 'system@soliditylearning.com',
      id: 'system'
    });

    this.repository.head = commitId;
    this.repository.branches.get('main')!.commitId = commitId;

    this.emit( 'repository-initialized', { repositoryId: this.repository.id, commitId });
    return commitId;
  }

  /**
   * Add files to staging area
   */
  add(_paths: string[] | string): void {
    const pathArray = Array.isArray(_paths) ? paths : [paths];
    
    pathArray.forEach(path => {
      const content = this.workingDirectory.get(_path);
      if (_content !== undefined) {
        this.stagingArea.set( path, content);
      }
    });

    this.emit( 'files-staged', { paths: pathArray });
  }

  /**
   * Remove files from staging area
   */
  unstage(_paths: string[] | string): void {
    const pathArray = Array.isArray(_paths) ? paths : [paths];
    
    pathArray.forEach(path => {
      this.stagingArea.delete(_path);
    });

    this.emit( 'files-unstaged', { paths: pathArray });
  }

  /**
   * Commit staged changes
   */
  async commit( message: string, author: Commit['author']): Promise<string> {
    if (_this.stagingArea.size === 0) {
      throw new Error('No changes staged for commit');
    }

    const commitId = this.generateCommitId(_);
    const changes: FileChange[] = [];

    // Generate changes from staging area
    for ( const [path, content] of this.stagingArea) {
      const oldContent = this.repository.files.get(_path);
      const change: FileChange = {
        type: oldContent ? 'modified' : 'added',
        path,
        content,
        oldContent,
        hunks: this.generateDiffHunks( oldContent || '', content)
      };
      changes.push(_change);
    }

    const commit: Commit = {
      id: commitId,
      message,
      author,
      timestamp: Date.now(_),
      parentIds: this.repository.head ? [this.repository.head] : [],
      changes,
      metadata: {
        branch: this.repository.currentBranch,
        tags: []
      }
    };

    // Update repository state
    this.repository.commits.set( commitId, commit);
    this.repository.head = commitId;
    this.repository.branches.get(_this.repository.currentBranch)!.commitId = commitId;

    // Update files
    for ( const [path, content] of this.stagingArea) {
      this.repository.files.set( path, content);
    }

    // Clear staging area
    this.stagingArea.clear(_);

    this.emit( 'commit-created', { commit });
    return commitId;
  }

  /**
   * Create a new branch
   */
  createBranch( name: string, fromCommit?: string | null, isDefault = false): void {
    if (_this.repository.branches.has(name)) {
      throw new Error(_`Branch ${name} already exists`);
    }

    const commitId = fromCommit || this.repository.head || '';
    const branch: Branch = {
      name,
      commitId,
      isDefault,
      isProtected: isDefault,
      lastActivity: Date.now(_),
      author: 'current-user' // Would be actual user in real implementation
    };

    this.repository.branches.set( name, branch);
    
    if (isDefault) {
      this.repository.defaultBranch = name;
    }

    this.emit( 'branch-created', { branch });
  }

  /**
   * Switch to a different branch
   */
  async checkout(_branchName: string): Promise<void> {
    const branch = this.repository.branches.get(_branchName);
    if (!branch) {
      throw new Error(_`Branch ${branchName} does not exist`);
    }

    // Check for uncommitted changes
    if (_this.hasUncommittedChanges()) {
      throw new Error('You have uncommitted changes. Please commit or stash them first.');
    }

    // Update working directory to match branch
    const commit = this.repository.commits.get(_branch.commitId);
    if (commit) {
      this.workingDirectory.clear(_);
      commit.changes.forEach(change => {
        if (_change.type !== 'deleted' && change.content) {
          this.workingDirectory.set( change.path, change.content);
        }
      });
    }

    this.repository.currentBranch = branchName;
    this.repository.head = branch.commitId;

    this.emit( 'branch-switched', { branchName, commitId: branch.commitId });
  }

  /**
   * Merge branches
   */
  async merge( sourceBranch: string, targetBranch: string, message?: string): Promise<string> {
    const source = this.repository.branches.get(_sourceBranch);
    const target = this.repository.branches.get(_targetBranch);

    if (!source || !target) {
      throw new Error('Source or target branch does not exist');
    }

    // Check for conflicts
    const conflicts = await this.detectConflicts( sourceBranch, targetBranch);
    if (_conflicts.length > 0) {
      throw new Error(_`Merge conflicts detected in ${conflicts.length} files`);
    }

    // Create merge commit
    const mergeCommitId = this.generateCommitId(_);
    const sourceCommit = this.repository.commits.get(_source.commitId);
    const targetCommit = this.repository.commits.get(_target.commitId);

    if (!sourceCommit || !targetCommit) {
      throw new Error('Invalid commit references');
    }

    // Combine changes
    const mergedChanges: FileChange[] = [];
    const mergedFiles = new Map<string, string>(_);

    // Apply target changes first
    targetCommit.changes.forEach(change => {
      if (_change.content) {
        mergedFiles.set( change.path, change.content);
      }
    });

    // Apply source changes
    sourceCommit.changes.forEach(change => {
      if (_change.content) {
        mergedFiles.set( change.path, change.content);
        mergedChanges.push(_change);
      }
    });

    const mergeCommit: Commit = {
      id: mergeCommitId,
      message: message || `Merge ${sourceBranch} into ${targetBranch}`,
      author: {
        name: 'System',
        email: 'system@soliditylearning.com',
        id: 'system'
      },
      timestamp: Date.now(_),
      parentIds: [source.commitId, target.commitId],
      changes: mergedChanges,
      metadata: {
        branch: targetBranch,
        tags: []
      }
    };

    this.repository.commits.set( mergeCommitId, mergeCommit);
    this.repository.branches.get(_targetBranch)!.commitId = mergeCommitId;

    // Update files
    mergedFiles.forEach( (content, path) => {
      this.repository.files.set( path, content);
    });

    this.emit( 'branches-merged', { sourceBranch, targetBranch, mergeCommitId });
    return mergeCommitId;
  }

  /**
   * Create a merge request
   */
  createMergeRequest(
    title: string,
    description: string,
    sourceBranch: string,
    targetBranch: string,
    author: MergeRequest['author']
  ): string {
    const id = this.generateMergeRequestId(_);
    const sourceCommits = this.getCommitsBetweenBranches( sourceBranch, targetBranch);

    const mergeRequest: MergeRequest = {
      id,
      title,
      description,
      sourceBranch,
      targetBranch,
      author,
      status: 'open',
      commits: sourceCommits.map(c => c.id),
      reviewers: [],
      approvals: [],
      createdAt: Date.now(_),
      updatedAt: Date.now(_)
    };

    this.repository.mergeRequests.set( id, mergeRequest);
    this.emit( 'merge-request-created', { mergeRequest });
    return id;
  }

  /**
   * Get commit history
   */
  getCommitHistory( branchName?: string, limit = 50): Commit[] {
    const branch = branchName ? this.repository.branches.get(_branchName) : 
                   this.repository.branches.get(_this.repository.currentBranch);
    
    if (!branch) return [];

    const commits: Commit[] = [];
    let currentCommitId = branch.commitId;
    
    while (_currentCommitId && commits.length < limit) {
      const commit = this.repository.commits.get(_currentCommitId);
      if (!commit) break;
      
      commits.push(_commit);
      currentCommitId = commit.parentIds[0]; // Follow first parent
    }

    return commits;
  }

  /**
   * Get file diff between commits
   */
  getDiff( fromCommit: string, toCommit: string, filePath?: string): FileChange[] {
    const fromCommitObj = this.repository.commits.get(_fromCommit);
    const toCommitObj = this.repository.commits.get(_toCommit);

    if (!fromCommitObj || !toCommitObj) {
      throw new Error('Invalid commit references');
    }

    // Simple diff implementation
    const changes: FileChange[] = [];
    const fromFiles = new Map<string, string>(_);
    const toFiles = new Map<string, string>(_);

    // Build file maps
    fromCommitObj.changes.forEach(change => {
      if (_change.content) {
        fromFiles.set( change.path, change.content);
      }
    });

    toCommitObj.changes.forEach(change => {
      if (_change.content) {
        toFiles.set( change.path, change.content);
      }
    });

    // Compare files
    const allPaths = new Set([...fromFiles.keys(), ...toFiles.keys(_)]);
    
    for (_const path of allPaths) {
      if (filePath && path !== filePath) continue;

      const fromContent = fromFiles.get(_path);
      const toContent = toFiles.get(_path);

      if (!fromContent && toContent) {
        // File added
        changes.push({
          type: 'added',
          path,
          content: toContent,
          hunks: this.generateDiffHunks( '', toContent)
        });
      } else if (fromContent && !toContent) {
        // File deleted
        changes.push({
          type: 'deleted',
          path,
          oldContent: fromContent,
          hunks: this.generateDiffHunks( fromContent, '')
        });
      } else if (fromContent && toContent && fromContent !== toContent) {
        // File modified
        changes.push({
          type: 'modified',
          path,
          content: toContent,
          oldContent: fromContent,
          hunks: this.generateDiffHunks( fromContent, toContent)
        });
      }
    }

    return changes;
  }

  // Helper methods
  private generateCommitId(_): string {
    return `commit_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMergeRequestId(_): string {
    return `mr_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hasUncommittedChanges(_): boolean {
    return this.stagingArea.size > 0 || this.hasWorkingDirectoryChanges(_);
  }

  private hasWorkingDirectoryChanges(_): boolean {
    for ( const [path, content] of this.workingDirectory) {
      const repoContent = this.repository.files.get(_path);
      if (_repoContent !== content) {
        return true;
      }
    }
    return false;
  }

  private async detectConflicts( sourceBranch: string, targetBranch: string): Promise<ConflictInfo[]> {
    // Simplified conflict detection
    const conflicts: ConflictInfo[] = [];
    
    const source = this.repository.branches.get(_sourceBranch);
    const target = this.repository.branches.get(_targetBranch);
    
    if (!source || !target) return conflicts;

    const sourceCommit = this.repository.commits.get(_source.commitId);
    const targetCommit = this.repository.commits.get(_target.commitId);
    
    if (!sourceCommit || !targetCommit) return conflicts;

    // Check for conflicting changes to the same files
    const sourceFiles = new Map<string, string>(_);
    const targetFiles = new Map<string, string>(_);

    sourceCommit.changes.forEach(change => {
      if (_change.content) {
        sourceFiles.set( change.path, change.content);
      }
    });

    targetCommit.changes.forEach(change => {
      if (_change.content) {
        targetFiles.set( change.path, change.content);
      }
    });

    for ( const [path, sourceContent] of sourceFiles) {
      const targetContent = targetFiles.get(_path);
      if (targetContent && targetContent !== sourceContent) {
        conflicts.push({
          path,
          type: 'content',
          ourContent: targetContent,
          theirContent: sourceContent,
          resolved: false
        });
      }
    }

    return conflicts;
  }

  private getCommitsBetweenBranches( sourceBranch: string, targetBranch: string): Commit[] {
    // Simplified implementation - get commits in source that aren't in target
    const sourceCommits = this.getCommitHistory(_sourceBranch);
    const targetCommits = this.getCommitHistory(_targetBranch);
    const targetCommitIds = new Set(_targetCommits.map(c => c.id));
    
    return sourceCommits.filter(commit => !targetCommitIds.has(commit.id));
  }

  private generateDiffHunks( oldContent: string, newContent: string): DiffHunk[] {
    // Simplified diff generation
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const lines: DiffLine[] = [];

    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (_oldLine === newLine) {
        lines.push({
          type: 'context',
          content: oldLine || '',
          oldLineNumber: i + 1,
          newLineNumber: i + 1
        });
      } else if (oldLine && !newLine) {
        lines.push({
          type: 'removed',
          content: oldLine,
          oldLineNumber: i + 1
        });
      } else if (!oldLine && newLine) {
        lines.push({
          type: 'added',
          content: newLine,
          newLineNumber: i + 1
        });
      } else {
        lines.push({
          type: 'removed',
          content: oldLine,
          oldLineNumber: i + 1
        });
        lines.push({
          type: 'added',
          content: newLine,
          newLineNumber: i + 1
        });
      }
    }

    return [{
      oldStart: 1,
      oldLines: oldLines.length,
      newStart: 1,
      newLines: newLines.length,
      lines
    }];
  }

  // Public getters
  get currentBranch(_): string {
    return this.repository.currentBranch;
  }

  get branches(_): Branch[] {
    return Array.from(_this.repository.branches.values());
  }

  get mergeRequests(_): MergeRequest[] {
    return Array.from(_this.repository.mergeRequests.values());
  }

  get repositoryInfo(_): Omit<Repository, 'commits' | 'files'> {
    return {
      id: this.repository.id,
      name: this.repository.name,
      description: this.repository.description,
      defaultBranch: this.repository.defaultBranch,
      branches: this.repository.branches,
      mergeRequests: this.repository.mergeRequests,
      head: this.repository.head,
      currentBranch: this.repository.currentBranch
    };
  }
}
