/**
 * Solidity Version Control System
 * Provides version control functionality for Solidity contracts
 */

import { EventEmitter } from 'events';

export interface Commit {
  id: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  timestamp: Date;
  changes: Change[];
  parentId?: string;
}

export interface Change {
  type: 'add' | 'modify' | 'delete';
  path: string;
  content?: string;
  oldContent?: string;
}

export interface Branch {
  name: string;
  headCommitId: string;
}

export class SolidityVersionControl extends EventEmitter {
  private commits: Map<string, Commit> = new Map();
  private branches: Map<string, Branch> = new Map();
  private currentBranch: string = 'main';
  private workingChanges: Change[] = [];

  constructor() {
    super();
    // Initialize with main branch
    this.branches.set('main', {
      name: 'main',
      headCommitId: ''
    });
  }

  async commit(message: string, author: { name: string; email: string }): Promise<string> {
    const commitId = this.generateCommitId();
    const currentBranch = this.branches.get(this.currentBranch);
    
    const commit: Commit = {
      id: commitId,
      message,
      author,
      timestamp: new Date(),
      changes: [...this.workingChanges],
      parentId: currentBranch?.headCommitId
    };

    this.commits.set(commitId, commit);
    
    if (currentBranch) {
      currentBranch.headCommitId = commitId;
    }

    this.workingChanges = [];
    this.emit('commit', commit);
    
    return commitId;
  }

  async createBranch(name: string): Promise<void> {
    const currentBranch = this.branches.get(this.currentBranch);
    
    this.branches.set(name, {
      name,
      headCommitId: currentBranch?.headCommitId || ''
    });
    
    this.emit('branch-created', name);
  }

  async switchBranch(name: string): Promise<void> {
    if (!this.branches.has(name)) {
      throw new Error(`Branch "${name}" does not exist`);
    }
    
    this.currentBranch = name;
    this.emit('branch-switched', name);
  }

  addChange(change: Change): void {
    this.workingChanges.push(change);
    this.emit('change-added', change);
  }

  getHistory(): Commit[] {
    const history: Commit[] = [];
    const currentBranch = this.branches.get(this.currentBranch);
    
    if (!currentBranch) return history;
    
    let commitId = currentBranch.headCommitId;
    
    while (commitId) {
      const commit = this.commits.get(commitId);
      if (!commit) break;
      
      history.push(commit);
      commitId = commit.parentId || '';
    }
    
    return history;
  }

  private generateCommitId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
