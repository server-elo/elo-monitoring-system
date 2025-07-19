'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, GitCommit, GitPullRequest, Plus, X, Clock, User, FileText, ChevronDown, ChevronRight, Eye, MessageSquare } from 'lucide-react';
import { useSolidityVersionControl } from '@/lib/hooks/useSolidityVersionControl';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { cn } from '@/lib/utils';

export interface VersionControlInterfaceProps {
  repositoryId: string;
  repositoryName: string;
  className?: string;
}

export function VersionControlInterface({
  repositoryId,
  repositoryName,
  className
}: VersionControlInterfaceProps) {
  const {
    isInitialized,
    currentBranch,
    branches,
    commits,
    mergeRequests,
    stagedFiles,
    canCommit,
    isLoading,
    error,
    stageFiles: _stageFiles,
    unstageFiles: _unstageFiles,
    createCommit,
    createBranch,
    switchBranch,
    createMergeRequest: _createMergeRequest,
    getFileDiff: _getFileDiff,
    openMergeRequests
  } = useSolidityVersionControl({
    repositoryId,
    repositoryName
  });

  const [activeTab, setActiveTab] = useState<'commits' | 'branches' | 'mergeRequests'>('commits');
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranchForm, setShowNewBranchForm] = useState(false);
  const [showCommitForm, setShowCommitForm] = useState(false);
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());

  // Handle commit creation
  const handleCreateCommit = async () => {
    if (!commitMessage.trim()) return;

    const commitId = await createCommit(commitMessage.trim());
    if (commitId) {
      setCommitMessage('');
      setShowCommitForm(false);
    }
  };

  // Handle branch creation
  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;

    createBranch(newBranchName.trim());
    setNewBranchName('');
    setShowNewBranchForm(false);
  };

  // Toggle commit expansion
  const toggleCommitExpansion = (commitId: string) => {
    setExpandedCommits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commitId)) {
        newSet.delete(commitId);
      } else {
        newSet.add(commitId);
      }
      return newSet;
    });
  };

  if (!isInitialized && isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <GitBranch className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-pulse" />
          <p className="text-gray-400">Initializing version control...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <X className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 font-medium">Version Control Error</p>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <GlassContainer
        intensity="light"
        tint="neutral"
        border
        className="flex items-center justify-between p-4 mb-4"
      >
        <div className="flex items-center space-x-3">
          <GitBranch className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">{repositoryName}</h2>
            <p className="text-sm text-gray-400">
              Current branch: <span className="text-blue-400">{currentBranch}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {stagedFiles.length > 0 && (
            <button
              onClick={() => setShowCommitForm(true)}
              className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              <GitCommit className="w-4 h-4" />
              <span>Commit ({stagedFiles.length})</span>
            </button>
          )}

          <button
            onClick={() => setShowNewBranchForm(true)}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Branch</span>
          </button>
        </div>
      </GlassContainer>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-4">
        {[
          { id: 'commits', label: 'Commits', count: commits.length },
          { id: 'branches', label: 'Branches', count: branches.length },
          { id: 'mergeRequests', label: 'Merge Requests', count: openMergeRequests },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 text-sm transition-colors',
              activeTab === tab.id
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            )}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="px-2 py-0.5 bg-gray-600 text-xs rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-full overflow-y-auto"
          >
            {activeTab === 'commits' && (
              <div className="space-y-3">
                {commits.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No commits yet</p>
                  </div>
                ) : (
                  commits.map((commit) => (
                    <GlassContainer
                      key={commit.id}
                      intensity="light"
                      tint="neutral"
                      border
                      className="p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <button
                              onClick={() => toggleCommitExpansion(commit.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              {expandedCommits.has(commit.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <h3 className="text-white font-medium">{commit.message}</h3>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{commit.author.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(commit.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <GitCommit className="w-3 h-3" />
                              <span className="font-mono">{commit.id.substring(0, 8)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedCommits.has(commit.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pt-4 border-t border-gray-600"
                          >
                            <h4 className="text-sm font-medium text-white mb-2">
                              Changes ({commit.changes.length} files)
                            </h4>
                            <div className="space-y-2">
                              {commit.changes.map((change, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm">
                                  <div className={cn(
                                    'w-2 h-2 rounded-full',
                                    change.type === 'added' ? 'bg-green-400' :
                                    change.type === 'modified' ? 'bg-yellow-400' :
                                    change.type === 'deleted' ? 'bg-red-400' :
                                    'bg-blue-400'
                                  )} />
                                  <span className="text-gray-300">{change.path}</span>
                                  <span className="text-gray-500">({change.type})</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassContainer>
                  ))
                )}
              </div>
            )}

            {activeTab === 'branches' && (
              <div className="space-y-3">
                {branches.map((branch) => (
                  <GlassContainer
                    key={branch.name}
                    intensity="light"
                    tint="neutral"
                    border
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GitBranch className={cn(
                          'w-4 h-4',
                          branch.name === currentBranch ? 'text-green-400' : 'text-gray-400'
                        )} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{branch.name}</span>
                            {branch.isDefault && (
                              <span className="px-2 py-0.5 bg-blue-600 text-xs rounded">
                                default
                              </span>
                            )}
                            {branch.name === currentBranch && (
                              <span className="px-2 py-0.5 bg-green-600 text-xs rounded">
                                current
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            Last activity: {new Date(branch.lastActivity).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {branch.name !== currentBranch && (
                        <button
                          onClick={() => switchBranch(branch.name)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </GlassContainer>
                ))}
              </div>
            )}

            {activeTab === 'mergeRequests' && (
              <div className="space-y-3">
                {mergeRequests.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <GitPullRequest className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No merge requests</p>
                  </div>
                ) : (
                  mergeRequests.map((mr) => (
                    <GlassContainer
                      key={mr.id}
                      intensity="light"
                      tint="neutral"
                      border
                      className="p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">{mr.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">{mr.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{mr.sourceBranch} → {mr.targetBranch}</span>
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{mr.author.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(mr.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            'px-2 py-1 text-xs rounded',
                            mr.status === 'open' ? 'bg-green-600 text-white' :
                            mr.status === 'merged' ? 'bg-purple-600 text-white' :
                            mr.status === 'closed' ? 'bg-gray-600 text-white' :
                            'bg-yellow-600 text-white'
                          )}>
                            {mr.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4 text-gray-400">
                          <span>{mr.commits.length} commits</span>
                          <span>{mr.approvals.length}/{mr.reviewers.length} approvals</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
                            <MessageSquare className="w-3 h-3" />
                            <span>Comment</span>
                          </button>
                        </div>
                      </div>
                    </GlassContainer>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Commit Form Modal */}
      <AnimatePresence>
        {showCommitForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowCommitForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Create Commit</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Commit Message
                  </label>
                  <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Enter commit message..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">
                    Staged files ({stagedFiles.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {stagedFiles.map((file) => (
                      <div key={file} className="flex items-center space-x-2 text-sm">
                        <FileText className="w-3 h-3 text-green-400" />
                        <span className="text-gray-300">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCommitForm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCommit}
                    disabled={!commitMessage.trim() || !canCommit}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                  >
                    Commit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Branch Form Modal */}
      <AnimatePresence>
        {showNewBranchForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowNewBranchForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Create Branch</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="feature/new-feature"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowNewBranchForm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBranch}
                    disabled={!newBranchName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
