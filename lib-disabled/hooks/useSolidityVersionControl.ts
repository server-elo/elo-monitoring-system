'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { SolidityVersionControl, Commit, Branch, MergeRequest, FileChange } from '../vcs/SolidityVersionControl';
import { useNotifications } from '@/hooks/useNotifications';

export interface VCSState {
  isInitialized: boolean;
  currentBranch: string;
  branches: Branch[];
  commits: Commit[];
  mergeRequests: MergeRequest[];
  stagedFiles: string[];
  uncommittedChanges: string[];
  isLoading: boolean;
  error: string | null;
}

export interface UseVCSOptions {
  repositoryId: string;
  repositoryName: string;
  autoInitialize?: boolean;
  onCommitCreated?: (commit: Commit) => void;
  onBranchCreated?: (branch: Branch) => void;
  onMergeRequestCreated?: (mergeRequest: MergeRequest) => void;
}

export interface UseVCSReturn {
  state: VCSState;
  stageFiles: (paths: string[] | string) => void;
  unstageFiles: (paths: string[] | string) => void;
  createCommit: (message: string) => Promise<string | null>;
  createBranch: (name: string, fromCommit?: string) => void;
  switchBranch: (branchName: string) => void;
  mergeBranches: (sourceBranch: string, targetBranch?: string) => Promise<void>;
  createMergeRequest: (
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description?: string
  ) => void;
  updateMergeRequestStatus: (id: string, status: 'open' | 'closed' | 'merged') => void;
  getFileDiff: (filePath: string, commitId?: string) => string | null;
  refreshState: () => void;
}

/**
 * Hook for managing version control operations
 */
export function useSolidityVersionControl(options: UseVCSOptions): UseVCSReturn {
  const { 
    repositoryId, 
    repositoryName, 
    autoInitialize = true, 
    onCommitCreated, 
    onBranchCreated, 
    onMergeRequestCreated 
  } = options;
  
  const { data: session } = useSession();
  const vcsRef = useRef<SolidityVersionControl | null>(null);
  const { showSuccess, showError, showInfo, showWarning } = useNotifications();
  
  const [state, setState] = useState<VCSState>({
    isInitialized: false,
    currentBranch: 'main',
    branches: [],
    commits: [],
    mergeRequests: [],
    stagedFiles: [],
    uncommittedChanges: [],
    isLoading: false,
    error: null
  });

  // Refresh state from VCS
  const refreshState = useCallback(() => {
    if (!vcsRef.current) return;
    
    const vcs = vcsRef.current;
    const commits = vcs.getCommitHistory();
    const branches = vcs.branches;
    const mergeRequests = vcs.mergeRequests;
    
    setState(prev => ({
      ...prev,
      currentBranch: vcs.currentBranch,
      branches,
      commits,
      mergeRequests
    }));
  }, []);

  // Initialize VCS
  useEffect(() => {
    if (!autoInitialize) return;
    
    const initializeVCS = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const vcs = new SolidityVersionControl(repositoryId, repositoryName);
        
        // Set up event listeners
        vcs.on('repository-initialized', ({ commitId }) => {
          setState(prev => ({ ...prev, isInitialized: true, isLoading: false }));
          showSuccess('Repository Initialized', `Initial commit: ${commitId.substring(0, 8)}`);
        });
        
        vcs.on('commit-created', ({ commit }) => {
          setState(prev => ({
            ...prev,
            commits: [commit, ...prev.commits.slice(0, 49)], // Keep last 50 commits
            stagedFiles: []
          }));
          showSuccess('Commit Created', `${commit.message} (${commit.id.substring(0, 8)})`);
          onCommitCreated?.(commit);
        });
        
        vcs.on('branch-created', ({ branch }) => {
          setState(prev => ({
            ...prev,
            branches: [...prev.branches, branch]
          }));
          showInfo('Branch Created', `Created branch: ${branch.name}`);
          onBranchCreated?.(branch);
        });
        
        vcs.on('branch-switched', ({ branchName }) => {
          setState(prev => ({
            ...prev,
            currentBranch: branchName
          }));
          showInfo('Branch Switched', `Switched to: ${branchName}`);
        });
        
        vcs.on('branches-merged', ({ sourceBranch, targetBranch }) => {
          showSuccess('Branches Merged', `Merged ${sourceBranch} into ${targetBranch}`);
          refreshState();
        });
        
        vcs.on('merge-request-created', ({ mergeRequest }) => {
          setState(prev => ({
            ...prev,
            mergeRequests: [...prev.mergeRequests, mergeRequest]
          }));
          showInfo('Merge Request Created', mergeRequest.title);
          onMergeRequestCreated?.(mergeRequest);
        });
        
        vcs.on('files-staged', ({ paths }) => {
          setState(prev => ({
            ...prev,
            stagedFiles: [...new Set([...prev.stagedFiles, ...paths])]
          }));
        });
        
        vcs.on('files-unstaged', ({ paths }) => {
          setState(prev => ({
            ...prev,
            stagedFiles: prev.stagedFiles.filter(file => !paths.includes(file))
          }));
        });
        
        vcsRef.current = vcs;
        
        // Initialize with empty repository
        await vcs.initialize({
          'contracts/MyContract.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    \n}'
        });
        
        // Load initial state
        refreshState();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize VCS';
        setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        showError('VCS Initialization Failed', errorMessage);
      }
    };
    
    initializeVCS();
    
    return () => {
      if (vcsRef.current) {
        vcsRef.current.removeAllListeners();
      }
    };
  }, [repositoryId, repositoryName, autoInitialize, showSuccess, showError, showInfo, onCommitCreated, onBranchCreated, onMergeRequestCreated, refreshState]);

  // Stage files
  const stageFiles = useCallback((paths: string[] | string) => {
    if (!vcsRef.current) {
      showError('VCS Not Ready', 'Version control system is not initialized');
      return;
    }
    
    try {
      vcsRef.current.add(paths);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stage files';
      showError('Stage Failed', errorMessage);
    }
  }, [showError]);

  // Unstage files
  const unstageFiles = useCallback((paths: string[] | string) => {
    if (!vcsRef.current) return;
    
    try {
      vcsRef.current.unstage(paths);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unstage files';
      showError('Unstage Failed', errorMessage);
    }
  }, [showError]);

  // Create commit
  const createCommit = useCallback(async (message: string): Promise<string | null> => {
    if (!vcsRef.current || !session?.user) {
      showError('Cannot Commit', 'VCS not ready or user not authenticated');
      return null;
    }
    
    try {
      const commitId = await vcsRef.current.commit(message, {
        name: session.user.name || 'Anonymous',
        email: session.user.email || 'anonymous@example.com',
        id: session.user.id || 'anonymous'
      });
      
      return commitId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create commit';
      showError('Commit Failed', errorMessage);
      return null;
    }
  }, [session?.user, showError]);

  // Create branch
  const createBranch = useCallback((name: string, fromCommit?: string) => {
    if (!vcsRef.current) {
      showError('VCS Not Ready', 'Version control system is not initialized');
      return;
    }
    
    try {
      vcsRef.current.createBranch(name, fromCommit);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create branch';
      showError('Branch Creation Failed', errorMessage);
    }
  }, [showError]);

  // Switch branch
  const switchBranch = useCallback((branchName: string) => {
    if (!vcsRef.current) {
      showError('VCS Not Ready', 'Version control system is not initialized');
      return;
    }
    
    try {
      vcsRef.current.switchBranch(branchName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch branch';
      showError('Branch Switch Failed', errorMessage);
    }
  }, [showError]);

  // Merge branches
  const mergeBranches = useCallback(async (
    sourceBranch: string,
    targetBranch?: string
  ): Promise<void> => {
    if (!vcsRef.current) {
      showError('VCS Not Ready', 'Version control system is not initialized');
      return;
    }
    
    try {
      await vcsRef.current.merge(sourceBranch, targetBranch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to merge branches';
      showError('Merge Failed', errorMessage);
      showWarning('Merge Conflict', 'Manual conflict resolution may be required');
    }
  }, [showError, showWarning]);

  // Create merge request
  const createMergeRequest = useCallback((
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description?: string
  ) => {
    if (!vcsRef.current || !session?.user) {
      showError('Cannot Create MR', 'VCS not ready or user not authenticated');
      return;
    }
    
    try {
      vcsRef.current.createMergeRequest({
        sourceBranch,
        targetBranch,
        title,
        description,
        author: {
          name: session.user.name || 'Anonymous',
          email: session.user.email || 'anonymous@example.com',
          id: session.user.id || 'anonymous'
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create merge request';
      showError('MR Creation Failed', errorMessage);
    }
  }, [session?.user, showError]);

  // Update merge request status
  const updateMergeRequestStatus = useCallback((
    id: string,
    status: 'open' | 'closed' | 'merged'
  ) => {
    if (!vcsRef.current) {
      showError('VCS Not Ready', 'Version control system is not initialized');
      return;
    }
    
    try {
      vcsRef.current.updateMergeRequestStatus(id, status);
      refreshState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update merge request';
      showError('MR Update Failed', errorMessage);
    }
  }, [showError, refreshState]);

  // Get file diff
  const getFileDiff = useCallback((filePath: string, commitId?: string): string | null => {
    if (!vcsRef.current) return null;
    
    try {
      return vcsRef.current.diff(filePath, commitId);
    } catch (error) {
      return null;
    }
  }, []);

  return {
    state,
    stageFiles,
    unstageFiles,
    createCommit,
    createBranch,
    switchBranch,
    mergeBranches,
    createMergeRequest,
    updateMergeRequestStatus,
    getFileDiff,
    refreshState
  };
}