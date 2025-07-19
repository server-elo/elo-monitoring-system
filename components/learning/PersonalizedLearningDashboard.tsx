// Personalized Learning Dashboard with AI-Powered Recommendations
// Displays adaptive learning insights, performance analytics, and personalized content

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Target,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  Zap,
  AlertCircle,
  CheckCircle,
  Star,
  ArrowRight,
  Calendar,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { Card } from '../ui/card';
;
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useAuth } from '../auth/EnhancedAuthProvider';
import { useToast } from '../ui/use-toast';
import { adaptiveLearning, LearningProfile, PerformanceAnalysis, LearningRecommendation } from '@/lib/learning/AdaptiveLearning';
import { logger } from '@/lib/api/logger';

interface PersonalizedLearningDashboardProps {
  className?: string;
}

interface LearningInsights {
  profile: LearningProfile;
  analysis: PerformanceAnalysis;
  recommendations: LearningRecommendation[];
  nextMilestone: { title: string; progress: number; eta: Date };
}

export const PersonalizedLearningDashboard: React.FC<PersonalizedLearningDashboardProps> = ({
  className = ''
}) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [_selectedRecommendation, setSelectedRecommendation] = useState<LearningRecommendation | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'analytics'>('overview');

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadInsights = async () => {
      try {
        setLoading(true);
        const data = await adaptiveLearning.getLearningInsights(user.id);
        setInsights(data);
      } catch (error) {
        logger.error('Failed to load learning insights:', {}, error as Error);
        toast({
          title: 'Error loading insights',
          description: 'Failed to load your personalized learning data.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [isAuthenticated, user, toast]);

  const handleRecommendationClick = (recommendation: LearningRecommendation) => {
    setSelectedRecommendation(recommendation);
    // Here you would navigate to the recommended content
    toast({
      title: 'Starting Learning Activity',
      description: `Beginning: ${recommendation.title}`,
      variant: 'default'
    });
  };

  const getPriorityColor = (priority: LearningRecommendation['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'EXPERT': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'ADVANCED': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'INTERMEDIATE': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'BEGINNER': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className={`personalized-learning-dashboard ${className}`}>
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mr-3" />
            <span>Loading your personalized learning insights...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className={`personalized-learning-dashboard ${className}`}>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Learning Data Available</h3>
          <p className="text-gray-600">Start learning to see your personalized insights!</p>
        </Card>
      </div>
    );
  }

  const { profile, analysis, recommendations, nextMilestone } = insights;

  return (
    <div className={`personalized-learning-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Your Learning Journey</h2>
        </div>
        <p className="text-gray-600">AI-powered insights tailored to your learning style and goals</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Skill Level</span>
                <Badge className={getSkillLevelColor(profile.skillLevel)}>
                  {profile.skillLevel}
                </Badge>
              </div>
              <div className="text-2xl font-bold">Level {profile.currentLevel}</div>
              <div className="text-sm text-gray-500">{profile.totalXP.toLocaleString()} XP</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Learning Streak</span>
                <Zap className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">{profile.streak} days</div>
              <div className="text-sm text-gray-500">Keep it up!</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Overall Progress</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{analysis.overallProgress}%</div>
              <div className="text-sm text-gray-500">Solidity mastery</div>
            </Card>
          </div>

          {/* Next Milestone */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Next Milestone</h3>
              </div>
              <Badge variant="outline">
                <Calendar className="w-3 h-3 mr-1" />
                {nextMilestone.eta.toLocaleDateString()}
              </Badge>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{nextMilestone.title}</span>
                <span>{nextMilestone.progress}%</span>
              </div>
              <Progress value={nextMilestone.progress} className="h-2" />
            </div>
            
            <p className="text-sm text-gray-600">
              You're making great progress! Keep learning consistently to reach your next level.
            </p>
          </Card>

          {/* Performance Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Your Strengths
              </h4>
              <div className="space-y-2">
                {analysis.strengthAreas.slice(0, 3).map((strength, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{strength.concept.replace('-', ' ')}</span>
                    <Badge variant="secondary">{Math.round(strength.mastery * 100)}%</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Areas to Improve
              </h4>
              <div className="space-y-2">
                {analysis.improvementAreas.slice(0, 3).map((area, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{area.concept.replace('-', ' ')}</span>
                    <Badge variant="outline">{Math.round(area.mastery * 100)}%</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Personalized Recommendations</h3>
            <Badge variant="secondary">{recommendations.length} suggestions</Badge>
          </div>

          <div className="grid gap-4">
            <AnimatePresence>
              {recommendations.map((recommendation, index) => (
                <motion.div
                  key={recommendation.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleRecommendationClick(recommendation)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                          {recommendation.type === 'concept' && <BookOpen className="w-4 h-4 text-blue-600" />}
                          {recommendation.type === 'challenge' && <Target className="w-4 h-4 text-blue-600" />}
                          {recommendation.type === 'project' && <Award className="w-4 h-4 text-blue-600" />}
                          {recommendation.type === 'review' && <Clock className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div>
                          <h4 className="font-semibold">{recommendation.title}</h4>
                          <p className="text-sm text-gray-600 capitalize">{recommendation.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {recommendation.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>⏱️ {recommendation.estimatedTime} min</span>
                        <span>📊 Difficulty: {recommendation.difficulty}/10</span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded text-xs text-blue-700 dark:text-blue-300">
                      💡 {recommendation.personalizedReason}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{analysis.learningVelocity}</div>
              <div className="text-sm text-gray-500">Concepts/week</div>
            </Card>

            <Card className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{analysis.retentionRate}%</div>
              <div className="text-sm text-gray-500">Retention rate</div>
            </Card>

            <Card className="p-4 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{analysis.engagementScore}%</div>
              <div className="text-sm text-gray-500">Engagement</div>
            </Card>

            <Card className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{Math.round(profile.performanceMetrics.timeSpentLearning / 60)}h</div>
              <div className="text-sm text-gray-500">Time spent</div>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Performance Breakdown</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Security Awareness</span>
                  <span>{profile.performanceMetrics.securityAwareness}%</span>
                </div>
                <Progress value={profile.performanceMetrics.securityAwareness} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Gas Optimization</span>
                  <span>{profile.performanceMetrics.gasOptimizationSkill}%</span>
                </div>
                <Progress value={profile.performanceMetrics.gasOptimizationSkill} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Code Quality</span>
                  <span>{profile.performanceMetrics.codeQualityScore}%</span>
                </div>
                <Progress value={profile.performanceMetrics.codeQualityScore} className="h-2" />
              </div>
            </div>
          </Card>

          {/* Predictions */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Learning Predictions</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <span className="text-sm">Completion Probability</span>
                <Badge className="bg-green-100 text-green-800">
                  {analysis.predictedOutcomes.completionProbability}%
                </Badge>
              </div>

              {analysis.predictedOutcomes.riskFactors.length > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <div className="text-sm font-medium mb-2">Risk Factors:</div>
                  <ul className="text-xs space-y-1">
                    {analysis.predictedOutcomes.riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-yellow-600" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default PersonalizedLearningDashboard;
