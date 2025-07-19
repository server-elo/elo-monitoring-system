'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Calendar,
  MapPin,
  Github,
  Twitter,
  Linkedin,
  Edit3,
  Save,
  X,
  Trophy,
  Target,
  Clock,
  Code,
  Users,
  Star,
  TrendingUp
} from 'lucide-react';
// Card components not used - using GlassCard instead
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { useForm, formSchemas, updateForm } from '@/lib/forms/form-handler';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio: string;
  location: string;
  joinedAt: Date;
  github?: string;
  twitter?: string;
  linkedin?: string;
  stats: {
    totalXP: number;
    level: number;
    completedCourses: number;
    contractsDeployed: number;
    collaborations: number;
    currentStreak: number;
    totalStudyTime: number; // in minutes
  };
  achievements: Array<{
    id: string;
    title: string;
    icon: string;
    unlockedAt: Date;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'course_completed' | 'contract_deployed' | 'achievement_unlocked' | 'collaboration';
    title: string;
    timestamp: Date;
    xpGained?: number;
  }>;
}

export function UserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: '',
    github: '',
    twitter: '',
    linkedin: ''
  });

  const profileForm = useForm({
    initialValues: {
      name: '',
      bio: '',
      location: '',
      github: '',
      twitter: '',
      linkedin: '',
    },
    validationSchema: formSchemas.profile,
    onSubmit: async (values) => {
      await updateForm('/api/user/profile', values);
    },
    onSuccess: () => {
      setIsEditing(false);
      // Update local profile state
      if (profile) {
        setProfile({ ...profile, ...profileForm.values });
      }
    },
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    // Simulate loading user profile from API
    const mockProfile: UserProfile = {
      id: 'user-1',
      name: 'Alex Developer',
      email: 'alex@example.com',
      avatar: '/api/placeholder/150/150',
      bio: 'Passionate blockchain developer learning Solidity and smart contract development. Love building decentralized applications and exploring Web3 technologies.',
      location: 'San Francisco, CA',
      joinedAt: new Date('2024-01-15'),
      github: 'alexdev',
      twitter: 'alexdev',
      linkedin: 'alexdeveloper',
      stats: {
        totalXP: 2450,
        level: 8,
        completedCourses: 12,
        contractsDeployed: 25,
        collaborations: 18,
        currentStreak: 7,
        totalStudyTime: 1440, // 24 hours
      },
      achievements: [
        { id: '1', title: 'First Contract', icon: '🎯', unlockedAt: new Date('2024-01-20') },
        { id: '2', title: 'Security Expert', icon: '🛡️', unlockedAt: new Date('2024-02-15') },
        { id: '3', title: 'Collaboration Master', icon: '👥', unlockedAt: new Date('2024-03-01') },
      ],
      recentActivity: [
        {
          id: '1',
          type: 'course_completed',
          title: 'Advanced Smart Contract Security',
          timestamp: new Date('2024-03-15'),
          xpGained: 200,
        },
        {
          id: '2',
          type: 'contract_deployed',
          title: 'ERC-721 NFT Contract',
          timestamp: new Date('2024-03-14'),
          xpGained: 150,
        },
        {
          id: '3',
          type: 'achievement_unlocked',
          title: 'Security Expert',
          timestamp: new Date('2024-03-13'),
          xpGained: 300,
        },
      ],
    };

    setProfile(mockProfile);
    setEditForm({
      name: mockProfile.name,
      bio: mockProfile.bio,
      location: mockProfile.location,
      github: mockProfile.github || '',
      twitter: mockProfile.twitter || '',
      linkedin: mockProfile.linkedin || '',
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    // Simulate API call to update profile
    const updatedProfile = {
      ...profile,
      ...editForm,
    };

    setProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (!profile) return;
    
    setEditForm({
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      github: profile.github || '',
      twitter: profile.twitter || '',
      linkedin: profile.linkedin || '',
    });
    setIsEditing(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course_completed': return <Target className="w-4 h-4" />;
      case 'contract_deployed': return <Code className="w-4 h-4" />;
      case 'achievement_unlocked': return <Trophy className="w-4 h-4" />;
      case 'collaboration': return <Users className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'course_completed': return 'text-blue-400';
      case 'contract_deployed': return 'text-green-400';
      case 'achievement_unlocked': return 'text-yellow-400';
      case 'collaboration': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const xpToNextLevel = (profile.stats.level * 500) - (profile.stats.totalXP % 500);
  const levelProgress = ((profile.stats.totalXP % 500) / 500) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold gradient-text mb-4">User Profile</h1>
        <p className="text-xl text-gray-300">
          Manage your account and track your learning progress
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Basic Info Card */}
          <GlassCard className="p-6">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Profile Information</h2>
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-start space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Full Name"
                      className="bg-white/10 border-white/20"
                    />
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Bio"
                      rows={3}
                      className="bg-white/10 border-white/20"
                    />
                    <Input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="Location"
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">{profile.name}</h3>
                    <p className="text-gray-300">{profile.bio}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{profile.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {profile.joinedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <h4 className="text-lg font-semibold text-white mb-4">Social Links</h4>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Github className="w-5 h-5 text-gray-400" />
                    <Input
                      value={editForm.github}
                      onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                      placeholder="GitHub username"
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Twitter className="w-5 h-5 text-gray-400" />
                    <Input
                      value={editForm.twitter}
                      onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                      placeholder="Twitter username"
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Linkedin className="w-5 h-5 text-gray-400" />
                    <Input
                      value={editForm.linkedin}
                      onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                      placeholder="LinkedIn username"
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex space-x-4">
                  {profile.github && (
                    <a
                      href={`https://github.com/${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <Github className="w-5 h-5" />
                      <span>@{profile.github}</span>
                    </a>
                  )}
                  {profile.twitter && (
                    <a
                      href={`https://twitter.com/${profile.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <Twitter className="w-5 h-5" />
                      <span>@{profile.twitter}</span>
                    </a>
                  )}
                  {profile.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <Linkedin className="w-5 h-5" />
                      <span>@{profile.linkedin}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Level & XP */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Level & Experience</h3>
            <div className="text-center space-y-4">
              <div className="text-3xl font-bold text-purple-400">Level {profile.stats.level}</div>
              <div className="space-y-2">
                <Progress value={levelProgress} className="h-3" />
                <div className="text-sm text-gray-400">
                  {profile.stats.totalXP % 500} / 500 XP ({xpToNextLevel} XP needed)
                </div>
              </div>
              <div className="text-lg text-white">
                Total XP: <span className="text-yellow-400">{profile.stats.totalXP}</span>
              </div>
            </div>
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Courses</span>
                </div>
                <span className="text-white font-semibold">{profile.stats.completedCourses}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Code className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Contracts</span>
                </div>
                <span className="text-white font-semibold">{profile.stats.contractsDeployed}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Collaborations</span>
                </div>
                <span className="text-white font-semibold">{profile.stats.collaborations}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300">Streak</span>
                </div>
                <span className="text-white font-semibold">{profile.stats.currentStreak} days</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Study Time</span>
                </div>
                <span className="text-white font-semibold">{Math.floor(profile.stats.totalStudyTime / 60)}h</span>
              </div>
            </div>
          </GlassCard>

          {/* Recent Achievements */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Achievements</h3>
            <div className="space-y-3">
              {profile.achievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{achievement.title}</div>
                    <div className="text-xs text-gray-400">
                      {achievement.unlockedAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {profile.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg bg-white/5">
                <div className={`p-2 rounded-full bg-white/10 ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{activity.title}</div>
                  <div className="text-sm text-gray-400">
                    {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {activity.xpGained && (
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                    +{activity.xpGained} XP
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
