'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  SolidityVersionControl, 
  Commit, 
  Branch, 
  MergeRequest, 
  FileChange 
} from '../vcs/SolidityVersionControl';
import { useNotifications } from '@/components/ui/NotificationSystem';

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

/**
 * Hook for managing version control operations
 */
export function useSolidityVersionControl(options: UseVCSOptions) {
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
  const { showSuccess, showError, showInfo, showWarning: _showWarning } = useNotifications();

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

  // Initialize VCS
  useEffect(() => {
    if (!autoInitialize) return;

    const initializeVCS = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const vcs = new SolidityVersionControl(repositoryId, repositoryName);

        // Set up event listeners
        vcs.on('repository-initialized', ({ commitId }) => {
          setState(prev => ({ 
            ...prev, 
            isInitialized: true, 
            isLoading: false 
          }));
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

        vcs.on('branch-switched', ({ branchName, commitId: _commitId }) => {
          setState(prev => ({
            ...prev,
            currentBranch: branchName
          }));
          showInfo('Branch Switched', `Switched to: ${branchName}`);
        });

        vcs.on('branches-merged', ({ sourceBranch, targetBranch, mergeCommitId: _mergeCommitId }) => {
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
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          isLoading: false 
        }));
        showError('VCS Initialization Failed', errorMessage);
      }
    };

    initializeVCS();

    return () => {
      if (vcsRef.current) {
        vcsRef.current.removeAllListeners();
      }
    };
  }, [repositoryId, repositoryName, autoInitialize, showSuccess, showError, showInfo]);

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
  const switchBranch = useCallback(async (branchName: string) => {
    if (!vcsRef.current) {
      showError('VCS Not Ready', 'Version control system is not initialized');
      return;
    }

    try {
      await vcsRef.current.checkout(branchName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch branch';
      showError('Branch Switch Failed', errorMessage);
    }
  }, [showError]);

  // Merge branches
  const mergeBranches = useCallback(async (
    sourceBranch: string, 
    targetBranch: string, 
    message?: string
  ): Promise<string | null> => {
    if (!vcsRef.current) {
      showError('VCS Not Ready', 'Version control system is not initialized');
      return null;
    }

    try {
      const mergeCommitId = await vcsRef.current.merge(sourceBranch, targetBranch, message);
      return mergeCommitId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to merge branches';
      showError('Merge Failed', errorMessage);
      return null;
    }
  }, [showError]);

  // Create merge request
  const createMergeRequest = useCallback((
    title: string,
    description: string,
    sourceBranch: string,
    targetBranch: string
  ): string | null => {
    if (!vcsRef.current || !session?.user) {
      showError('Cannot Create MR', 'VCS not ready or user not authenticated');
      return null;
    }

    try {
      const mrId = vcsRef.current.createMergeRequest(
        title,
        description,
        sourceBranch,
        targetBranch,
        {
          name: session.user.name || 'Anonymous',
          email: session.user.email || 'anonymous@example.com',
          id: session.user.id || 'anonymous'
        }
      );

      return mrId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create merge request';
      showError('Merge Request Failed', errorMessage);
      return null;
    }
  }, [session?.user, showError]);

  // Get file diff
  const getFileDiff = useCallback((
    fromCommit: string, 
    toCommit: string, 
    filePath?: string
  ): FileChange[] => {
    if (!vcsRef.current) return [];

    try {
      return vcsRef.current.getDiff(fromCommit, toCommit, filePath);
    } catch (error) {
      console.error('Failed to get diff:', error);
      return [];
    }
  }, []);

  // Get commit history for branch
  const getBranchHistory = useCallback((branchName?: string, limit = 50): Commit[] => {
    if (!vcsRef.current) return [];

    try {
      return vcsRef.current.getCommitHistory(branchName, limit);
    } catch (error) {
      console.error('Failed to get branch history:', error);
      return [];
    }
  }, []);

  // Get repository info
  const getRepositoryInfo = useCallback(() => {
    return vcsRef.current?.repositoryInfo || null;
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    stageFiles,
    unstageFiles,
    createCommit,
    createBranch,
    switchBranch,
    mergeBranches,
    createMergeRequest,
    
    // Queries
    getFileDiff,
    getBranchHistory,
    getRepositoryInfo,
    refreshState,
    
    // Computed values
    canCommit: state.stagedFiles.length > 0,
    hasUncommittedChanges: state.uncommittedChanges.length > 0,
    totalCommits: state.commits.length,
    totalBranches: state.branches.length,
    openMergeRequests: state.mergeRequests.filter(mr => mr.status === 'open').length,
    isOnDefaultBranch: state.currentBranch === 'main',
    
    // Repository info
    repositoryId,
    repositoryName
  };
}
