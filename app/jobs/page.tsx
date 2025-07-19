'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock, DollarSign, Search, ExternalLink, Building, TrendingUp } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { SmartBreadcrumbs } from '@/components/navigation/SmartNavigation';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  salary: string;
  experience: 'Entry' | 'Mid' | 'Senior' | 'Lead';
  skills: string[];
  description: string;
  postedAt: Date;
  featured: boolean;
  remote: boolean;
  companyLogo?: string;
}

// Mock job data
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Solidity Developer',
    company: 'DeFi Protocol',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $180k',
    experience: 'Senior',
    skills: ['Solidity', 'Web3.js', 'Hardhat', 'OpenZeppelin'],
    description: 'Build next-generation DeFi protocols with cutting-edge smart contract technology.',
    postedAt: new Date('2024-01-10'),
    featured: true,
    remote: true
  },
  {
    id: '2',
    title: 'Blockchain Engineer',
    company: 'CryptoStartup',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$90k - $140k',
    experience: 'Mid',
    skills: ['Solidity', 'React', 'Node.js', 'Ethereum'],
    description: 'Join our team building the future of decentralized applications.',
    postedAt: new Date('2024-01-08'),
    featured: false,
    remote: false
  },
  {
    id: '3',
    title: 'Smart Contract Auditor',
    company: 'Security Firm',
    location: 'Remote',
    type: 'Contract',
    salary: '$80 - $150/hour',
    experience: 'Senior',
    skills: ['Solidity', 'Security', 'Mythril', 'Slither'],
    description: 'Audit smart contracts for security vulnerabilities and best practices.',
    postedAt: new Date('2024-01-05'),
    featured: true,
    remote: true
  },
  {
    id: '4',
    title: 'Junior Blockchain Developer',
    company: 'Web3 Agency',
    location: 'Austin, TX',
    type: 'Full-time',
    salary: '$60k - $80k',
    experience: 'Entry',
    skills: ['Solidity', 'JavaScript', 'Git', 'Testing'],
    description: 'Perfect entry-level position for new blockchain developers.',
    postedAt: new Date('2024-01-03'),
    featured: false,
    remote: true
  }
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedExperience, setSelectedExperience] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          search: searchTerm,
          type: selectedType,
          experience: selectedExperience,
          location: selectedLocation,
          limit: '20',
          offset: '0'
        });

        const response = await fetch(`/api/jobs?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }

        const data = await response.json();
        setJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load jobs. Please try again.');
        // Fallback to mock data
        setJobs(mockJobs);
        setFilteredJobs(mockJobs);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [searchTerm, selectedType, selectedExperience, selectedLocation]);

  // Filter jobs based on search and filters (for client-side filtering as backup)
  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(job => job.type === selectedType);
    }

    // Experience filter
    if (selectedExperience !== 'all') {
      filtered = filtered.filter(job => job.experience === selectedExperience);
    }

    // Location filter
    if (selectedLocation !== 'all') {
      if (selectedLocation === 'remote') {
        filtered = filtered.filter(job => job.remote);
      } else {
        filtered = filtered.filter(job => job.location.includes(selectedLocation));
      }
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, selectedType, selectedExperience, selectedLocation]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case 'Entry': return 'text-green-400 bg-green-400/10';
      case 'Mid': return 'text-blue-400 bg-blue-400/10';
      case 'Senior': return 'text-purple-400 bg-purple-400/10';
      case 'Lead': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
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
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Blockchain Jobs</h1>
            <p className="text-gray-300 text-lg">Find your next opportunity in Web3 and blockchain development</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{filteredJobs.length}</div>
              <div className="text-gray-400 text-sm">Open Positions</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">85%</div>
              <div className="text-gray-400 text-sm">Remote Friendly</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">$120k</div>
              <div className="text-gray-400 text-sm">Avg. Salary</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">50+</div>
              <div className="text-gray-400 text-sm">Companies</div>
            </GlassCard>
          </div>

          {/* Search and Filters */}
          <GlassCard className="p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Job Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
              </select>

              {/* Experience Filter */}
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="Entry">Entry Level</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior Level</option>
                <option value="Lead">Lead Level</option>
              </select>

              {/* Location Filter */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Locations</option>
                <option value="remote">Remote</option>
                <option value="San Francisco">San Francisco</option>
                <option value="New York">New York</option>
                <option value="Austin">Austin</option>
              </select>
            </div>
          </GlassCard>

          {/* Job Listings */}
          <div className="space-y-6">
            {filteredJobs.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
                <p className="text-gray-400">Try adjusting your search criteria or filters.</p>
              </GlassCard>
            ) : (
              filteredJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className={cn(
                    "p-6 hover:bg-white/10 transition-all duration-200 cursor-pointer",
                    job.featured && "border-yellow-400/30 bg-yellow-400/5"
                  )}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                              {job.featured && (
                                <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 text-xs font-medium rounded-full">
                                  Featured
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-gray-400 text-sm mb-3">
                              <div className="flex items-center space-x-1">
                                <Building className="w-4 h-4" />
                                <span>{job.company}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(job.postedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-4 line-clamp-2">{job.description}</p>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            getExperienceColor(job.experience)
                          )}>
                            {job.experience}
                          </span>
                          <span className="px-3 py-1 bg-blue-400/10 text-blue-400 rounded-full text-xs font-medium">
                            {job.type}
                          </span>
                          {job.remote && (
                            <span className="px-3 py-1 bg-green-400/10 text-green-400 rounded-full text-xs font-medium">
                              Remote
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="px-2 py-1 bg-white/10 text-gray-400 rounded text-xs">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col items-end space-y-3">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">{job.salary}</div>
                          <div className="text-sm text-gray-400">{job.type}</div>
                        </div>
                        
                        <EnhancedButton
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            // Handle job application
                            console.log('Apply to job:', job.id);
                          }}
                        >
                          Apply Now
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </EnhancedButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
          </div>

          {/* Load More */}
          {filteredJobs.length > 0 && (
            <div className="text-center mt-8">
              <EnhancedButton
                variant="outline"
                size="lg"
                onClick={() => {
                  // Load more jobs
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 1000);
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More Jobs'}
              </EnhancedButton>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
