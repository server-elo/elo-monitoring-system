'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, MoreVertical, Edit, Trash2, Eye, CheckCircle, Clock, Plus, Download, Upload, Archive, Star, Calendar, BookOpen, PlayCircle, FileQuestion, Layers } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { AdminContent } from '@/lib/admin/types';
import { adminAuth, ADMIN_PERMISSIONS } from '@/lib/admin/auth';

interface ContentManagementProps {
  className?: string;
}

interface ContentTableProps {
  content: AdminContent[];
  selectedContent: Set<string>;
  onSelectContent: (contentId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onContentAction: (contentId: string, action: string) => void;
  loading?: boolean;
}

function ContentTable({ content, selectedContent, onSelectContent, onSelectAll, onContentAction, loading }: ContentTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400 bg-green-500/10';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'draft': return 'text-gray-400 bg-gray-500/10';
      case 'archived': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return BookOpen;
      case 'tutorial': return PlayCircle;
      case 'module': return Layers;
      case 'quiz': return FileQuestion;
      default: return FileText;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-gray-600 animate-pulse rounded" />
                <div className="w-8 h-8 bg-gray-600 animate-pulse rounded" />
                <div className="flex-1 space-y-2">
                  <div className="w-1/2 h-4 bg-gray-600 animate-pulse rounded" />
                  <div className="w-1/3 h-3 bg-gray-600 animate-pulse rounded" />
                </div>
                <div className="w-20 h-6 bg-gray-600 animate-pulse rounded" />
                <div className="w-16 h-6 bg-gray-600 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black/20 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedContent.size === content.length && content.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Content</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Type</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Author</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Performance</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Updated</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {content.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              
              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedContent.has(item.id)}
                      onChange={() => onSelectContent(item.id)}
                      className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <TypeIcon className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="font-medium text-white">{item.title}</div>
                        <div className="text-sm text-gray-400 max-w-xs truncate">{item.description}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={cn('text-xs', getDifficultyColor(item.difficulty))}>
                            {item.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400">{item.estimatedDuration}min</span>
                          {item.tags.length > 0 && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <div className="flex space-x-1">
                                {item.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs bg-blue-500/20 text-blue-400 px-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                                {item.tags.length > 2 && (
                                  <span className="text-xs text-gray-400">+{item.tags.length - 2}</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(item.status)
                    )}>
                      {item.status === 'published' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {item.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {item.status === 'archived' && <Archive className="w-3 h-3 mr-1" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">
                      <div>{item.authorName}</div>
                      <div className="text-xs text-gray-400">v{item.version}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Eye className="w-3 h-3" />
                        <span>{item.totalViews}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{item.completionRate}%</span>
                      </div>
                      {item.averageRating > 0 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-gray-400">{item.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(item.updatedAt)}</span>
                      </div>
                      {item.publishedAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          Published {formatDate(item.publishedAt)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        onClick={() => onContentAction(item.id, 'view')}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {adminAuth.hasPermission(ADMIN_PERMISSIONS.CONTENT_WRITE) && (
                        <Button
                          onClick={() => onContentAction(item.id, 'edit')}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function ContentManagement({ className }: ContentManagementProps) {
  const [content, setContent] = useState<AdminContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [searchQuery, statusFilter, typeFilter]);

  const loadContent = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock content data
    const mockContent: AdminContent[] = [
      {
        id: '1',
        title: 'Introduction to Solidity',
        type: 'lesson',
        status: 'published',
        authorId: 'author1',
        authorName: 'Jane Smith',
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-01-10'),
        publishedAt: new Date('2023-02-01'),
        version: 3,
        completionRate: 87,
        averageRating: 4.5,
        totalViews: 1250,
        totalCompletions: 1087,
        difficulty: 'beginner',
        estimatedDuration: 45,
        tags: ['solidity', 'basics', 'blockchain'],
        description: 'Learn the fundamentals of Solidity programming language',
        isDeleted: false
      },
      {
        id: '2',
        title: 'Smart Contract Security',
        type: 'tutorial',
        status: 'pending',
        authorId: 'author2',
        authorName: 'Bob Wilson',
        createdAt: new Date('2023-03-20'),
        updatedAt: new Date('2024-01-08'),
        version: 1,
        completionRate: 0,
        averageRating: 0,
        totalViews: 0,
        totalCompletions: 0,
        difficulty: 'advanced',
        estimatedDuration: 90,
        tags: ['security', 'best-practices', 'auditing'],
        description: 'Advanced security patterns and vulnerability prevention',
        isDeleted: false
      },
      {
        id: '3',
        title: 'DeFi Protocols Quiz',
        type: 'quiz',
        status: 'published',
        authorId: 'author3',
        authorName: 'Alice Johnson',
        createdAt: new Date('2023-05-10'),
        updatedAt: new Date('2024-01-05'),
        publishedAt: new Date('2023-06-01'),
        version: 2,
        completionRate: 72,
        averageRating: 4.2,
        totalViews: 890,
        totalCompletions: 641,
        difficulty: 'intermediate',
        estimatedDuration: 30,
        tags: ['defi', 'quiz', 'protocols'],
        description: 'Test your knowledge of DeFi protocols and mechanisms',
        isDeleted: false
      }
    ];

    setContent(mockContent);
    setLoading(false);
  };

  const handleSelectContent = (contentId: string) => {
    const newSelected = new Set(selectedContent);
    if (newSelected.has(contentId)) {
      newSelected.delete(contentId);
    } else {
      newSelected.add(contentId);
    }
    setSelectedContent(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedContent(new Set(content.map(item => item.id)));
    } else {
      setSelectedContent(new Set());
    }
  };

  const handleContentAction = (contentId: string, action: string) => {
    console.log(`Action ${action} on content ${contentId}`);
    // Implement content actions
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action ${action} on content:`, Array.from(selectedContent));
    // Implement bulk actions
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management</h1>
          <p className="text-gray-400 mt-1">Manage lessons, tutorials, and learning materials</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          {adminAuth.hasPermission(ADMIN_PERMISSIONS.CONTENT_WRITE) && (
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search content by title, author, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
          >
            <option value="all">All Types</option>
            <option value="lesson">Lessons</option>
            <option value="tutorial">Tutorials</option>
            <option value="module">Modules</option>
            <option value="quiz">Quizzes</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedContent.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-medium">
                {selectedContent.size} item{selectedContent.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleBulkAction('publish')}
                  size="sm"
                  variant="outline"
                  className="border-green-400/30 text-green-400 hover:bg-green-500/10"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Publish
                </Button>
                <Button
                  onClick={() => handleBulkAction('archive')}
                  size="sm"
                  variant="outline"
                  className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Archive
                </Button>
                <Button
                  onClick={() => handleBulkAction('delete')}
                  size="sm"
                  variant="outline"
                  className="border-red-400/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Content Table */}
      <ContentTable
        content={content}
        selectedContent={selectedContent}
        onSelectContent={handleSelectContent}
        onSelectAll={handleSelectAll}
        onContentAction={handleContentAction}
        loading={loading}
      />
    </div>
  );
}
