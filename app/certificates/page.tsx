'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Share2, Calendar, CheckCircle, Clock, Star, Shield, BookOpen, Code, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { SmartBreadcrumbs } from '@/components/navigation/SmartNavigation';
import { cn } from '@/lib/utils';

interface Certificate {
  id: string;
  title: string;
  description: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  blockchainTxHash?: string;
  ipfsHash?: string;
  credentialId: string;
  skills: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  type: 'Course' | 'Project' | 'Assessment' | 'Certification';
  verified: boolean;
  publicUrl?: string;
  badgeUrl?: string;
}

// Mock certificate data
const mockCertificates: Certificate[] = [
  {
    id: '1',
    title: 'Solidity Fundamentals',
    description: 'Completed comprehensive course covering Solidity basics, smart contract development, and deployment.',
    issuer: 'SolidityLearn Academy',
    issuedAt: new Date('2024-01-15'),
    blockchainTxHash: '0x1234567890abcdef1234567890abcdef12345678',
    ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    credentialId: 'SL-FUND-2024-001',
    skills: ['Solidity', 'Smart Contracts', 'Ethereum', 'Web3'],
    level: 'Beginner',
    type: 'Course',
    verified: true,
    publicUrl: 'https://certificates.soliditylearn.com/SL-FUND-2024-001',
    badgeUrl: '/badges/solidity-fundamentals.png'
  },
  {
    id: '2',
    title: 'DeFi Protocol Development',
    description: 'Built and deployed a complete DeFi lending protocol with advanced features.',
    issuer: 'SolidityLearn Academy',
    issuedAt: new Date('2024-01-10'),
    expiresAt: new Date('2026-01-10'),
    blockchainTxHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    credentialId: 'SL-DEFI-2024-002',
    skills: ['DeFi', 'Lending Protocols', 'Yield Farming', 'Governance'],
    level: 'Advanced',
    type: 'Project',
    verified: true,
    publicUrl: 'https://certificates.soliditylearn.com/SL-DEFI-2024-002'
  },
  {
    id: '3',
    title: 'Smart Contract Security Audit',
    description: 'Demonstrated expertise in identifying and fixing smart contract vulnerabilities.',
    issuer: 'Blockchain Security Institute',
    issuedAt: new Date('2024-01-05'),
    credentialId: 'BSI-SEC-2024-003',
    skills: ['Security Auditing', 'Vulnerability Assessment', 'Code Review'],
    level: 'Expert',
    type: 'Certification',
    verified: true
  },
  {
    id: '4',
    title: 'NFT Marketplace Development',
    description: 'Created a full-featured NFT marketplace with minting, trading, and royalty features.',
    issuer: 'SolidityLearn Academy',
    issuedAt: new Date('2023-12-20'),
    credentialId: 'SL-NFT-2023-004',
    skills: ['NFTs', 'ERC-721', 'ERC-1155', 'Marketplace'],
    level: 'Intermediate',
    type: 'Project',
    verified: false // Pending verification
  }
];

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [_selectedCertificate, _setSelectedCertificate] = useState<Certificate | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    onBlockchain: 0,
    byType: { Course: 0, Project: 0, Assessment: 0, Certification: 0 },
    byLevel: { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 }
  });

  // Fetch certificates from API
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          type: filter === 'all' ? 'all' : filter,
          limit: '20',
          offset: '0'
        });

        const response = await fetch(`/api/certificates?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch certificates');
        }

        const data = await response.json();
        setCertificates(data.certificates || []);
        setStats(data.stats || stats);
      } catch (error) {
        console.error('Error fetching certificates:', error);
        setError('Failed to load certificates. Please try again.');
        // Fallback to mock data
        setCertificates(mockCertificates);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, [filter]); // Re-fetch when filter changes

  const filteredCertificates = certificates.filter(cert => {
    if (filter === 'all') return true;
    if (filter === 'verified') return cert.verified;
    if (filter === 'pending') return !cert.verified;
    return cert.type.toLowerCase() === filter.toLowerCase();
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'text-green-400 bg-green-400/10';
      case 'Intermediate': return 'text-blue-400 bg-blue-400/10';
      case 'Advanced': return 'text-purple-400 bg-purple-400/10';
      case 'Expert': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Course': return BookOpen;
      case 'Project': return Code;
      case 'Assessment': return CheckCircle;
      case 'Certification': return Award;
      default: return Award;
    }
  };

  const handleDownload = (certificate: Certificate) => {
    // Simulate certificate download
    console.log('Downloading certificate:', certificate.id);
    // In a real app, this would generate and download a PDF
  };

  const handleShare = (certificate: Certificate) => {
    if (certificate.publicUrl) {
      navigator.clipboard.writeText(certificate.publicUrl);
      // Show toast notification
      console.log('Certificate URL copied to clipboard');
    }
  };

  const handleVerifyOnBlockchain = (certificate: Certificate) => {
    if (certificate.blockchainTxHash) {
      window.open(`https://etherscan.io/tx/${certificate.blockchainTxHash}`, '_blank');
    }
  };

  return (
    <ProtectedRoute permission={{ requireAuth: true }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <SmartBreadcrumbs />
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">My Certificates</h1>
            <p className="text-gray-300 text-lg">Your blockchain-verified achievements and credentials</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
              <div className="text-gray-400 text-sm">Total Certificates</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.verified}
              </div>
              <div className="text-gray-400 text-sm">Verified</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.onBlockchain}
              </div>
              <div className="text-gray-400 text-sm">On Blockchain</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.byLevel.Advanced + stats.byLevel.Expert}
              </div>
              <div className="text-gray-400 text-sm">Advanced+</div>
            </GlassCard>
          </div>

          {/* Filters */}
          <GlassCard className="p-6 mb-8">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  filter === 'all'
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
              >
                All Certificates
              </button>
              <button
                onClick={() => setFilter('verified')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  filter === 'verified'
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
              >
                Verified
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  filter === 'pending'
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('course')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  filter === 'course'
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
              >
                Courses
              </button>
              <button
                onClick={() => setFilter('project')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  filter === 'project'
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
              >
                Projects
              </button>
              <button
                onClick={() => setFilter('certification')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  filter === 'certification'
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
              >
                Certifications
              </button>
            </div>
          </GlassCard>

          {/* Error State */}
          {error && (
            <GlassCard className="p-6 mb-8">
              <div className="flex items-center space-x-3 text-red-400">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Error Loading Certificates</h3>
                  <p className="text-sm text-gray-400">{error}</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <GlassCard key={index} className="p-6 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-600 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-600 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                  </div>
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 bg-gray-600 rounded w-16"></div>
                    <div className="h-6 bg-gray-600 rounded w-20"></div>
                  </div>
                  <div className="flex space-x-1 mb-4">
                    <div className="h-5 bg-gray-600 rounded w-12"></div>
                    <div className="h-5 bg-gray-600 rounded w-16"></div>
                    <div className="h-5 bg-gray-600 rounded w-14"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-600 rounded flex-1"></div>
                    <div className="h-8 bg-gray-600 rounded w-10"></div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            /* Certificate Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => {
              const TypeIcon = getTypeIcon(certificate.type);
              
              return (
                <motion.div
                  key={certificate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-6 h-full hover:bg-white/10 transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white line-clamp-1">
                            {certificate.title}
                          </h3>
                          <p className="text-gray-400 text-sm">{certificate.issuer}</p>
                        </div>
                      </div>
                      
                      {certificate.verified ? (
                        <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      ) : (
                        <Clock className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {certificate.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        getLevelColor(certificate.level)
                      )}>
                        {certificate.level}
                      </span>
                      <span className="px-3 py-1 bg-blue-400/10 text-blue-400 rounded-full text-xs font-medium">
                        {certificate.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {certificate.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {certificate.skills.length > 3 && (
                        <span className="px-2 py-1 bg-white/10 text-gray-400 rounded text-xs">
                          +{certificate.skills.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{certificate.issuedAt.toLocaleDateString()}</span>
                      </div>
                      <span className="font-mono text-xs">
                        {certificate.credentialId}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(certificate)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </EnhancedButton>
                      
                      {certificate.publicUrl && (
                        <EnhancedButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(certificate)}
                        >
                          <Share2 className="w-4 h-4" />
                        </EnhancedButton>
                      )}
                      
                      {certificate.blockchainTxHash && (
                        <EnhancedButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyOnBlockchain(certificate)}
                        >
                          <Shield className="w-4 h-4" />
                        </EnhancedButton>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
          )}

          {!isLoading && filteredCertificates.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No certificates found</h3>
              <p className="text-gray-400 mb-6">
                {filter === 'all' 
                  ? "You haven't earned any certificates yet. Complete courses and projects to earn your first certificate!"
                  : "No certificates match the selected filter."
                }
              </p>
              {filter === 'all' && (
                <EnhancedButton
                  variant="default"
                  onClick={() => window.location.href = '/learn'}
                >
                  Start Learning
                </EnhancedButton>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
