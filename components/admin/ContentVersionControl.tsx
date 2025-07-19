'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, User, Eye, RotateCcw, Download, Calendar, Save, X, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { ContentVersion } from '@/lib/admin/types';

interface ContentVersionControlProps {
  contentId: string;
  className?: string;
}

interface VersionCompareProps {
  version1: ContentVersion;
  version2: ContentVersion;
  onClose: () => void;
}

function VersionCompare({ version1, version2, onClose }: VersionCompareProps) {
  const [showDiff, setShowDiff] = useState(true);

  // Simple diff highlighting (in a real implementation, use a proper diff library)
  const highlightDifferences = (text1: string, text2: string) => {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    // This is a simplified diff - in production, use a proper diff algorithm
    return {
      left: words1.map((word, index) => ({
        word,
        changed: words2[index] !== word,
        type: words2[index] ? 'modified' : 'removed'
      })),
      right: words2.map((word, index) => ({
        word,
        changed: words1[index] !== word,
        type: words1[index] ? 'modified' : 'added'
      }))
    };
  };

  const diff = highlightDifferences(version1.content, version2.content);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-lg border border-white/20 w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Version Comparison</h2>
            <p className="text-gray-400 text-sm mt-1">
              Comparing v{version1.version} with v{version2.version}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowDiff(!showDiff)}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              {showDiff ? 'Hide Diff' : 'Show Diff'}
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Version Info */}
        <div className="grid grid-cols-2 gap-4 p-6 border-b border-white/10">
          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <span className="font-medium text-white">Version {version1.version}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="w-3 h-3" />
                <span>{version1.createdBy}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Calendar className="w-3 h-3" />
                <span>{version1.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="text-gray-400">{version1.changeLog}</div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <span className="font-medium text-white">Version {version2.version}</span>
              {version2.isActive && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Current</span>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="w-3 h-3" />
                <span>{version2.createdBy}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Calendar className="w-3 h-3" />
                <span>{version2.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="text-gray-400">{version2.changeLog}</div>
            </div>
          </Card>
        </div>

        {/* Content Comparison */}
        <div className="flex-1 overflow-auto p-6">
          {showDiff ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-white mb-3">Version {version1.version}</h3>
                <div className="bg-black/20 rounded-lg p-4 font-mono text-sm">
                  {diff.left.map((item, index) => (
                    <span
                      key={index}
                      className={cn(
                        item.changed && item.type === 'removed' && 'bg-red-500/20 text-red-300',
                        item.changed && item.type === 'modified' && 'bg-yellow-500/20 text-yellow-300'
                      )}
                    >
                      {item.word}{' '}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-white mb-3">Version {version2.version}</h3>
                <div className="bg-black/20 rounded-lg p-4 font-mono text-sm">
                  {diff.right.map((item, index) => (
                    <span
                      key={index}
                      className={cn(
                        item.changed && item.type === 'added' && 'bg-green-500/20 text-green-300',
                        item.changed && item.type === 'modified' && 'bg-yellow-500/20 text-yellow-300'
                      )}
                    >
                      {item.word}{' '}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-white mb-3">Version {version1.version}</h3>
                <div className="bg-black/20 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">
                  {version1.content}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-white mb-3">Version {version2.version}</h3>
                <div className="bg-black/20 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">
                  {version2.content}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ContentVersionControl({ contentId, className }: ContentVersionControlProps) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [newVersionData, setNewVersionData] = useState({
    title: '',
    changeLog: '',
    content: ''
  });

  useEffect(() => {
    loadVersions();
  }, [contentId]);

  const loadVersions = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock version data
    const mockVersions: ContentVersion[] = [
      {
        id: 'v1',
        contentId,
        version: 3,
        title: 'Introduction to Solidity - Updated Examples',
        content: 'This is the latest version of the Solidity introduction with updated examples and improved explanations.',
        createdAt: new Date('2024-01-10'),
        createdBy: 'Jane Smith',
        changeLog: 'Updated code examples, fixed typos, added new section on gas optimization',
        isActive: true
      },
      {
        id: 'v2',
        contentId,
        version: 2,
        title: 'Introduction to Solidity - Bug Fixes',
        content: 'This is the second version of the Solidity introduction with bug fixes and minor improvements.',
        createdAt: new Date('2023-12-15'),
        createdBy: 'Jane Smith',
        changeLog: 'Fixed code compilation errors, updated deprecated syntax',
        isActive: false
      },
      {
        id: 'v3',
        contentId,
        version: 1,
        title: 'Introduction to Solidity - Initial Version',
        content: 'This is the initial version of the Solidity introduction lesson.',
        createdAt: new Date('2023-11-01'),
        createdBy: 'Jane Smith',
        changeLog: 'Initial version of the lesson',
        isActive: false
      }
    ];

    setVersions(mockVersions);
    setLoading(false);
  };

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId];
      }
    });
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      setShowCompare(true);
    }
  };

  const handleRevertToVersion = (versionId: string) => {
    console.log('Reverting to version:', versionId);
    // Implement version revert logic
  };

  const handleCreateVersion = async () => {
    if (!newVersionData.title || !newVersionData.changeLog) return;

    const newVersion: ContentVersion = {
      id: `v${Date.now()}`,
      contentId,
      version: Math.max(...versions.map(v => v.version)) + 1,
      title: newVersionData.title,
      content: newVersionData.content,
      createdAt: new Date(),
      createdBy: 'Current User',
      changeLog: newVersionData.changeLog,
      isActive: false
    };

    setVersions(prev => [newVersion, ...prev]);
    setNewVersionData({ title: '', changeLog: '', content: '' });
    setShowCreateVersion(false);
  };

  const getSelectedVersionsData = () => {
    return selectedVersions.map(id => versions.find(v => v.id === id)).filter(Boolean) as ContentVersion[];
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20 p-4">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-600 animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="w-1/3 h-4 bg-gray-600 animate-pulse rounded" />
                <div className="w-1/2 h-3 bg-gray-600 animate-pulse rounded" />
              </div>
              <div className="w-20 h-8 bg-gray-600 animate-pulse rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Version History</h2>
          <p className="text-gray-400 mt-1">Track changes and manage content versions</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleCompareVersions}
            disabled={selectedVersions.length !== 2}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Compare Selected
          </Button>
          <Button
            onClick={() => setShowCreateVersion(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Version
          </Button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedVersions.length > 0 && (
        <Card className="bg-blue-500/10 border-blue-400/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-400 font-medium">
              {selectedVersions.length} version{selectedVersions.length > 1 ? 's' : ''} selected
              {selectedVersions.length === 2 && ' for comparison'}
            </span>
            <Button
              onClick={() => setSelectedVersions([])}
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300"
            >
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      {/* Version List */}
      <div className="space-y-4">
        {versions.map((version, index) => (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              'bg-white/10 backdrop-blur-md border-white/20 p-6 hover:bg-white/15 transition-colors cursor-pointer',
              selectedVersions.includes(version.id) && 'border-blue-400/50 bg-blue-500/10'
            )}>
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedVersions.includes(version.id)}
                  onChange={() => handleVersionSelect(version.id)}
                  className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                />
                
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    version.isActive ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                  )}>
                    v{version.version}
                  </div>
                  {version.isActive && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-medium text-white">{version.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{version.changeLog}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{version.createdBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{version.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    title="View Version"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    title="Download Version"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {!version.isActive && (
                    <Button
                      onClick={() => handleRevertToVersion(version.id)}
                      variant="ghost"
                      size="sm"
                      className="text-yellow-400 hover:text-yellow-300"
                      title="Revert to this Version"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Version Comparison Modal */}
      <AnimatePresence>
        {showCompare && selectedVersions.length === 2 && (
          <VersionCompare
            version1={getSelectedVersionsData()[0]}
            version2={getSelectedVersionsData()[1]}
            onClose={() => setShowCompare(false)}
          />
        )}
      </AnimatePresence>

      {/* Create Version Modal */}
      <AnimatePresence>
        {showCreateVersion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-lg border border-white/20 w-full max-w-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Create New Version</h3>
                  <Button
                    onClick={() => setShowCreateVersion(false)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Version Title
                    </label>
                    <input
                      type="text"
                      value={newVersionData.title}
                      onChange={(e) => setNewVersionData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                      placeholder="Enter version title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Change Log
                    </label>
                    <textarea
                      value={newVersionData.changeLog}
                      onChange={(e) => setNewVersionData(prev => ({ ...prev, changeLog: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                      placeholder="Describe what changed in this version..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => setShowCreateVersion(false)}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateVersion}
                      disabled={!newVersionData.title || !newVersionData.changeLog}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Create Version
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
